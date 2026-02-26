import { motion } from 'framer-motion';
import { useEffect } from 'react';
import TypingAnimator from './TypingAnimator';
import { playSoundEffect } from '../utils/soundEffects';

export interface CompletionSlideProps {
  icon: string;
  gradient: string;
  title: string;
  description: string;
  instant?: boolean;
  onComplete?: () => void;
  onRestart?: () => void;
}

export function CompletionSlide({ 
  icon, 
  gradient, 
  title, 
  description, 
  instant = false,
  onComplete,
  onRestart
}: CompletionSlideProps) {
  // Play completion sound when slide appears
  useEffect(() => {
    if (!instant) {
      const timer = setTimeout(() => {
        playSoundEffect('complete');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [instant]);

  return (
    <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl p-8 sm:p-12 md:p-16 min-h-[500px] md:min-h-[600px] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300">
      {/* Gradient overlay matching website theme */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 dark:opacity-20 rounded-2xl`} />
      
      {/* Enhanced animated celebration particles with multiple rings */}
      <motion.div
        className="absolute inset-0 opacity-15 dark:opacity-25"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 1 }}
      >
        {/* First ring - larger particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`ring1-${i}`}
            className="absolute w-5 h-5 bg-primary dark:bg-primary-light rounded-full shadow-lg"
            initial={{ 
              x: '50%', 
              y: '50%',
              scale: 0 
            }}
            animate={{ 
              x: `${50 + (Math.cos(i * Math.PI / 4) * 45)}%`,
              y: `${50 + (Math.sin(i * Math.PI / 4) * 45)}%`,
              scale: [0, 1.2, 0.6],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 2.5,
              delay: 0.5 + (i * 0.1),
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        ))}
        {/* Second ring - smaller particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`ring2-${i}`}
            className="absolute w-3 h-3 bg-accent dark:bg-accent-light rounded-full"
            initial={{ 
              x: '50%', 
              y: '50%',
              scale: 0 
            }}
            animate={{ 
              x: `${50 + (Math.cos(i * Math.PI / 6) * 35)}%`,
              y: `${50 + (Math.sin(i * Math.PI / 6) * 35)}%`,
              scale: [0, 1, 0.4],
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration: 2,
              delay: 0.7 + (i * 0.08),
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        ))}
      </motion.div>

      {/* Confetti effect */}
      <div className="absolute inset-0 opacity-20 dark:opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`confetti-${i}`}
            className="absolute w-2 h-2 bg-primary dark:bg-primary-light rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-5%'
            }}
            animate={{ 
              y: ['0vh', '110vh'],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeIn"
            }}
          />
        ))}
      </div>

      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 bg-primary/10 dark:bg-primary-light/10 rounded-2xl"
        animate={{ 
          opacity: [0, 0.15, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: [0, 1.3, 1], rotate: [0, 360, 360] }}
          transition={{ 
            delay: 0.2, 
            duration: 0.8,
            times: [0, 0.6, 1]
          }}
          className="text-6xl sm:text-7xl md:text-9xl mb-6 md:mb-8 drop-shadow-2xl grayscale brightness-0 invert"
        >
          {icon}
        </motion.div>
        
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-7xl font-bold mb-4 md:mb-6 px-4 drop-shadow-lg text-text dark:text-gray-100"
        >
          {title}
        </motion.h1>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-base sm:text-lg md:text-2xl max-w-xl sm:max-w-2xl md:max-w-3xl leading-relaxed mb-8 px-4 text-text-secondary dark:text-gray-400"
        >
          <TypingAnimator
            text={description}
            speed={40}
            instant={instant}
            onComplete={onComplete}
          />
        </motion.div>

        {onRestart && (
          <motion.button
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary dark:from-primary-light dark:to-primary text-white font-bold px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-base sm:text-lg md:text-xl transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 border border-primary/20"
          >
            🔄 Restart Demo
          </motion.button>
        )}
      </div>
    </div>
  );
}
