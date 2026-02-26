import { motion } from 'framer-motion';
import TypingAnimator from './TypingAnimator';

export interface IntroSlideProps {
  icon: string;
  gradient: string;
  title: string;
  description: string;
  instant?: boolean;
  onComplete?: () => void;
}

export function IntroSlide({ 
  icon, 
  gradient, 
  title, 
  description, 
  instant = false,
  onComplete 
}: IntroSlideProps) {
  return (
    <div className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/50 shadow-xl shadow-black/10 dark:shadow-black/30 rounded-2xl p-8 sm:p-12 md:p-16 min-h-[500px] md:min-h-[600px] flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300">
      {/* Gradient overlay matching website theme */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 dark:opacity-20 rounded-2xl`} />
      
      {/* Enhanced animated background pattern with multiple layers */}
      <motion.div
        className="absolute inset-0 opacity-5 dark:opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div 
          className="absolute top-0 left-0 w-64 h-64 bg-primary dark:bg-primary-light rounded-full blur-3xl"
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
          className="absolute bottom-0 right-0 w-96 h-96 bg-accent dark:bg-accent-light rounded-full blur-3xl"
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
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-primary-light dark:bg-primary rounded-full blur-3xl"
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
      <div className="absolute inset-0 opacity-10 dark:opacity-20">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary dark:bg-primary-light rounded-full"
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
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="text-6xl sm:text-7xl md:text-9xl mb-6 md:mb-8 drop-shadow-2xl grayscale brightness-0 invert"
        >
          {icon}
        </motion.div>
        
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-7xl font-bold mb-4 md:mb-6 px-4 drop-shadow-lg text-text dark:text-gray-100"
        >
          {title}
        </motion.h1>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-base sm:text-lg md:text-2xl max-w-xl sm:max-w-2xl md:max-w-3xl leading-relaxed px-4 text-text-secondary dark:text-gray-400"
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
