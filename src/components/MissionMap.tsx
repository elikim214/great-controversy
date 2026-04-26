'use client';

import type { ClientMission } from '@/lib/game/types';

interface Props {
  missions: ClientMission[];
  currentIndex: number;
}

// Miller cylindrical projection: convert lat/lng to SVG x/y
function project(lat: number, lng: number): { x: number; y: number } {
  const x = (lng + 180) * (360 / 360); // 0-360
  const y = (90 - lat) * (180 / 180);  // 0-180 (top=north)
  return { x, y };
}

export default function MissionMap({ missions, currentIndex }: Props) {
  // Collect completed + current mission positions
  const points = missions
    .slice(0, currentIndex + 1)
    .filter(m => m.location?.lat != null && m.location?.lng != null)
    .map(m => project(m.location.lat, m.location.lng));

  if (points.length === 0) return null;

  // Build trail path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div
      className="w-full overflow-hidden rounded-lg animate-fade-in"
      style={{
        maxHeight: '120px',
        background: 'rgba(10, 14, 26, 0.6)',
        border: '1px solid var(--card-border)',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 360 180"
        className="w-full h-full"
        style={{ minHeight: '80px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Simplified world map outline — major continent shapes */}
        <g opacity="0.15" fill="none" stroke="var(--card-border)" strokeWidth="0.5">
          {/* North America */}
          <path d="M30,45 L80,30 L120,35 L130,50 L120,65 L100,75 L80,80 L60,70 L40,60 Z" />
          {/* South America */}
          <path d="M85,90 L100,85 L110,95 L108,120 L100,140 L90,150 L80,135 L78,110 L82,95 Z" />
          {/* Europe */}
          <path d="M160,35 L180,30 L200,32 L195,45 L185,50 L170,48 L165,42 Z" />
          {/* Africa */}
          <path d="M160,60 L185,55 L200,65 L205,85 L195,110 L180,120 L165,115 L155,95 L155,75 Z" />
          {/* Asia */}
          <path d="M200,25 L250,20 L290,25 L310,35 L300,55 L280,60 L250,55 L220,50 L200,45 Z" />
          {/* India */}
          <path d="M230,60 L245,58 L250,70 L245,82 L235,80 L228,70 Z" />
          {/* Southeast Asia */}
          <path d="M260,65 L280,62 L290,70 L285,80 L270,78 L262,72 Z" />
          {/* Australia */}
          <path d="M280,110 L320,105 L335,115 L330,130 L310,135 L285,125 Z" />
        </g>

        {/* Trail connecting missions */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
            opacity="0.6"
            className="mission-map-trail"
          />
        )}

        {/* Completed mission dots */}
        {points.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--accent-gold)"
            opacity="0.8"
          />
        ))}

        {/* Current mission dot (pulsing) */}
        {points.length > 0 && (
          <g>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="5"
              fill="var(--accent-blue)"
              opacity="0.3"
              className="mission-map-pulse"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="3.5"
              fill="var(--accent-blue)"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
