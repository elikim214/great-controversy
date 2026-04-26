'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GameProvider, useGame } from '@/context/GameContext';
import GameRoom from '@/components/GameRoom';

function RoomContent() {
  const params = useParams<{ code: string }>();
  const { roomState, session, rejoinRoom } = useGame();

  // Auto-rejoin if we have a session but no room state
  useEffect(() => {
    if (session && !roomState) {
      rejoinRoom();
    }
  }, [session, roomState, rejoinRoom]);

  return <GameRoom />;
}

export default function RoomPage() {
  return (
    <GameProvider>
      <RoomContent />
    </GameProvider>
  );
}
