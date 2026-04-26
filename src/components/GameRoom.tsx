'use client';

import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { GamePhase } from '@/lib/game/types';
import MissionTracker from './MissionTracker';
import PlayerList from './PlayerList';
import RoleCard from './RoleCard';
import RoleRevealCard from './RoleRevealCard';
import VotePanel from './VotePanel';
import MissionActionPanel from './MissionActionPanel';
import EvangelistPanel from './EvangelistPanel';
import AssassinPanel from './AssassinPanel';
import GameOverPanel from './GameOverPanel';
import PhaseMessage from './PhaseMessage';
import RulesDropdown from './RulesDropdown';
import ChatPanel from './ChatPanel';
import NotesPanel from './NotesPanel';
import PaywallModal from './PaywallModal';
import { SparklesText } from './ui/sparkles-text';
import { APP_VERSION, FREE_PLAYER_LIMIT } from '@/lib/game/config';
import {
  phaseTransition, victoryCelebration, babylonTriumph,
  missionSuccess, missionFailed, cardFlip, assassinStrike,
  getSoundEnabled, setSoundEnabled,
} from '@/lib/game/sounds';
import { MIN_PLAYERS } from '@/lib/game/config';
import { getRandomQuote, type EGWQuote } from '@/lib/game/egwQuotes';
import { checkSabbathWithLocation } from '@/lib/game/sabbath';
import { Role } from '@/lib/game/types';

const ROLE_REVEAL_DESCRIPTIONS: Record<string, string> = {
  [Role.Missionary]: 'A faithful servant. Support your team and trust your instincts.',
  [Role.Evangelist]: 'After mission 4, use your ability to investigate or convert a player.',
  [Role.Angel]: 'You know the identities of all Babylon agents. Guard this knowledge carefully.',
  [Role.Prophet]: 'You know who the Angel might be. Protect them at all costs.',
  [Role.AgentOfBabylon]: 'Sabotage the missions. Deceive the faithful.',
  [Role.Assassin]: 'If the good side wins, you get a chance to identify the Angel.',
  [Role.DarkAngel]: 'You appear as a possible Angel to the Prophet. Sow confusion.',
};

const ROLE_TIPS: Record<string, { ability: string; tips: string[] }> = {
  [Role.Missionary]: {
    ability: 'No special ability — you are the backbone of the Mission Team.',
    tips: [
      'Watch voting patterns closely — Babylon agents may vote against good teams.',
      'Pay attention to who proposes teams and who they include or exclude.',
      'Speak up in discussion — your observations are valuable even without special knowledge.',
    ],
  },
  [Role.Evangelist]: {
    ability: '7-9 players: Investigate one player after mission 4 to learn their alignment. 10+ players: Share your testimony to convert a Babylon player to the Mission Team.',
    tips: [
      'Stay quiet about your role — Babylon will try to sabotage you before mission 4.',
      'Pay attention to who sabotages so you can target the right player.',
      'At 10+ players, converting the Assassin forces Babylon to reassign — a huge advantage.',
    ],
  },
  [Role.Angel]: {
    ability: 'You know ALL Babylon agents from the start.',
    tips: [
      'NEVER reveal yourself directly — you are the Assassin\'s target.',
      'Guide the team subtly — support good players without making it obvious how you know.',
      'If you\'re too obvious, the Assassin will identify you and Babylon wins even if missions succeed.',
      'Consider occasionally voting against a team to avoid looking too certain.',
    ],
  },
  [Role.Prophet]: {
    ability: 'You know who the Angel might be. With a Dark Angel in play, you see two candidates.',
    tips: [
      'Protect the Angel at all costs — they are the key to victory.',
      'Be careful who you share this information with — Babylon is listening.',
      'If a Dark Angel is in play, watch both candidates carefully to figure out who is real.',
      'Try to get the Angel on mission teams without drawing attention to them.',
    ],
  },
  [Role.AgentOfBabylon]: {
    ability: 'You know your fellow Babylon agents. Sabotage missions to delay the second coming.',
    tips: [
      'Don\'t sabotage every mission — being predictable gets you caught.',
      'Build trust early by supporting the first mission, then sabotage later.',
      'Accuse trusted Mission Team players to create confusion and doubt.',
      'Coordinate with your Babylon teammates — you don\'t all need to sabotage the same mission.',
    ],
  },
  [Role.Assassin]: {
    ability: 'If the Mission Team wins by completing 3 missions, you get a final chance to guess who the Angel is. Guess correctly and Babylon wins!',
    tips: [
      'Your primary job is to figure out who the Angel is throughout the game.',
      'Watch who seems to know too much — they might be the Angel.',
      'The Prophet will try to protect the Angel — follow their behavior for clues.',
      'At 10+ players you get 2 guesses, so take calculated risks.',
    ],
  },
  [Role.DarkAngel]: {
    ability: 'The Prophet sees you as a possible Angel candidate alongside the real Angel.',
    tips: [
      'Act like you\'re on the Mission Team — you want the Prophet to trust you.',
      'If the Prophet approaches you thinking you\'re the Angel, play along.',
      'Your deception protects the real Assassin by confusing the Prophet.',
      'Support some missions early to build credibility, then sabotage when it counts.',
    ],
  },
};

