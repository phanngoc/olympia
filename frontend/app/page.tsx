'use client';

import dynamic from 'next/dynamic';

// Disable SSR for QuizLayout to avoid hydration issues with audio recording and Zustand
const QuizLayout = dynamic(() => import('@/components/QuizLayout'), {
  ssr: false,
});

export default function Home() {
  return <QuizLayout />;
}
