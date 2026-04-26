// ============================================================
// Stripe routes for subscription management
// Handles checkout, webhooks, and subscription status checks
// ============================================================

import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';
import { getSubscription, setSubscription, isSubscribed, isGlobalFree, readAdminConfig, writeAdminConfig } from './subscriptionStore';

let stripe: Stripe | null = null;

function initStripe(): Stripe | null {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set — monetization disabled, all games free');
    return null;
  }
  stripe = new Stripe(key);
  return stripe;
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getOrigin(req: IncomingMessage): string {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'] || 'localhost:3000';
  return `${proto}://${host}`;
}

async function handleCreateCheckout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const s = initStripe();
  if (!s) {
    sendJson(res, 503, { error: 'Stripe not configured' });
    return;
  }

  const raw = await parseBody(req);
  let email: string;
  let roomCode: string;
  try {
    const parsed = JSON.parse(raw);
    email = parsed.email;
    roomCode = parsed.roomCode;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  if (!email || !roomCode) {
    sendJson(res, 400, { error: 'Missing email or roomCode' });
    return;
  }

  try {
    const priceId = process.env.STRIPE_PRICE_ID;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      customer_email: email,
      success_url: `${getOrigin(req)}/room/${roomCode}?subscription=success`,
      cancel_url: `${getOrigin(req)}/room/${roomCode}?subscription=cancelled`,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [{
            price_data: {
              currency: 'usd',
              product_data: { name: 'The Great Controversy — Pro' },
              unit_amount: 299,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          }],
    };

    const session = await s.checkout.sessions.create(sessionParams);
    sendJson(res, 200, { url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe] Checkout error:', message);
    sendJson(res, 500, { error: 'Failed to create checkout session' });
  }
}

async function handleWebhook(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const s = initStripe();
  if (!s) {
    sendJson(res, 503, { error: 'Stripe not configured' });
    return;
  }

  const rawBody = await parseBody(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = s.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Stripe] Webhook signature verification failed:', message);
      sendJson(res, 400, { error: 'Webhook signature verification failed' });
      return;
    }
  } else {
    // No webhook secret — parse the event directly (dev/test mode)
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
    } catch {
      sendJson(res, 400, { error: 'Invalid webhook payload' });
      return;
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email;
        if (email && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
          const customerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id ?? '';

          // Set expiry 35 days from now (webhook will update on renewal)
          setSubscription(email, {
            stripeCustomerId: customerId,
            subscriptionId,
            status: 'active',
            expiresAt: Date.now() + 35 * 24 * 60 * 60 * 1000,
          });
          console.log(`[Stripe] Subscription activated for ${email}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const customer = await s.customers.retrieve(customerId);
        if (!customer.deleted && customer.email) {
          setSubscription(customer.email, {
            stripeCustomerId: customerId,
            subscriptionId: sub.id,
            status: sub.status === 'active' ? 'active' : sub.status,
            expiresAt: sub.status === 'active'
              ? Date.now() + 35 * 24 * 60 * 60 * 1000
              : Date.now(),
          });
          console.log(`[Stripe] Subscription updated for ${customer.email}: ${sub.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        const customer = await s.customers.retrieve(customerId);
        if (!customer.deleted && customer.email) {
          setSubscription(customer.email, {
            stripeCustomerId: customerId,
            subscriptionId: sub.id,
            status: 'cancelled',
            expiresAt: Date.now(),
          });
          console.log(`[Stripe] Subscription cancelled for ${customer.email}`);
        }
        break;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Stripe] Webhook handling error:', message);
  }

  sendJson(res, 200, { received: true });
}

function handleCheck(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const email = url.searchParams.get('email');
  if (!email) {
    sendJson(res, 400, { error: 'Missing email parameter' });
    return;
  }

  // If Stripe is not configured, everyone is subscribed (graceful degradation)
  if (!process.env.STRIPE_SECRET_KEY) {
    sendJson(res, 200, { subscribed: true });
    return;
  }

  // Check admin global free toggle
  if (isGlobalFree()) {
    sendJson(res, 200, { subscribed: true, reason: 'free' });
    return;
  }

  // Check Sabbath flag from client
  const sabbath = url.searchParams.get('sabbath');
  if (sabbath === 'true') {
    sendJson(res, 200, { subscribed: true, reason: 'sabbath' });
    return;
  }

  sendJson(res, 200, { subscribed: isSubscribed(email) });
}

const VALID_COUPONS = ['sabbath777'];

async function handleCheckCoupon(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await parseBody(req);
  let code: string;
  try {
    const parsed = JSON.parse(raw);
    code = parsed.code;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  if (!code) {
    sendJson(res, 400, { error: 'Missing code' });
    return;
  }

  const valid = VALID_COUPONS.includes(code.toLowerCase().trim());
  sendJson(res, 200, { valid });
}

async function handleAdminSetFree(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await parseBody(req);
  let password: string;
  let free: boolean;
  let until: string | undefined;
  try {
    const parsed = JSON.parse(raw);
    password = parsed.password;
    free = parsed.free;
    until = parsed.until;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'GC_Admin_2026';
  if (password !== adminPassword) {
    sendJson(res, 403, { error: 'Invalid password' });
    return;
  }

  if (free) {
    writeAdminConfig({
      globalFree: !until,
      globalFreeUntil: until ?? null,
    });
  } else {
    writeAdminConfig({
      globalFree: false,
      globalFreeUntil: null,
    });
  }

  const status = readAdminConfig();
  sendJson(res, 200, { success: true, status });
}

function handleAdminStatus(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? '', `http://${req.headers.host}`);
  const password = url.searchParams.get('password');

  const adminPassword = process.env.ADMIN_PASSWORD || 'GC_Admin_2026';
  if (password !== adminPassword) {
    sendJson(res, 403, { error: 'Invalid password' });
    return;
  }

  const status = readAdminConfig();
  sendJson(res, 200, status);
}

/**
 * Handle Stripe API routes. Returns true if the request was handled.
 */
export async function handleStripeRoute(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url ?? '';

  // CORS headers for API routes
  if (url.startsWith('/api/stripe/') || url.startsWith('/api/admin/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return true;
    }
  }

  if (url === '/api/stripe/create-checkout' && req.method === 'POST') {
    await handleCreateCheckout(req, res);
    return true;
  }

  if (url === '/api/stripe/webhook' && req.method === 'POST') {
    await handleWebhook(req, res);
    return true;
  }

  if (url === '/api/stripe/check-coupon' && req.method === 'POST') {
    await handleCheckCoupon(req, res);
    return true;
  }

  if (url.startsWith('/api/stripe/check') && req.method === 'GET') {
    handleCheck(req, res);
    return true;
  }

  if (url === '/api/admin/set-free' && req.method === 'POST') {
    await handleAdminSetFree(req, res);
    return true;
  }

  if (url.startsWith('/api/admin/status') && req.method === 'GET') {
    handleAdminStatus(req, res);
    return true;
  }

  return false;
}