export default function GameRoom() {
  const {
    roomState, privateInfo, session, error, clearError,
    phaseMessage, clearPhaseMessage, conversionResult, clearConversionResult,
    assassinResult, babylonAlert, clearBabylonAlert, angelAlert, clearAngelAlert,
    addBot, removeBot,
    kickPlayer, updateConfig, startGame, advanceFirstNight, advancePhase,
    proposeTeam, submitVote, submitMissionAction,
    evangelistConvert, assassinGuess, restartGame, returnToLobby,
  } = useGame();

  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [headerRoleVisible, setHeaderRoleVisible] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [missionQuote, setMissionQuote] = useState<EGWQuote | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [discussionElapsed, setDiscussionElapsed] = useState(0);
  const [missionCardsRevealed, setMissionCardsRevealed] = useState(0);
  const [missionRevealDone, setMissionRevealDone] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [sabbathActive, setSabbathActive] = useState(false);
  const [sabbathInfo, setSabbathInfo] = useState<string | undefined>();
  const [soundOn, setSoundOn] = useState(getSoundEnabled);

  // Check Sabbath on mount using geolocation
  useEffect(() => {
    checkSabbathWithLocation().then(result => {
      setSabbathActive(result.isSabbath);
      setSabbathInfo(result.sunsetInfo);
    });
  }, []);

  // Reset team selection and role reveal when phase changes
  useEffect(() => {
    setSelectedTeam([]);
    setRoleRevealed(false);
    setMissionCardsRevealed(0);
    setMissionRevealDone(false);
    // Show a new EGW quote during MissionReveal phase
    if (roomState?.phase === GamePhase.MissionReveal) {
      setMissionQuote(getRandomQuote());
    } else {
      setMissionQuote(null);
    }
    // Sound effects for phase changes
    if (roomState?.phase && roomState.phase !== GamePhase.Lobby) {
      phaseTransition();
    }
    if (roomState?.phase === GamePhase.AssassinGuess) {
      assassinStrike();
    }
    if (roomState?.phase === GamePhase.GameOver && roomState.result) {
      if (roomState.result.winner === 'Mission Team') {
        victoryCelebration();
      } else {
        babylonTriumph();
      }
    }
  }, [roomState?.phase, roomState?.currentMissionIndex]);

  // Staggered mission card reveal
  useEffect(() => {
    if (roomState?.phase !== GamePhase.MissionReveal) return;
    const mission = roomState?.missions?.[roomState.currentMissionIndex];
    if (!mission || mission.result === 'pending') return;
    const totalCards = mission.team?.length || 0;
    if (missionCardsRevealed >= totalCards) {
      // All cards revealed — show result after a pause
      const timer = setTimeout(() => {
        setMissionRevealDone(true);
        if (mission.result === 'success') missionSuccess();
        else missionFailed();
      }, 1000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setMissionCardsRevealed(prev => prev + 1);
      cardFlip();
    }, 800);
    return () => clearTimeout(timer);
  }, [roomState?.phase, roomState?.currentMissionIndex, missionCardsRevealed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!roomState || !session) return;
      // Don't capture if typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const phase = roomState.phase;
      const myId = session.playerId;
      const currentMission = roomState.missions[roomState.currentMissionIndex];
      const currentLeader = roomState.players[roomState.currentLeaderIndex];
      const isLeader = currentLeader?.id === myId;
      const isHost = session.playerId === roomState.hostId;

      // TeamProposal: number keys 1-9 toggle player selection (leader only)
      if (phase === GamePhase.TeamProposal && isLeader && currentMission) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= roomState.players.length) {
          const playerId = roomState.players[num - 1].id;
          const maxSize = currentMission.requiredTeamSize;
          setSelectedTeam(prev => {
            if (prev.includes(playerId)) return prev.filter(id => id !== playerId);
            if (prev.length >= maxSize) return prev;
            return [...prev, playerId];
          });
        }
        // Enter to submit team
        if (e.key === 'Enter' && selectedTeam.length === currentMission.requiredTeamSize) {
          proposeTeam(selectedTeam);
        }
      }

      // TeamVote: A = approve, R = reject
      if (phase === GamePhase.TeamVote) {
        if (e.key === 'a' || e.key === 'A') submitVote(true);
        if (e.key === 'r' || e.key === 'R') submitVote(false);
      }

      // MissionAction: S = support, X = sabotage (Babylon only)
      if (phase === GamePhase.MissionAction && currentMission?.team.includes(myId)) {
        if (e.key === 's' || e.key === 'S') submitMissionAction(false);
        if (e.key === 'x' || e.key === 'X') submitMissionAction(true);
      }

      // MissionReveal / RoleReveal: Enter or Space to advance (host only)
      if ((phase === GamePhase.MissionReveal || phase === GamePhase.RoleReveal) && isHost) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (phase === GamePhase.MissionReveal) advancePhase();
          if (phase === GamePhase.RoleReveal && roleRevealed) advanceFirstNight();
        }
      }

      // Role reveal: Space to reveal
      if (phase === GamePhase.RoleReveal && !roleRevealed) {
        if (e.key === ' ') { e.preventDefault(); setRoleRevealed(true); }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [roomState, session, selectedTeam, roleRevealed]);

  // Check for subscription=success in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      setSubscriptionChecked(true);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('subscription');
      window.history.replaceState({}, '', url.pathname);
    }
  }, []);

  // Discussion timer — counts up during TeamProposal
  useEffect(() => {
    if (roomState?.phase !== GamePhase.TeamProposal) {
      setDiscussionElapsed(0);
      return;
    }
    setDiscussionElapsed(0);
    const interval = setInterval(() => {
      setDiscussionElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomState?.phase, roomState?.currentMissionIndex]);

  if (!roomState || !session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted pulse-glow">Loading game state...</p>
      </div>
    );
  }

  const isHost = session.playerId === roomState.hostId;
  const myId = session.playerId;
  const isInGame = roomState.phase !== GamePhase.Lobby;
  const currentMission = roomState.missions[roomState.currentMissionIndex];
  const currentLeader = roomState.players[roomState.currentLeaderIndex];
  const isLeader = currentLeader?.id === myId;

  const phaseName = (): string => {
    switch (roomState.phase) {
      case GamePhase.Lobby: return 'Lobby';
      case GamePhase.RoleReveal: return 'Role Reveal';
      case GamePhase.FirstNight: return 'First Night';
      case GamePhase.TeamProposal: return 'Team Proposal';
      case GamePhase.TeamVote: return 'Team Vote';
      case GamePhase.MissionAction: return 'Mission In Progress';
      case GamePhase.MissionReveal: return 'Mission Result';
      case GamePhase.EvangelistAction: return 'Sharing Testimony';
      case GamePhase.AssassinGuess: return 'Assassin\'s Choice';
      case GamePhase.GameOver: return 'Game Over';
      default: return '';
    }
  };

  const toggleTeamMember = (playerId: string) => {
    setSelectedTeam(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full p-4">
      {/* Phase message overlay */}
      {phaseMessage && (
        <PhaseMessage
          title={phaseMessage.title}
          body={phaseMessage.body}
          onDismiss={clearPhaseMessage}
        />
      )}

      {/* Conversion result overlay */}
      {conversionResult && (
        <PhaseMessage
          title="Evangelism Result"
          body={conversionResult.success
            ? `Conversion successful! ${conversionResult.targetName} has joined the Mission Team!`
            : `Already a believer \u2014 ${conversionResult.targetName} was already on the Mission Team.`}
          onDismiss={clearConversionResult}
        />
      )}

      {/* Babylon teammate converted overlay */}
      {babylonAlert && (
        <PhaseMessage
          title="Teammate Converted"
          body={`Your teammate ${babylonAlert.convertedName} has been converted to the Mission Team. You are now alone.${babylonAlert.youAreNowAssassin ? '\n\nYou are now the Assassin. If the Mission Team wins, you will have one chance to identify the Angel.' : ''}`}
          onDismiss={clearBabylonAlert}
        />
      )}

      {/* Angel conversion notice overlay */}
      {angelAlert && (
        <PhaseMessage
          title="Conversion Notice"
          body={`${angelAlert.convertedName} has been converted to the Mission Team.`}
          onDismiss={clearAngelAlert}
        />
      )}

      {/* Header */}
      <div className="text-center mb-4">
        {roomState.phase === GamePhase.Lobby ? (
          <div className="mb-4 animate-fade-in">
            <p className="text-xs text-muted uppercase tracking-widest mb-1 animate-fade-in-up">Room Code</p>
            <p className="text-6xl font-bold font-mono tracking-[0.2em] text-gold animate-scale-in delay-200">{roomState.code}</p>
            <p className="text-sm text-muted mt-2 animate-fade-in-up delay-400">Playing as <span className="text-blue font-semibold">{session.displayName}</span></p>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2 animate-fade-in">
            <span className="text-xs text-muted font-mono">Room: {roomState.code}</span>
            <span className="text-blue text-sm font-semibold">{session.displayName}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const next = !soundOn;
                  setSoundOn(next);
                  setSoundEnabled(next);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-muted hover:text-light hover:border-white/20 transition-colors"
                title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
              >
                {soundOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
              </button>
              <button
                onClick={() => setNotesOpen(true)}
                className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-muted hover:text-light hover:border-white/20 transition-colors"
                title="Private Notes"
              >
                Notes
              </button>
              <span className="text-xs text-muted font-serif italic">{phaseName()}</span>
            </div>
          </div>
        )}

        {/* Role badge — tap to show card */}
        {privateInfo && roomState.phase !== GamePhase.Lobby && roomState.phase !== GamePhase.RoleReveal && (
          <div
            className="animate-fade-in-up delay-200 cursor-pointer select-none"
            onClick={() => setShowCardModal(true)}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-card-border text-xs text-muted hover:border-gold/30 transition-colors">
              Tap to view your card
            </div>
          </div>
        )}

        {/* Full card modal */}
        {showCardModal && privateInfo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
            onClick={() => setShowCardModal(false)}
          >
            <div className="animate-scale-in max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center">
                <RoleRevealCard
                  role={privateInfo.role}
                  alignment={privateInfo.alignment}
                  description={ROLE_REVEAL_DESCRIPTIONS[privateInfo.role] || ''}
                  onRevealed={() => {}}
                  startFlipped={true}
                />
              </div>
              {/* Ability & Tips */}
              {ROLE_TIPS[privateInfo.role] && (
                <div className="mt-4 space-y-3 px-2">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(200, 164, 78, 0.08)', border: '1px solid rgba(200, 164, 78, 0.15)' }}>
                    <p className="text-[10px] uppercase tracking-wider text-gold/60 mb-1">Special Ability</p>
                    <p className="text-white/80 text-xs leading-relaxed">{ROLE_TIPS[privateInfo.role].ability}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(74, 144, 217, 0.08)', border: '1px solid rgba(74, 144, 217, 0.15)' }}>
                    <p className="text-[10px] uppercase tracking-wider text-blue/60 mb-1.5">Strategy Tips</p>
                    <ul className="space-y-1.5">
                      {ROLE_TIPS[privateInfo.role].tips.map((tip, i) => (
                        <li key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                          <span className="text-blue/50 flex-shrink-0">{'\u2022'}</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <p className="text-center text-muted text-xs mt-3 pb-4">Tap outside to close</p>
            </div>
          </div>
        )}
      </div>

      {/* Mission tracker */}
      {roomState.missions.length > 0 && (
        <div className="mb-4 animate-fade-in-up delay-100">
          <MissionTracker
            missions={roomState.missions}
            currentIndex={roomState.currentMissionIndex}
            hideCurrentResult={roomState.phase === GamePhase.MissionReveal && !missionRevealDone}
          />
          {roomState.consecutiveRejections > 0 && (
            <p className="text-center text-xs text-danger mt-1 animate-fade-in">
              Rejected proposals: {roomState.consecutiveRejections}/5
            </p>
          )}
        </div>
      )}

      {/* Mission location — bigger, bolder hero */}
      {currentMission && roomState.phase !== GamePhase.Lobby && roomState.phase !== GamePhase.RoleReveal && roomState.phase !== GamePhase.FirstNight && roomState.phase !== GamePhase.GameOver && (
        <div className="mb-4 animate-fade-in-up">
          <div className="hero-location" style={{ minHeight: '220px' }}>
            <img
              src={`/locations/${currentMission.location.image}`}
              alt={`${currentMission.location.name}, ${currentMission.location.region}`}
              className="absolute inset-0"
            />
            <div className="hero-overlay" />
            <div className="hero-content">
              <p className="text-[10px] text-white/50 uppercase tracking-widest mb-0.5 animate-fade-in-up">
                Mission {currentMission.missionNumber} Destination
              </p>
              <p className="font-serif text-gold font-bold text-xl leading-tight animate-text-reveal delay-100">
                {currentMission.location.name}
              </p>
              <p className="text-[11px] text-white/60 mt-0.5 animate-fade-in-up delay-200">
                {currentMission.location.region} &middot; {currentMission.location.beliefSystem}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1 animate-fade-in delay-300">
            <p className="text-[10px] text-muted">{currentMission.location.population}</p>
            <p className="text-[10px] text-gold/80 italic max-w-[70%] text-right">{currentMission.location.callToAction}</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-danger/20 border border-danger/50 text-sm text-center animate-fade-in-up">
          {error}
          <button onClick={clearError} className="ml-2 text-xs underline">dismiss</button>
        </div>
      )}

      {/* Phase-specific content */}
      <div className="flex-1">
        {/* LOBBY */}
        {roomState.phase === GamePhase.Lobby && (
          <div className="space-y-4">
            <div className="game-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-bold">Players ({roomState.players.length})</h3>
                {roomState.players.length < MIN_PLAYERS && (
                  <span className="text-xs text-muted">Need {MIN_PLAYERS - roomState.players.length} more</span>
                )}
              </div>
              <PlayerList
                players={roomState.players}
                currentPlayerId={myId}
                onKick={isHost ? kickPlayer : undefined}
                isActiveGame={false}
              />

              {/* Bot badges */}
              {roomState.players.some(p => p.isBot) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roomState.players.filter(p => p.isBot).map(p => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: 'rgba(212,168,67,0.12)', color: 'var(--accent-gold)' }}
                    >
                      BOT {p.displayName}
                      {isHost && (
                        <button
                          onClick={() => removeBot(p.id)}
                          className="ml-1 text-danger hover:text-danger/80"
                          title="Remove bot"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add Bot Button */}
            {isHost && (
              <button
                onClick={() => addBot()}
                disabled={roomState.players.length >= 15}
                className="btn w-full text-sm py-2 border border-gold/30 text-gold hover:bg-gold/10 transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add Bot Player
              </button>
            )}

            {isHost && (
              <div className="game-card space-y-3 delay-200">
                <h3 className="font-serif font-bold">Game Settings</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomState.config.showVoteHistory !== false}
                    onChange={e => updateConfig({ showVoteHistory: e.target.checked })}
                    className="w-4 h-4 accent-gold"
                  />
                  <span className="text-sm">Show Vote History</span>
                </label>
                <button
                  onClick={async () => {
                    // If 7+ players, check subscription first
                    if (roomState.players.length > FREE_PLAYER_LIMIT) {
                      // Sabbath = free
                      if (sabbathActive) {
                        startGame();
                        return;
                      }
                      // If we just came back from a successful checkout, skip the check
                      if (subscriptionChecked) {
                        startGame();
                        return;
                      }
                      // Check for valid coupon in localStorage
                      const storedCoupon = localStorage.getItem(`coupon-${roomState.code}`);
                      if (storedCoupon) {
                        startGame();
                        return;
                      }
                      const storedEmail = localStorage.getItem('gc_host_email');
                      if (storedEmail) {
                        try {
                          const sabbathParam = sabbathActive ? '&sabbath=true' : '';
                          const res = await fetch(`/api/stripe/check?email=${encodeURIComponent(storedEmail)}${sabbathParam}`);
                          const data = await res.json();
                          if (data.subscribed) {
                            startGame();
                            return;
                          }
                        } catch {
                          // If check fails, show paywall to be safe
                        }
                      }
                      setShowPaywall(true);
                      return;
                    }
                    startGame();
                  }}
                  disabled={roomState.players.length < MIN_PLAYERS}
                  className="btn btn-primary w-full animate-fade-in delay-400"
                >
                  Start Game
                </button>
                {sabbathActive && (
                  <div className="text-center mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-medium">
                      Free during Sabbath
                    </span>
                    {sabbathInfo && (
                      <p className="text-xs text-muted mt-1">{sabbathInfo}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isHost && (
              <div className="text-center text-muted text-sm pulse-glow animate-fade-in delay-300">
                Waiting for host to start the game...
              </div>
            )}

            <RulesDropdown />
          </div>
        )}

        {/* ROLE REVEAL */}
        {roomState.phase === GamePhase.RoleReveal && privateInfo && (
          <div className="space-y-4 animate-fade-in">
            {!roleRevealed ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="font-serif text-2xl font-bold text-gold mb-2">Your Role is Ready</h2>
                  <p className="text-muted text-sm mb-1">
                    Make sure no one else can see your screen.
                  </p>
                  <p className="text-danger text-xs font-bold mb-6">
                    Secret information will NOT be shown again after this phase.
                  </p>
                </div>
                <RoleRevealCard
                  role={privateInfo.role}
                  alignment={privateInfo.alignment}
                  description={ROLE_REVEAL_DESCRIPTIONS[privateInfo.role] || 'Your mission awaits.'}
                  onRevealed={() => setRoleRevealed(true)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-3 text-center animate-fade-in">
                  <p className="text-danger text-sm font-bold">
                    Memorize the secret information below! You can view your role card anytime during the game, but these secrets will NOT be shown again.
                  </p>
                </div>
                <RoleCard info={privateInfo} players={roomState.players} />
                {isHost && (
                  <div className="space-y-3 animate-slide-up delay-300">
                    <div className="bg-blue/10 border border-blue/30 rounded-xl p-3 text-center">
                      <p className="text-light text-sm font-bold mb-1">
                        Host: Wait for ALL players
                      </p>
                      <p className="text-muted text-xs">
                        Make sure every player has memorized their secret information before continuing.
                        Ask everyone to confirm they are ready.
                      </p>
                    </div>
                    <button onClick={advanceFirstNight} className="btn btn-primary w-full">
                      Everyone is Ready — Begin Missions
                    </button>
                  </div>
                )}
                {!isHost && (
                  <p className="text-center text-muted text-sm pulse-glow animate-fade-in delay-300">
                    Memorize the secrets above. You can always view your role card during the game. The host will continue when everyone is ready.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TEAM PROPOSAL */}
        {roomState.phase === GamePhase.TeamProposal && currentMission && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Discussion timer */}
            <div className="text-center text-xs text-muted font-mono animate-fade-in">
              Discussion: {Math.floor(discussionElapsed / 60)}:{(discussionElapsed % 60).toString().padStart(2, '0')}
            </div>
            <div className="game-card">
              <h3 className="font-serif font-bold mb-1">
                {isLeader ? (
                  'Select Your Team'
                ) : (
                  <span className="flex items-center gap-2 flex-wrap">
                    <SparklesText
                      text={currentLeader?.displayName ?? 'Leader'}
                      className="!text-lg !font-bold inline"
                      colors={{ first: '#3b82f6', second: '#d4a843' }}
                      sparklesCount={6}
                    />
                    <span className="text-muted font-normal">is choosing a team</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted mb-3">
                Team size: {currentMission.requiredTeamSize} players
              </p>
              <PlayerList
                players={roomState.players}
                currentPlayerId={myId}
                leaderId={currentLeader?.id}
                onKick={isHost ? kickPlayer : undefined}
                isActiveGame={true}
                selectable={isLeader}
                selectedIds={selectedTeam}
                onToggleSelect={isLeader ? toggleTeamMember : undefined}
                maxSelectable={currentMission.requiredTeamSize}
              />
            </div>
            {isLeader && (
              <>
                <button
                  onClick={() => proposeTeam(selectedTeam)}
                  disabled={selectedTeam.length !== currentMission.requiredTeamSize}
                  className="btn btn-primary w-full animate-fade-in-up delay-200"
                >
                  Propose Team ({selectedTeam.length}/{currentMission.requiredTeamSize})
                </button>
                <p className="text-[9px] text-muted text-center mt-1">{`Keys: 1-${roomState.players.length} select · Enter to propose`}</p>
              </>
            )}
            {!isLeader && (
              <div className="text-center animate-fade-in delay-200">
                <p className="text-muted text-sm mb-1">Waiting for</p>
                <SparklesText
                  text={currentLeader?.displayName ?? 'Leader'}
                  className="!text-xl !font-bold"
                  colors={{ first: '#3b82f6', second: '#d4a843' }}
                  sparklesCount={8}
                />
                <p className="text-muted text-sm mt-1 pulse-glow">to propose a team...</p>
              </div>
            )}
          </div>
        )}

        {/* TEAM VOTE */}
        {roomState.phase === GamePhase.TeamVote && currentMission && (
          <div className="animate-fade-in-up">
            <VotePanel
              proposal={currentMission.proposals[currentMission.currentProposalIndex]}
              players={roomState.players}
              myId={myId}
              onVote={submitVote}
              missions={roomState.missions}
              currentMissionIndex={roomState.currentMissionIndex}
              showVoteHistory={roomState.config.showVoteHistory !== false}
            />
          </div>
        )}

        {/* MISSION ACTION */}
        {roomState.phase === GamePhase.MissionAction && currentMission && privateInfo && (
          <MissionActionPanel
            mission={currentMission}
            privateInfo={privateInfo}
            myId={myId}
            onSubmit={submitMissionAction}
          />
        )}

        {/* MISSION REVEAL */}
        {roomState.phase === GamePhase.MissionReveal && currentMission && (
          <div className="space-y-4 animate-fade-in">
            {/* Staggered card reveal */}
            <div className="game-card text-center">
              <h3 className="font-serif text-xl font-bold mb-4 text-gold">
                {missionRevealDone ? (
                  <span className={`text-3xl animate-scale-in ${currentMission.result === 'success' ? 'text-success' : 'text-danger'}`}>
                    Mission {currentMission.result === 'success' ? 'Success' : 'Failed'}!
                  </span>
                ) : (
                  <span className="pulse-glow">Revealing mission results...</span>
                )}
              </h3>

              {/* Cards */}
              <div className="flex justify-center gap-3 flex-wrap mb-4">
                {Array.from({ length: currentMission.team?.length || 0 }).map((_, i) => {
                  const isRevealed = i < missionCardsRevealed;
                  // We know total sabotage count but not which cards — shuffle for suspense
                  // Reveal sabotage cards at the end for maximum tension
                  const sabotageStart = (currentMission.team?.length || 0) - currentMission.sabotageCount;
                  const isSabotage = isRevealed && i >= sabotageStart;

                  return (
                    <div
                      key={i}
                      className="transition-all duration-500"
                      style={{
                        width: '60px',
                        height: '84px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        border: isRevealed
                          ? isSabotage ? '2px solid var(--danger)' : '2px solid var(--success)'
                          : '2px solid var(--card-border)',
                        background: isRevealed
                          ? isSabotage ? 'rgba(217,79,79,0.15)' : 'rgba(59,186,94,0.15)'
                          : 'var(--card-bg)',
                        transform: isRevealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
                        opacity: isRevealed ? 1 : 0.4,
                      }}
                    >
                      {isRevealed ? (
                        isSabotage ? (
                          <span className="text-danger animate-scale-in">&#x2717;</span>
                        ) : (
                          <span className="text-success animate-scale-in">&#x2713;</span>
                        )
                      ) : (
                        <span className="text-muted">?</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {missionRevealDone && (
                <p className="text-muted text-sm animate-fade-in">
                  {currentMission.sabotageCount} sabotage card{currentMission.sabotageCount !== 1 ? 's' : ''} played
                </p>
              )}
            </div>

            {/* Mission Story — cinematic narrative */}
            {currentMission.story && (
              <div className="game-card border border-card-border animate-fade-in-up delay-200 space-y-4">
                {/* Headline */}
                <h2 className={`font-serif text-2xl md:text-3xl font-bold text-center leading-tight ${
                  currentMission.result === 'success' ? 'text-gold' : 'text-danger'
                }`}>
                  {currentMission.story.headline}
                </h2>

                {/* Narrative */}
                <p className="text-foreground/80 text-sm md:text-base leading-relaxed text-center">
                  {currentMission.story.narrative}
                </p>

                {/* Stats bar */}
                <div className={`rounded-lg px-4 py-2.5 text-center text-xs md:text-sm font-medium tracking-wide ${
                  currentMission.result === 'success'
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-danger/10 text-danger border border-danger/20'
                }`}>
                  {currentMission.story.stats}
                </div>

                {/* Bible verse */}
                <div className="text-center pt-1">
                  <p className="font-serif italic text-foreground/70 text-sm leading-relaxed">
                    &ldquo;{currentMission.story.verse}&rdquo;
                  </p>
                  <p className="text-[10px] text-gold/70 tracking-wide mt-1.5">
                    &mdash; {currentMission.story.verseRef}
                  </p>
                </div>
              </div>
            )}

            {/* EGW Mission Quote */}
            {missionQuote && (
              <div className="game-card border border-gold/20 bg-gold/5 text-center animate-fade-in-up delay-300">
                <p className="font-serif italic text-light/90 text-sm leading-relaxed mb-2">
                  &ldquo;{missionQuote.text}&rdquo;
                </p>
                <p className="text-[10px] text-gold/70 tracking-wide">
                  &mdash; Ellen G. White, {missionQuote.reference}
                </p>
              </div>
            )}

            {isHost && (
              <button onClick={advancePhase} className="btn btn-primary w-full animate-slide-up delay-500">
                Continue
              </button>
            )}
          </div>
        )}

        {/* EVANGELIST ACTION */}
        {roomState.phase === GamePhase.EvangelistAction && privateInfo && (
          <div className="animate-fade-in-up">
            <EvangelistPanel
              players={roomState.players}
              privateInfo={privateInfo}
              myId={myId}
              hasActed={roomState.evangelistHasActedThisMission}
              onConvert={evangelistConvert}
              onSkip={advancePhase}
              isHost={isHost}
              playerCount={roomState.players.length}
            />
          </div>
        )}

        {/* ASSASSIN GUESS */}
        {roomState.phase === GamePhase.AssassinGuess && privateInfo && (
          <div className="animate-fade-in-up">
            <AssassinPanel
              players={roomState.players}
              privateInfo={privateInfo}
              myId={myId}
              onGuess={assassinGuess}
              guessesRemaining={roomState.assassinGuessesRemaining}
            />
          </div>
        )}

        {/* GAME OVER */}
        {roomState.phase === GamePhase.GameOver && roomState.result && (
          <div className="animate-fade-in">
            <GameOverPanel
              result={roomState.result}
              players={roomState.players}
              isHost={isHost}
              onRestart={restartGame}
              onReturnToLobby={returnToLobby}
            />
          </div>
        )}
      </div>

      {/* Paywall modal — skip during Sabbath */}
      {showPaywall && roomState && !sabbathActive && (
        <PaywallModal
          roomCode={roomState.code}
          onClose={() => setShowPaywall(false)}
          onCouponApplied={() => setShowPaywall(false)}
          playerCount={roomState.players.length}
        />
      )}

      <p className="text-center text-xs text-muted mt-6 pb-2">v{APP_VERSION}</p>

      {/* Extra padding when chat bar is visible */}
      {isInGame && <div className="h-10" />}

      {/* Chat panel — visible during gameplay */}
      {isInGame && <ChatPanel />}

      {/* Notes panel — slide-in from right */}
      {isInGame && (
        <NotesPanel
          players={roomState.players}
          myId={myId}
          roomCode={roomState.code}
          open={notesOpen}
          onClose={() => setNotesOpen(false)}
        />
      )}
    </div>
  );
}
