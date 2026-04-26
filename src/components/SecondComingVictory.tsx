'use client';

import { useEffect, useState } from 'react';

/**
 * Animated Second Coming victory screen
 * Inspired by classic Adventist depictions of Christ's return —
 * golden light breaking through clouds, angels descending,
 * the sky splitting with radiant glory.
 */
export default function SecondComingVictory() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Sky splits
      setTimeout(() => setPhase(2), 1500),  // Light floods
      setTimeout(() => setPhase(3), 2500),  // Text appears
      setTimeout(() => setPhase(4), 3500),  // Full glory
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: '#030810' }}>
      {/* Stars background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(1px 1px at 20% 30%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 40% 70%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 60% 20%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 80% 50%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 10% 80%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 70% 90%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 30% 10%, white 0.5px, transparent 1px), radial-gradient(1px 1px at 90% 40%, white 0.5px, transparent 1px)',
        opacity: phase >= 1 ? 0.3 : 0.8,
        transition: 'opacity 2s ease',
      }} />

      {/* Cloud layer — dark, parting */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(20,25,50,0.6) 50%, rgba(10,15,30,0.9) 80%)',
        opacity: phase >= 2 ? 0.3 : 0.8,
        transition: 'opacity 2s ease',
      }} />

      {/* Golden light burst from center */}
      <div className="absolute inset-0 flex items-center justify-center" style={{
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 1.5s ease',
      }}>
        {/* Outer glow */}
        <div style={{
          position: 'absolute',
          width: phase >= 4 ? '200vmax' : '60vmax',
          height: phase >= 4 ? '200vmax' : '60vmax',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.4) 0%, rgba(212,168,67,0.1) 30%, transparent 70%)',
          transition: 'all 3s ease-out',
        }} />

        {/* Inner radiance */}
        <div style={{
          position: 'absolute',
          width: phase >= 2 ? '80vmin' : '20vmin',
          height: phase >= 2 ? '80vmin' : '20vmin',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,248,220,0.9) 0%, rgba(212,168,67,0.6) 25%, rgba(212,168,67,0.2) 50%, transparent 70%)',
          transition: 'all 2s ease-out',
          boxShadow: phase >= 2 ? '0 0 120px 60px rgba(212,168,67,0.3), 0 0 240px 120px rgba(212,168,67,0.15)' : 'none',
        }} />

        {/* Core brilliance */}
        <div style={{
          position: 'absolute',
          width: phase >= 2 ? '30vmin' : '5vmin',
          height: phase >= 2 ? '30vmin' : '5vmin',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,248,220,0.8) 40%, rgba(212,168,67,0.4) 70%, transparent 100%)',
          transition: 'all 2s ease-out',
        }} />
      </div>

      {/* Light rays */}
      <div className="absolute inset-0 flex items-center justify-center" style={{
        opacity: phase >= 2 ? 0.6 : 0,
        transition: 'opacity 2s ease',
      }}>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <div key={angle} style={{
            position: 'absolute',
            width: '2px',
            height: phase >= 4 ? '100vh' : '40vh',
            background: 'linear-gradient(to bottom, rgba(255,248,220,0.8), rgba(212,168,67,0.3), transparent)',
            transformOrigin: 'center top',
            transform: `rotate(${angle}deg)`,
            transition: 'height 3s ease-out',
          }} />
        ))}
      </div>

      {/* Angel silhouettes — descending */}
      <div className="absolute inset-0" style={{
        opacity: phase >= 3 ? 0.7 : 0,
        transition: 'opacity 1.5s ease',
      }}>
        {[
          { x: '20%', y: phase >= 4 ? '35%' : '15%', size: 20, delay: '0s' },
          { x: '35%', y: phase >= 4 ? '30%' : '10%', size: 24, delay: '0.3s' },
          { x: '65%', y: phase >= 4 ? '30%' : '10%', size: 24, delay: '0.5s' },
          { x: '80%', y: phase >= 4 ? '35%' : '15%', size: 20, delay: '0.2s' },
          { x: '25%', y: phase >= 4 ? '25%' : '5%', size: 16, delay: '0.7s' },
          { x: '75%', y: phase >= 4 ? '25%' : '5%', size: 16, delay: '0.8s' },
          { x: '50%', y: phase >= 4 ? '20%' : '0%', size: 28, delay: '0.4s' },
        ].map((angel, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: angel.x,
            top: angel.y,
            transform: 'translateX(-50%)',
            transition: `top 3s ease-out ${angel.delay}`,
            fontSize: `${angel.size}px`,
            color: 'rgba(255,248,220,0.6)',
            textShadow: '0 0 20px rgba(212,168,67,0.5)',
          }}>
            {/* Simple angel wing shape using unicode */}
            <svg width={angel.size * 2} height={angel.size * 2} viewBox="0 0 40 40" fill="none">
              <path d="M20 8 L8 20 L12 20 L10 28 L16 24 L18 32 L20 24 L22 32 L24 24 L30 28 L28 20 L32 20 Z"
                fill="rgba(255,248,220,0.4)" stroke="rgba(255,248,220,0.6)" strokeWidth="0.5"/>
            </svg>
          </div>
        ))}
      </div>

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-6" style={{
        opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1.5s ease-out',
      }}>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-center leading-tight mb-4"
          style={{
            color: '#fef3c7',
            textShadow: '0 0 40px rgba(212,168,67,0.6), 0 0 80px rgba(212,168,67,0.3)',
          }}>
          He Is Coming!
        </h1>
        <p className="font-serif italic text-lg md:text-xl text-center max-w-lg mb-3"
          style={{ color: 'rgba(255,248,220,0.8)' }}>
          &ldquo;And this gospel of the kingdom will be preached in the whole world as a testimony to all nations, and then the end will come.&rdquo;
        </p>
        <p className="text-sm" style={{ color: 'rgba(212,168,67,0.7)' }}>
          — Matthew 24:14
        </p>
      </div>

      {/* Floating particles of light */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 2s ease',
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            borderRadius: '50%',
            background: 'rgba(255,248,220,0.6)',
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
