'use client';

import { useState } from 'react';

interface Props {
  roomCode: string;
  onClose: () => void;
  onCouponApplied?: () => void;
  playerCount: number;
}

export default function PaywallModal({ roomCode, onClose, onCouponApplied, playerCount }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, roomCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Store email for later verification
      localStorage.setItem('gc_host_email', email);

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Failed to connect to payment server');
      setLoading(false);
    }
  };

  const handleCouponSubmit = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/check-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        localStorage.setItem(`coupon-${roomCode}`, couponCode.trim());
        setCouponSuccess(true);
        setTimeout(() => {
          onCouponApplied?.();
          onClose();
        }, 1500);
      } else {
        setError('Invalid coupon code');
      }
    } catch {
      setError('Failed to verify coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  if (couponSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="game-card w-full max-w-md border border-success/30 bg-[#0d1229] text-center py-10">
          <div className="text-4xl mb-3">&#x2713;</div>
          <h2 className="font-serif text-2xl font-bold text-success mb-2">Coupon Applied!</h2>
          <p className="text-muted text-sm">Game unlocked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="game-card w-full max-w-md border border-gold/30 bg-[#0d1229]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">&#x1F451;</div>
          <h2 className="font-serif text-2xl font-bold text-gold mb-2">Unlock Full Game</h2>
          <p className="text-muted text-sm">
            Games with 7+ players require a Pro subscription
          </p>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <span className="text-3xl font-bold text-light">$2.99</span>
          <span className="text-muted text-sm">/month</span>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-6">
          {[
            'Larger games (7-15 players)',
            'Support ongoing development',
            'Cancel anytime',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-light/90">
              <span className="text-success text-lg leading-none">&#x2713;</span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Email input */}
        <div className="mb-4">
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-light placeholder-white/30 text-sm focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-danger text-xs text-center mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Redirecting...' : 'Subscribe with Stripe'}
          </button>

          {/* Coupon section */}
          {!showCoupon ? (
            <button
              onClick={() => setShowCoupon(true)}
              className="w-full py-2 text-xs text-gold/70 hover:text-gold transition-colors"
            >
              Have a coupon?
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCouponSubmit()}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-light placeholder-white/30 text-sm focus:outline-none focus:border-gold/50 transition-colors"
              />
              <button
                onClick={handleCouponSubmit}
                disabled={couponLoading}
                className="px-4 py-2 rounded-lg bg-gold/20 border border-gold/30 text-gold text-sm hover:bg-gold/30 transition-colors"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-muted hover:text-light transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Fine print */}
        <p className="text-center text-[10px] text-muted/60 mt-4">
          Powered by Stripe. Your payment info is never stored on our servers.
        </p>
      </div>
    </div>
  );
}
