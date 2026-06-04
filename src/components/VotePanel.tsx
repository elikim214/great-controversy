'use client';

import { useState, useEffect } from 'react';
import type { ClientProposal, ClientPlayer, ClientMission } from '@/lib/game/types';
import { voteRevealTick } from '@/lib/game/sounds';

interface Props {
  proposal: ClientProposal;
  players: ClientPlayer[];
  myId: string;
  onVote: (approve: boolean) => void;
  missions?: ClientMission[];
  currentMissionIndex?: number;
  showVoteHistory?: boolean;
}

export default function VotePanel({ proposal, players, myId, onVote, missions, currentMissionIndex, showVoteHistory = true }: Props) {
  const [voted, setVoted] = useState(false);
  const hasVoted = proposal.votedPlayerIds.includes(myId);

  const memberNames = proposal.memberIds
    .map(id => players.find(p => p.id === id)?.displayName)
    .filter(Boolean);

  const leaderName = players.find(p => p.id === proposal.leaderId)?.displayName;

  const handleVote = (approve: boolean) => {
    if (hasVoted || voted) return;
    setVoted(true);
    onVote(approve);
    // If the server doesn't confirm within 5s (eg socket drop), allow re-vote.
    setTimeout(() => setVoted(false), 5000);
  };

  // Collect past proposal votes for history
  const pastProposals: { missionNum: number; proposalIdx: number; proposal: ClientProposal }[] = [];
  if (showVoteHistory && missions) {
    for (let mi = 0; mi <= (currentMissionIndex ?? 0); mi++) {
      const mission = missions[mi];
      if (!mission) continue;
      for (let pi = 0; pi < mission.proposals.length; pi++) {
        const p = mission.proposals[pi];
        if (mi === currentMissionIndex && pi === mission.currentProposalIndex && !p.resolved) continue;
        if (p.resolved && p.votes) {
          pastProposals.push({ missionNum: mission.missionNumber, proposalIdx: pi + 1, proposal: p });
        }
      }
    }
  }

  // Staggered vote reveal
  const [revealIndex, setRevealIndex] = useState(-1);
  const voteEntries = proposal.resolved && proposal.votes ? Object.entries(proposal.votes) : [];
  const allRevealed = revealIndex >= voteEntries.length;

  useEffect(() => {
    if (!proposal.resolved || !proposal.votes) {
      setRevealIndex(-1);
      return;
    }
    setRevealIndex(0);
  }, [proposal.resolved, proposal.votes]);

  useEffect(() => {
    if (revealIndex < 0 || allRevealed) return;
    const timer = setTimeout(() => {
      setRevealIndex(prev => prev + 1);
      voteRevealTick();
    }, 500);
    return () => clearTimeout(timer);
  }, [revealIndex, allRevealed]);

  // Show results if resolved
  if (proposal.resolved && proposal.votes) {
    const approvals = Object.values(proposal.votes).filter(v => v).length;
    const rejections = Object.values(proposal.votes).filter(v => !v).length;
    const total = approvals + rejections;
    const approvePercent = total > 0 ? Math.round((approvals / total) * 100) : 0;
    const rejectPercent = total > 0 ? 100 - approvePercent : 0;

    return (
      <div className="space-y-4">
        <div className="game-card animate-scale-in">
          <h3 className="font-serif text-lg font-bold mb-3">Vote Result</h3>

          {/* Staggered vote reveal */}
          {!allRevealed && (
            <p className="text-sm text-gold mb-3 pulse-glow text-center font-serif italic">
              Revealing votes...
            </p>
          )}

          {/* Avatar grid vote reveal */}
          {proposal.votes && (
            <div className="grid grid-cols-4 gap-3 mb-4 justify-items-center">
              {voteEntries.map(([playerId, approved], i) => {
                const player = players.find(p => p.id === playerId);
                if (!player) return null;
                const isRevealed = i < revealIndex;
                return (
                  <div
                    key={playerId}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="relative rounded-full overflow-hidden transition-all duration-500"
                      style={{
                        width: 48,
                        height: 48,
                        border: isRevealed
                          ? `3px solid ${approved ? 'var(--success)' : 'var(--danger)'}`
                          : '3px solid var(--card-border)',
                        transform: isRevealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
                        opacity: isRevealed ? 1 : 0.5,
                      }}
                    >
                      <img
                        src={`/avatars/avatar-${String(player.avatarIndex + 1).padStart(2, '0')}.png`}
                        alt={player.displayName}
                        className="w-full h-full object-cover"
                        style={{ background: 'var(--card-bg)' }}
                      />
                      {/* Vote icon overlay */}
                      {isRevealed && (
                        <div
                          className="absolute inset-0 flex items-center justify-center animate-scale-in"
                          style={{
                            background: approved
                              ? 'rgba(59, 186, 94, 0.3)'
                              : 'rgba(217, 79, 79, 0.3)',
                          }}
                        >
                          {approved ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="4,10 8,14 16,6" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                              <line x1="3" y1="3" x2="13" y2="13" />
                              <line x1="13" y1="3" x2="3" y2="13" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-muted max-w-[52px] truncate text-center">
                      {player.displayName}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show totals and bar chart only after all revealed */}
          {allRevealed && (
            <>
              <p className="text-sm mb-4 animate-fade-in-up">
                {proposal.approved ? (
                  <span className="text-success font-bold text-base">Approved</span>
                ) : (
                  <span className="text-danger font-bold text-base">Rejected</span>
                )}
              </p>

              {/* Horizontal bar chart */}
              <div className="mb-4 animate-fade-in">
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>{approvals} Approve ({approvePercent}%)</span>
                  <span>{rejections} Reject ({rejectPercent}%)</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {approvePercent > 0 && (
                    <div
                      className="transition-all duration-700 ease-out"
                      style={{
                        width: `${approvePercent}%`,
                        background: 'var(--success)',
                      }}
                    />
                  )}
                  {rejectPercent > 0 && (
                    <div
                      className="transition-all duration-700 ease-out"
                      style={{
                        width: `${rejectPercent}%`,
                        background: 'var(--danger)',
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        {showVoteHistory && pastProposals.length > 0 && (
          <VoteHistory pastProposals={pastProposals} players={players} />
        )}
      </div>
    );
  }

  return (
    <div className="game-card">
      <h3 className="font-serif text-lg font-bold mb-2">Team Proposal</h3>
      <p className="text-sm text-muted mb-1">
        <span className="text-gold font-serif">{leaderName}</span> proposes:
      </p>
      <div className="flex flex-wrap gap-2 mb-6">
        {memberNames.map((name, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded text-sm font-medium animate-scale-in"
            style={{
              background: 'rgba(74,144,217,0.15)',
              color: 'var(--accent-blue)',
              animationDelay: `${i * 100}ms`,
            }}
          >
            {name}
          </span>
        ))}
      </div>

      {hasVoted || voted ? (
        <div className="text-center animate-fade-in py-4">
          <p className="text-muted pulse-glow">Vote submitted. Waiting for others...</p>
          <p className="text-xs text-muted mt-1">
            {proposal.votedPlayerIds.length} / {players.length} voted
          </p>
        </div>
      ) : (
        /* Sticky action bar \u2014 keeps Approve/Reject reachable even when the
           mission destination card and vote history below push them off
           the visible viewport. */
        <div
          className="sticky bottom-0 z-30 -mx-4 px-4 pt-3 pb-3 animate-slide-up delay-200"
          style={{
            background: 'linear-gradient(to top, var(--background) 70%, rgba(10,14,26,0.85) 90%, transparent)',
          }}
        >
          <div className="space-y-3 pr-[88px]">
            <button
              onClick={() => handleVote(true)}
              className="btn btn-success w-full"
              style={{ minHeight: 56 }}
            >
              Approve
            </button>
            <button
              onClick={() => handleVote(false)}
              className="btn btn-danger w-full"
              style={{ minHeight: 56 }}
            >
              Reject
            </button>
            <p className="text-[9px] text-muted text-center mt-1">Keys: A = Approve {'\u00B7'} R = Reject</p>
          </div>
        </div>
      )}
      {showVoteHistory && pastProposals.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <VoteHistory pastProposals={pastProposals} players={players} />
        </div>
      )}
    </div>
  );
}

function VoteHistory({ pastProposals, players }: {
  pastProposals: { missionNum: number; proposalIdx: number; proposal: ClientProposal }[];
  players: ClientPlayer[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-bold py-2"
      >
        <span className="font-serif">Vote History ({pastProposals.length})</span>
        <span className="text-muted text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? '400px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="max-h-60 overflow-y-auto space-y-3 pt-2">
          {pastProposals.map((entry, idx) => {
            const votes = entry.proposal.votes!;
            const approvals = Object.values(votes).filter(v => v).length;
            const rejections = Object.values(votes).filter(v => !v).length;
            const total = approvals + rejections;
            const approvePercent = total > 0 ? Math.round((approvals / total) * 100) : 0;
            const leaderName = players.find(p => p.id === entry.proposal.leaderId)?.displayName;
            const teamNames = entry.proposal.memberIds
              .map(id => players.find(p => p.id === id)?.displayName)
              .filter(Boolean)
              .join(', ');

            return (
              <div
                key={idx}
                className="text-xs pb-3 animate-fade-in-up"
                style={{
                  animationDelay: `${idx * 80}ms`,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-muted">
                    Mission {entry.missionNum}, Proposal {entry.proposalIdx}
                  </span>
                  <span className={entry.proposal.approved ? 'text-success' : 'text-danger'}>
                    {entry.proposal.approved ? 'Approved' : 'Rejected'}
                  </span>
                </div>
                <p className="text-muted mb-1.5">
                  <span className="text-gold">{leaderName}</span> proposed: {teamNames}
                </p>
                {/* Mini bar */}
                <div className="flex h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${approvePercent}%`, background: 'var(--success)' }} />
                  <div style={{ width: `${100 - approvePercent}%`, background: 'var(--danger)' }} />
                </div>
                <div className="space-y-0.5">
                  {Object.entries(votes).map(([playerId, approved]) => {
                    const player = players.find(p => p.id === playerId);
                    if (!player) return null;
                    return (
                      <div key={playerId} className="flex items-center gap-1.5">
                        <div
                          className="flex-shrink-0 rounded-full overflow-hidden"
                          style={{
                            width: 20,
                            height: 20,
                            border: `2px solid ${approved ? 'var(--success)' : 'var(--danger)'}`,
                          }}
                        >
                          <img
                            src={`/avatars/avatar-${String(player.avatarIndex + 1).padStart(2, '0')}.png`}
                            alt={player.displayName}
                            className="w-full h-full object-cover"
                            style={{ background: 'var(--card-bg)' }}
                          />
                        </div>
                        <span className="text-foreground/70">{player.displayName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
