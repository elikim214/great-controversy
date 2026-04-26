'use client';

import { GameProvider } from '@/context/GameContext';
import LandingPage from '@/components/LandingPage';

export default function Home() {
  return (
    <GameProvider>
      <LandingPage />
    </GameProvider>
  );
}
