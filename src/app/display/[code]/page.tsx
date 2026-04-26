'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GameProvider } from '@/context/GameContext';
import PublicDisplay from '@/components/PublicDisplay';
import { getSocket } from '@/lib/socket/client';

function DisplayContent() {
  const params = useParams<{ code: string }>();

  useEffect(() => {
    const socket = getSocket();
    const code = params.code;
    if (code) {
      socket.emit('room:spectate', { roomCode: code.toUpperCase() }, () => {});
    }
  }, [params.code]);

  return <PublicDisplay />;
}

export default function DisplayPage() {
  return (
    <GameProvider>
      <DisplayContent />
    </GameProvider>
  );
}
