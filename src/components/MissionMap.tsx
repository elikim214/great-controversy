'use client';

import type { ClientMission } from '@/lib/game/types';

interface Props {
  missions: ClientMission[];
  currentIndex: number;
}

// Equirectangular projection: convert lat/lng to percentage positions
// Map image is a standard equirectangular world map (1280x712)
function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100; // 0-100%
  const y = ((90 - lat) / 180) * 100;  // 0-100% (top=north)
  return { x, y };
}

export default function MissionMap({ missions, currentIndex }: Props) {
  // Collect completed + current mission positions
  const points = missions
    .slice(0, currentIndex + 1)
    .filter(m => m.location?.lat != null && m.location?.lng != null)
    .map(m => project(m.location.lat, m.location.lng));

  if (points.length === 0) return null;

  return (
    <div
      className="w-full overflow-hidden rounded-lg animate-fade-in relative"
      style={{
        height: '140px',
        border: '1px solid var(--card-border)',
        background: '#080c16',
      }}
      aria-hidden="true"
    >
      {/* Real world map image */}
      <img
        src="/locations/world-map.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: 0.25,
          filter: 'brightness(0.8) sepia(0.3) hue-rotate(180deg)',
        }}
      />

      {/* SVG overlay for dots and trail */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Trail connecting missions */}
        {points.length > 1 && (
          <path
            d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeDasharray="1.5 1"
            opacity="0.7"
            className="mission-map-trail"
          />
        )}

        {/* Completed mission dots */}
        {points.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.2"
            fill="var(--accent-gold)"
            opacity="0.9"
          />
        ))}

        {/* Current mission dot (pulsing) */}
        {points.length > 0 && (
          <g>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="2"
              fill="var(--accent-blue)"
              opacity="0.3"
              className="mission-map-pulse"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="1.2"
              fill="var(--accent-blue)"
            />
          </g>
        )}
      </svg>

      {/* Subtle gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, rgba(8,12,22,0.5) 0%, transparent 15%, transparent 85%, rgba(8,12,22,0.5) 100%)',
        }}
      />
    </div>
  );
}
