'use client';

import { useState, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import type { ChatMessage, ClientPlayer } from '@/lib/game/types';
import { chatNotification } from '@/lib/game/sounds';

export default function ChatPanel() {
  const { chatMessages, sendChat, sendAccusation, sendReaction, roomState, session } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAccuseDropdown, setShowAccuseDropdown] = useState(false);
  const [accuseReason, setAccuseReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef(expanded);
  const prevMessageCountRef = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  // Track unread messages
  useEffect(() => {
    if (chatMessages.length > prevMessageCountRef.current) {
      if (!expandedRef.current) {
        setUnreadCount(prev => prev + (chatMessages.length - prevMessageCountRef.current));
        chatNotification();
      }
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages.length]);

  // Clear unread when expanded
  useEffect(() => {
    if (expanded) {
      setUnreadCount(0);
    }
  }, [expanded]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (expanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, expanded]);

  const players = roomState?.players ?? [];
  const myId = session?.playerId ?? '';

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    sendChat(text);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAccuse = (targetId: string) => {
    const reason = accuseReason.trim();
    if (!reason) return;
    sendAccusation(targetId, reason);
    setAccuseReason('');
    setShowAccuseDropdown(false);
  };

  const otherPlayers = players.filter(p => p.id !== myId);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        {/* Collapsed bar - slim */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full flex items-center justify-between px-4 py-2"
            style={{
              background: 'var(--card-bg)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">Chat</span>
            {unreadCount > 0 && (
              <span
                className="text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-scale-in"
                style={{ background: 'var(--accent-blue)' }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Expanded panel */}
        {expanded && (
          <div
            className="flex flex-col"
            style={{
              height: '320px',
              background: 'var(--card-bg)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Header */}
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center justify-between px-4 py-2 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-muted text-xs font-semibold uppercase tracking-wider">Chat</span>
              <span className="text-muted text-[10px]">tap to collapse</span>
            </button>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              {chatMessages.length === 0 && (
                <p className="text-muted text-xs text-center italic mt-4">No messages yet</p>
              )}
              {chatMessages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} myId={myId} onReact={sendReaction} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Accuse dropdown */}
            {showAccuseDropdown && (
              <div className="px-4 py-2 shrink-0" style={{ borderTop: '1px solid rgba(217,79,79,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-danger text-[10px] font-bold uppercase tracking-wider">Accuse</span>
                  <button
                    onClick={() => setShowAccuseDropdown(false)}
                    className="text-muted text-xs ml-auto hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={accuseReason}
                  onChange={e => setAccuseReason(e.target.value)}
                  placeholder="Why are they suspicious?"
                  className="mb-2"
                  style={{ fontSize: '0.8125rem' }}
                  maxLength={500}
                />
                <div className="flex flex-wrap gap-1.5">
                  {otherPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAccuse(p.id)}
                      disabled={!accuseReason.trim()}
                      className="text-xs px-2 py-1 rounded text-danger disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      style={{
                        background: 'rgba(217,79,79,0.1)',
                        border: '1px solid rgba(217,79,79,0.25)',
                      }}
                    >
                      {p.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-2 flex items-center gap-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1"
                style={{ fontSize: '0.8125rem', borderBottom: '2px solid rgba(255,255,255,0.1)' }}
                maxLength={500}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="text-blue text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-opacity px-1"
              >
                &#9654;
              </button>
              <button
                onClick={() => setShowAccuseDropdown(!showAccuseDropdown)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors"
                style={{
                  color: showAccuseDropdown ? 'var(--danger)' : 'rgba(217,79,79,0.6)',
                  background: showAccuseDropdown ? 'rgba(217,79,79,0.15)' : 'transparent',
                }}
                title="Accuse a player"
              >
                Accuse
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ message, myId, onReact }: { message: ChatMessage; myId: string; onReact: (messageId: string, emoji: string) => void }) {
  const isMe = message.senderId === myId;

  if (message.type === 'system') {
    return (
      <div className="animate-fade-in py-1 text-center">
        <p className="text-xs italic text-muted/70">{message.text}</p>
      </div>
    );
  }

  if (message.type === 'accusation') {
    return (
      <div
        className="animate-fade-in py-1.5 pl-3"
        style={{ borderLeft: '2px solid var(--danger)' }}
      >
        <p className="text-sm">
          <span className="font-semibold text-danger">{message.senderName}</span>
          <span className="text-muted"> accuses </span>
          <span className="font-semibold text-danger">{message.targetName}</span>
          <span className="text-muted">: </span>
          <span className="text-foreground/80 italic">{message.text}</span>
        </p>
      </div>
    );
  }

  const REACTION_EMOJIS = ['👍', '👀', '🙏', '🔥'];

  return (
    <div className={`animate-fade-in py-0.5 ${isMe ? 'text-right' : ''}`}>
      <p className="text-sm">
        <span className={`font-semibold ${isMe ? 'text-blue' : 'text-gold/80'}`}>
          {message.senderName}
        </span>
        <span className="text-muted"> </span>
        <span className="text-foreground/80">{message.text}</span>
      </p>
      {/* Reactions display */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div className={`flex gap-1 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
          {Object.entries(message.reactions).map(([emoji, playerIds]) => (
            <button
              key={emoji}
              onClick={() => onReact(message.id, emoji)}
              className="text-[10px] px-1.5 py-0.5 rounded-full transition-colors"
              style={{
                background: playerIds.includes(myId) ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.05)',
                border: playerIds.includes(myId) ? '1px solid rgba(74,144,217,0.3)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {emoji} {playerIds.length}
            </button>
          ))}
        </div>
      )}
      {/* Reaction buttons (show on hover/focus area) */}
      <div className={`flex gap-0.5 mt-0.5 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity ${isMe ? 'justify-end' : ''}`}>
        {REACTION_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => onReact(message.id, emoji)}
            className="text-[11px] px-1 py-0.5 rounded hover:bg-white/10 transition-colors"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
