'use client';

import { useGame } from '@/context/GameContext';
import { GamePhase } from '@/lib/game/types';
import MissionTracker from './MissionTracker';

export default function PublicDisplay() {
  const { roomState } = useGame();

  if (!roomState) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted pulse-glow text-2xl">Connecting to game...</p>
      </div>
    );
  }

  const currentMission = roomState.missions[roomState.currentMissionIndex];
  const currentLeader = roomState.players[roomState.currentLeaderIndex];

  const phaseName = (): string => {
    switch (roomState.phase) {
      case GamePhase.Lobby: return 'Waiting for Players';
      case GamePhase.RoleReveal: return 'Roles Being Revealed';
      case GamePhase.FirstNight: return 'First Night';
      case GamePhase.TeamProposal: return 'Team Proposal';
      case GamePhase.TeamVote: return 'Voting';
      case GamePhase.MissionAction: return 'Mission In Progress';
      case GamePhase.MissionReveal: return 'Mission Result';
      case GamePhase.EvangelistAction: return 'Evangelist Sharing Testimony';
      case GamePhase.AssassinGuess: return 'The Assassin Strikes';
      case GamePhase.GameOver: return 'Game Over';
      default: return '';
    }
  };

  // Show cinematic location background when a mission is active
  const showLocationHero = currentMission && roomState.phase !== GamePhase.Lobby && roomState.phase !== GamePhase.GameOver;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Full-screen location background */}
      {showLocationHero && (
        <div className="absolute inset-0 z-0">
          <img
            src={`/locations/${currentMission.location.image}`}
            alt={`${currentMission.location.name}, ${currentMission.location.region} — a mission destination representing unreached people`}
            className="w-full h-full object-cover animate-slow-zoom opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="ambient-particles" />
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        {/* Title and room code */}
        <h1 className="font-serif text-5xl font-bold text-blue mb-2 animate-text-reveal">
          The Great Controversy
        </h1>
        <p className="text-muted text-lg mb-1 animate-fade-in-up delay-200">A Last Day ADVENTure Game</p>
        <p className="font-mono text-3xl text-gold tracking-widest mb-8 animate-scale-in delay-400">
          {roomState.code}
        </p>

        {/* Phase */}
        <div className="mb-6 animate-fade-in-up delay-300">
          <p className="font-serif text-3xl font-bold">{phaseName()}</p>
        </div>

        {/* Mission tracker */}
        {roomState.missions.length > 0 && (
          <div className="mb-6 scale-125 animate-fade-in-up delay-400">
            <MissionTracker missions={roomState.missions} currentIndex={roomState.currentMissionIndex} />
          </div>
        )}

        {/* Rejection tracker */}
        {roomState.consecutiveRejections > 0 && (
          <p className="text-danger mb-4 animate-fade-in">
            Rejected proposals: {roomState.consecutiveRejections}/5
          </p>
        )}

        {/* Current mission info — cinematic overlay */}
        {showLocationHero && (
          <div className="mb-6 w-full max-w-2xl animate-fade-in-up delay-500">
            {/* Location title large */}
            <div className="mb-4">
              <p className="font-serif text-gold text-4xl font-bold leading-tight animate-text-reveal delay-600">
                {currentMission.location.name}
              </p>
              <p className="text-white/60 text-lg mt-1 animate-fade-in-up delay-700">
                {currentMission.location.region}
              </p>
            </div>

            {/* Info row — staggered */}
            <div className="flex gap-3 mb-3 text-sm">
              <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-lg p-2 border border-card-border text-left animate-fade-in-up delay-600">
                <p className="text-muted text-xs uppercase tracking-wider mb-0.5">Belief System</p>
                <p className="text-white/90">{currentMission.location.beliefSystem}</p>
              </div>
              <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-lg p-2 border border-card-border text-left animate-fade-in-up delay-700">
                <p className="text-muted text-xs uppercase tracking-wider mb-0.5">Population</p>
                <p className="text-white/90">{currentMission.location.population}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-card-border text-left text-sm mb-3 animate-fade-in-up delay-800">
              <p className="text-muted text-xs uppercase tracking-wider mb-1">Why Hard to Reach</p>
              <p className="text-white/80 leading-relaxed">{currentMission.location.whyHardToReach}</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-card-border text-left text-sm mb-3 animate-fade-in-up delay-900">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-muted text-xs uppercase tracking-wider mb-1">History</p>
                  <p className="text-white/80 leading-relaxed">{currentMission.location.history}</p>
                </div>
                {/* Second image inset */}
                <img
                  src={`/locations/${currentMission.location.image2}`}
                  alt={`${currentMission.location.name} — additional view`}
                  className="w-32 h-24 object-cover rounded-lg flex-shrink-0 self-center"
                />
              </div>
            </div>

            <p className="text-gold italic text-sm animate-fade-in delay-1000 font-serif">{currentMission.location.callToAction}</p>
            <p className="text-muted text-xs italic mt-1 animate-fade-in delay-1000">{currentMission.location.flavorText}</p>
          </div>
        )}

        {/* Leader */}
        {currentLeader && roomState.phase === GamePhase.TeamProposal && (
          <p className="text-lg mb-4 animate-fade-in-up">
            Leader: <span className="text-gold font-bold font-serif">{currentLeader.displayName}</span>
          </p>
        )}

        {/* Approved team */}
        {currentMission?.team.length > 0 && (
          roomState.phase === GamePhase.MissionAction || roomState.phase === GamePhase.MissionReveal
        ) && (
          <div className="mb-4 animate-fade-in-up">
            <p className="text-sm text-muted mb-2">Mission Team</p>
            <div className="flex flex-wrap justify-center gap-2">
              {currentMission.team.map((id, i) => {
                const player = roomState.players.find(p => p.id === id);
                return (
                  <span
                    key={id}
                    className="px-3 py-1 rounded-lg bg-blue/30 font-medium animate-scale-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {player?.displayName}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Mission result */}
        {roomState.phase === GamePhase.MissionReveal && currentMission && (
          <div className={`animate-scale-in font-serif text-4xl font-bold mt-4 ${
            currentMission.result === 'success' ? 'text-success' : 'text-danger'
          }`}>
            {currentMission.result === 'success' ? 'Mission Success!' : 'Mission Failed!'}
            <p className="text-lg text-muted mt-1 font-sans animate-fade-in-up delay-300">
              {currentMission.sabotageCount} sabotage card{currentMission.sabotageCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Game over */}
        {roomState.phase === GamePhase.GameOver && roomState.result && (
          <div className="mt-4 animate-fade-in">
            <p className={`font-serif text-4xl font-bold animate-scale-in ${
              roomState.result.winner === 'Mission Team' ? 'text-blue' : 'text-danger'
            }`}>
              {roomState.result.winner === 'Mission Team' ? 'The Light Prevails!' : 'Babylon Triumphs!'}
            </p>
            <p className="text-muted mt-2 animate-fade-in-up delay-300">{roomState.result.reason}</p>
          </div>
        )}

        {/* Player list */}
        <div className="mt-8 animate-fade-in-up delay-400">
          <p className="text-sm text-muted mb-2">
            Players ({roomState.players.length})
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {roomState.players.map((p, i) => (
              <span
                key={p.id}
                className={`px-3 py-1 rounded-lg text-sm animate-fade-in-up ${
                  p.connected ? 'bg-card border border-card-border' : 'bg-card/50 border border-card-border/50 text-muted'
                } ${p.id === currentLeader?.id && roomState.phase === GamePhase.TeamProposal ? 'border-blue text-blue' : ''}`}
                style={{ animationDelay: `${500 + i * 80}ms` }}
              >
                {p.displayName}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
