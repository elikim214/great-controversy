'use client';

import { useState } from 'react';
import { Alignment } from '@/lib/game/types';
import type { ClientMission, PlayerPrivateInfo } from '@/lib/game/types';
import { ShaderBackground } from '@/components/ui/animated-shader-hero';

interface Props {
  mission: ClientMission;
  privateInfo: PlayerPrivateInfo;
  myId: string;
  onSubmit: (sabotage: boolean) => void;
}

function LocationInfoCard({ mission }: { mission: ClientMission }) {
  const loc = mission.location;
  return (
    <div className="space-y-3">
      {/* Hero image — large and dramatic */}
      <div className="hero-location" style={{ minHeight: '280px' }}>
        <img
          src={`/locations/${loc.image}`}
          alt={`${loc.name}, ${loc.region} — a mission destination representing unreached people`}
          className="absolute inset-0"
        />
        <div className="hero-overlay" />
        <div className="ambient-particles" />
        <div className="hero-content">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1 animate-fade-in-up">
            Mission Destination
          </p>
          <h4 className="font-serif text-gold font-bold text-2xl leading-tight animate-text-reveal">
            {loc.name}
          </h4>
          <p className="text-white/70 text-sm mt-1 animate-fade-in-up delay-200">
            {loc.region}
          </p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-blue/20 text-light border border-blue/30 animate-fade-in delay-400">
            {loc.beliefSystem}
          </span>
        </div>
      </div>

      {/* Info grid — staggered fade-in */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-card/50 rounded-lg p-2 border border-card-border animate-fade-in-up delay-300">
          <p className="text-muted uppercase tracking-wider mb-0.5">Belief System</p>
          <p className="text-white/90 font-medium">{loc.beliefSystem}</p>
        </div>
        <div className="bg-card/50 rounded-lg p-2 border border-card-border animate-fade-in-up delay-400">
          <p className="text-muted uppercase tracking-wider mb-0.5">Population</p>
          <p className="text-white/90 font-medium">{loc.population}</p>
        </div>
      </div>

      <div className="bg-card/50 rounded-lg p-2 border border-card-border text-xs animate-fade-in-up delay-500">
        <p className="text-muted uppercase tracking-wider mb-0.5">Why Hard to Reach</p>
        <p className="text-white/80 leading-relaxed">{loc.whyHardToReach}</p>
      </div>

      {/* Second image — inset alongside history */}
      <div className="bg-card/50 rounded-lg p-2 border border-card-border text-xs animate-fade-in-up delay-600">
        <p className="text-muted uppercase tracking-wider mb-1">History</p>
        <div className="flex gap-3">
          <p className="text-white/80 leading-relaxed flex-1">{loc.history}</p>
          <img
            src={`/locations/${loc.image2}`}
            alt={`${loc.name} — additional view`}
            className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
          />
        </div>
      </div>

      <p className="text-gold/90 text-xs italic text-center px-2 animate-fade-in delay-700">{loc.callToAction}</p>
    </div>
  );
}

export default function MissionActionPanel({ mission, privateInfo, myId, onSubmit }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const isOnTeam = mission.team.includes(myId);
  const isBabylon = privateInfo.alignment === Alignment.Babylon;

  if (!isOnTeam) {
    return (
      <div className="relative rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        <ShaderBackground />
        <div className="relative z-10 flex items-center justify-center px-6" style={{ minHeight: '300px' }}>
          <div className="text-center bg-black/50 backdrop-blur-sm rounded-2xl px-8 py-10 max-w-lg">
            <p className="font-serif text-2xl md:text-4xl font-bold text-white pulse-glow leading-tight drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              The mission team is carrying out their work...
            </p>
            <p className="text-white/70 text-sm mt-4">
              Destination: <span className="text-gold font-semibold">{mission.location.name}</span>
            </p>
            <p className="text-white/50 text-xs mt-1">{mission.location.region}</p>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="relative rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        <ShaderBackground />
        <div className="relative z-10 flex items-center justify-center px-6" style={{ minHeight: '300px' }}>
          <div className="text-center bg-black/50 backdrop-blur-sm rounded-2xl px-8 py-10 max-w-lg">
            <p className="font-serif text-2xl md:text-4xl font-bold text-white pulse-glow leading-tight drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              Action submitted. Waiting for team...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAction = (sabotage: boolean) => {
    setSubmitted(true);
    onSubmit(sabotage);
  };

  return (
    <div className="game-card fade-in-up">
      <h3 className="font-serif text-xl font-bold mb-3 text-center animate-text-reveal">Mission Action</h3>

      <LocationInfoCard mission={mission} />

      <p className="text-xs text-muted text-center mt-3 mb-3 italic animate-fade-in delay-700">
        {mission.location.flavorText}
      </p>

      <div className="flex gap-3 animate-slide-up delay-800">
        <button
          onClick={() => handleAction(false)}
          className="btn btn-success flex-1"
        >
          Support Mission
        </button>
        {isBabylon && (
          <button
            onClick={() => handleAction(true)}
            className="btn btn-danger flex-1"
          >
            Sabotage
          </button>
        )}
      </div>
      <p className="text-[9px] text-muted text-center mt-1">{isBabylon ? 'Keys: S = Support \u00B7 X = Sabotage' : 'Key: S = Support'}</p>

      {mission.requiresTwoFails && (
        <p className="text-xs text-blue text-center mt-3 animate-fade-in delay-900">
          This mission requires 2 sabotages to fail
        </p>
      )}
    </div>
  );
}
