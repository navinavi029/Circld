import { motion } from 'framer-motion';
import TypingAnimator from './TypingAnimator';

export interface WelcomeSlideProps {
  gradient: string;
  title: string;
  description: string;
  instant?: boolean;
  onComplete?: () => void;
}

export function WelcomeSlide({ 
  gradient, 
  title, 
  description, 
  instant = false,
  onComplete 
}: WelcomeSlideProps) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-3xl shadow-2xl p-8 sm:p-12 md:p-16 text-white min-h-[500px] md:min-h-[600px] flex flex-col items-center justify-center text-center relative overflow-hidden`}>
      {/* Enhanced animated background pattern with multiple layers */}
      <motion.div
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"
          animate={{ 
            x: ['-50%', '-40%', '-50%'],
            y: ['-50%', '-40%', '-50%'],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
          animate={{ 
            x: ['50%', '40%', '50%'],
            y: ['50%', '40%', '50%'],
            scale: [1, 1.15, 1]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-white rounded-full blur-3xl"
          animate={{ 
            x: ['-50%', '-45%', '-50%'],
            y: ['-50%', '-55%', '-50%'],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Floating particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{ 
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              opacity: 0
            }}
            animate={{ 
              y: [null, `${Math.random() * 100}%`],
              opacity: [0, 0.6, 0]
            }}
            transition={{ 
              duration: 4 + Math.random() * 4,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Logo instead of icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8 md:mb-10"
        >
          <img 
            src="/logo-green.svg" 
            alt="Circl'd Logo" 
            className="h-20 sm:h-24 md:h-32 w-auto mx-auto drop-shadow-2xl brightness-0 invert"
          />
        </motion.div>
        
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-7xl font-bold mb-4 md:mb-6 px-4 drop-shadow-lg"
        >
          {title}
        </motion.h1>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-base sm:text-lg md:text-2xl max-w-xl sm:max-w-2xl md:max-w-3xl opacity-95 leading-relaxed px-4"
        >
          <TypingAnimator
            text={description}
            speed={40}
            instant={instant}
            onComplete={onComplete}
          />
        </motion.div>
      </div>
    </div>
  );
}
