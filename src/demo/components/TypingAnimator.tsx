import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface TypingAnimatorProps {
  text: string;
  speed: number; // milliseconds per character (30-80ms)
  onComplete?: () => void;
  instant?: boolean; // skip animation, show immediately
  className?: string;
}

export interface TypingAnimatorRef {
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
}

const TypingAnimator = forwardRef<TypingAnimatorRef, TypingAnimatorProps>(
  ({ text, speed, onComplete, instant = false, className = '' }, ref) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const currentIndexRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);

    // Keep onComplete ref up to date
    useEffect(() => {
      onCompleteRef.current = onComplete;
    }, [onComplete]);

    // Expose pause/resume methods via ref
    useImperativeHandle(ref, () => ({
      pause: () => {
        setIsPaused(true);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      },
      resume: () => {
        setIsPaused(false);
      },
      isPaused: () => isPaused,
    }));

    useEffect(() => {
      // Reset state when text changes
      currentIndexRef.current = 0;
      setIsComplete(false);
      setIsPaused(false);

      // If instant mode, show all text immediately
      if (instant) {
        setDisplayedText(text);
        setIsComplete(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      // Start with empty text
      setDisplayedText('');

      // Cleanup function
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [text, instant]);

    useEffect(() => {
      // Don't animate if instant mode, already complete, or paused
      if (instant || isComplete || isPaused) {
        return;
      }

      // If we've displayed all characters, mark as complete
      if (currentIndexRef.current >= text.length) {
        setIsComplete(true);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      // Schedule next character
      timerRef.current = setTimeout(() => {
        currentIndexRef.current += 1;
        setDisplayedText(text.slice(0, currentIndexRef.current));
      }, speed);

      // Cleanup timer on unmount or when dependencies change
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [displayedText, text, speed, instant, isComplete, isPaused]);

    return <span className={className}>{displayedText}</span>;
  }
);

TypingAnimator.displayName = 'TypingAnimator';

export default TypingAnimator;
