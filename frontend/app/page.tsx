'use client';

import dynamic from 'next/dynamic';

// Disable SSR for QuizLayout to avoid hydration issues with audio recording
const QuizLayout = dynamic(() => import('@/components/QuizLayout'), {
  ssr: true,
});

export default function Home() {
  return <QuizLayout />;
}
