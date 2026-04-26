// ============================================================
// Custom server: Next.js + Socket.IO on the same port
// This approach avoids App Router complications with WebSockets.
// Run with: npx ts-node --esm server/index.ts
// Or via the dev script which uses tsx.
// ============================================================

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers';
import { handleStripeRoute } from './stripeRoutes';
import type { ClientToServerEvents, ServerToClientEvents } from '../src/lib/game/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    // Handle Stripe API routes before Next.js
    if (req.url?.startsWith('/api/stripe/') || req.url?.startsWith('/api/admin/')) {
      try {
        const handled = await handleStripeRoute(req, res);
        if (handled) return;
      } catch (err) {
        console.error('[Stripe] Route error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return;
      }
    }

    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // Ping settings for reconnection
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  registerSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running`);
  });
});
