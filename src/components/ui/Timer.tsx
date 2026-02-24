import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { Play, Pause, Square, Redo } from 'lucide-react';

interface TimerProps {
  onStop: (seconds: number) => void;
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const Timer: React.FC<TimerProps> = ({ onStop }) => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onStop(time);
    setIsActive(false);
    setTime(0);
  };

  return (
    <div className="p-3 bg-bg-main rounded-lg border border-border-main flex items-center justify-between">
      <span className="text-2xl font-mono font-semibold tracking-wider text-text-main">
        {formatTime(time)}
      </span>
      <div className="flex items-center gap-2">
        {!isActive ? (
          <Button size="sm" onClick={handleStart} className="flex items-center gap-2">
            <Play size={16} /> Démarrer
          </Button>
        ) : (
          <>
            <Button size="sm" variant="secondary" onClick={handlePauseResume} className="flex items-center gap-2">
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? 'Reprendre' : 'Pause'}
            </Button>
            <Button size="sm" variant="success" onClick={handleStop} className="flex items-center gap-2">
              <Square size={16} /> Arrêter & Valider
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Timer;