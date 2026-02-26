import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
  step: string;
  title: string;
  description: string;
  icon: string;
  visual: React.ReactNode;
  color: string;
}

const slides: Slide[] = [
  {
    step: '01',
    title: 'List Your Item',
    description: 'Snap a photo, add a description, and pick what you want in return. Takes under a minute.',
    icon: '📸',
    color: 'from-emerald-500 to-teal-500',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-64 h-80 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-700"
        >
          <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-7xl"
            >
              🎮
            </motion.div>
          </div>
          <div className="p-4 space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2" />
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex-1 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                📷 Photo
              </div>
              <div className="h-8 bg-emerald-500 rounded-lg flex-1 flex items-center justify-center text-xs font-bold text-white">
                ✓ Post
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute -left-8 top-1/4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 border border-emerald-200 dark:border-emerald-700"
        >
          <div className="text-2xl">📸</div>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="absolute -right-8 top-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 border border-emerald-200 dark:border-emerald-700"
        >
          <div className="text-2xl">✍️</div>
        </motion.div>
      </div>
    ),
  },
  {
    step: '02',
    title: 'Swipe to Match',
    description: 'Browse items nearby. Right swipe to like, left to pass. A match happens when both sides say yes.',
    icon: '👆',
    color: 'from-blue-500 to-indigo-500',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative w-64 h-80"
        >
          {/* Background cards */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rotate-6 scale-95 opacity-40" />
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rotate-3 scale-97 opacity-60" />
          
          {/* Main card */}
          <motion.div
            animate={{ rotate: [0, -2, 2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border-2 border-blue-200 dark:border-blue-700"
          >
            <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center">
              <div className="text-7xl">🎧</div>
            </div>
            <div className="p-4">
              <div className="font-bold text-lg text-gray-900 dark:text-white">Wireless Headphones</div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Wants: Gaming Console</div>
            </div>
          </motion.div>

          {/* Swipe indicators */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: [-100, -40, -100], opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-6xl"
          >
            ✕
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: [100, 40, 100], opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl"
          >
            ♥
          </motion.div>
        </motion.div>
      </div>
    ),
  },
  {
    step: '03',
    title: 'Chat & Trade',
    description: 'Agree on details in our in-app messenger. Meet up, swap, done. No payment apps needed.',
    icon: '💬',
    color: 'from-purple-500 to-pink-500',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-64 h-80 rounded-3xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden border-2 border-purple-200 dark:border-purple-700"
        >
          {/* Chat header */}
          <div className="h-16 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center gap-3 px-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <div className="font-bold text-white text-sm">Sarah M.</div>
              <div className="text-white/80 text-xs">Online</div>
            </div>
          </div>

          {/* Chat messages */}
          <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900 h-64 overflow-hidden">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2"
            >
              <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[70%]">
                Hi! Interested in trading?
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-2 justify-end"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[70%]">
                Yes! When works for you?
              </div>
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-2"
            >
              <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[70%]">
                Tomorrow at 3pm? Coffee shop?
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex gap-2 justify-end"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[70%]">
                Perfect! See you then 👍
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Success checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
          className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl shadow-xl"
        >
          ✓
        </motion.div>
      </div>
    ),
  },
];

export function HowItWorksSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Main slideshow container */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-xl border border-white/60 dark:border-gray-700/40 shadow-2xl">
        
        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12 min-h-[500px]">
          
          {/* Left side - Text content */}
          <div className="flex flex-col justify-center space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Step badge */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center text-3xl shadow-lg`}>
                    {slide.icon}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${slide.color} text-white font-black text-sm shadow-md`}>
                    STEP {slide.step}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-3xl lg:text-4xl font-black text-text dark:text-white leading-tight">
                  {slide.title}
                </h3>

                {/* Description */}
                <p className="text-lg text-text-secondary dark:text-gray-400 leading-relaxed">
                  {slide.description}
                </p>

                {/* Progress bar */}
                <div className="pt-4">
                  <div className="flex gap-2">
                    {slides.map((_, index) => (
                      <motion.div
                        key={index}
                        className={`h-1.5 rounded-full flex-1 cursor-pointer transition-all ${
                          index === currentSlide
                            ? `bg-gradient-to-r ${slide.color}`
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                        onClick={() => goToSlide(index)}
                        whileHover={{ scale: 1.05 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right side - Visual */}
          <div className="flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {slide.visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide indicators (dots) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-primary w-8'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Auto-play indicator (optional) */}
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary dark:text-gray-400">
          Use arrow keys or swipe to navigate • {currentSlide + 1} of {slides.length}
        </p>
      </div>
    </div>
  );
}
