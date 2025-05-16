'use client';

import { useState, useEffect } from 'react';
import { Circle } from 'lucide-react';

interface CountdownTimerProps {
  duration: number; // Duration in seconds
  onTimeout: () => void;
  isRunning: boolean;
  reset: boolean;
}

export default function CountdownTimer({ duration, onTimeout, isRunning, reset }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [timerKey, setTimerKey] = useState(0);
  
  // Calculate percentage for visual feedback
  const percentComplete = ((duration - timeLeft) / duration) * 100;
  
  // Determine color based on time left
  const getTimerColor = () => {
    if (timeLeft > duration * 0.6) return 'text-green-500';
    if (timeLeft > duration * 0.3) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  useEffect(() => {
    // Reset timer when reset prop changes
    if (reset) {
      setTimeLeft(duration);
      setTimerKey(prev => prev + 1);
    }
  }, [reset, duration]);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalId);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, timeLeft, onTimeout]);
  
  return (
    <div key={timerKey} className="flex items-center">
      <Circle className={`h-5 w-5 mr-2 ${getTimerColor()}`} fill={getTimerColor()} />
      <div className="relative w-28 h-5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-linear ${getTimerColor().replace('text-', 'bg-')}`}
          style={{ width: `${percentComplete}%` }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {timeLeft} giây
        </div>
      </div>
    </div>
  );
}
