import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slides = [
  {
    title: "Circl'd",
    subtitle: "Swipe-Based Trading Platform",
    description: "Discover and trade items through an intuitive Tinder-style interface",
    gradient: "from-emerald-500 to-teal-600",
    icon: "🔄"
  },
  {
    title: "Swipe Trading",
    subtitle: "Find Your Perfect Match",
    description: "Select your item and swipe through potential trades. Right to express interest, left to pass.",
    gradient: "from-blue-500 to-cyan-600",
    icon: "👆"
  },
  {
    title: "Trade Anchors",
    subtitle: "Your Item, Your Choice",
    description: "Choose what you want to trade and discover items that match your interests",
    gradient: "from-purple-500 to-pink-600",
    icon: "🎯"
  },
  {
    title: "Real-time Messaging",
    subtitle: "Connect with Traders",
    description: "Chat instantly with trade partners after accepting offers. Build trust and finalize details.",
    gradient: "from-orange-500 to-red-600",
    icon: "💬"
  },
  {
    title: "Smart Notifications",
    subtitle: "Never Miss an Offer",
    description: "Get notified of new trade offers, messages, and updates in real-time",
    gradient: "from-indigo-500 to-purple-600",
    icon: "🔔"
  },
  {
    title: "Location-Based",
    subtitle: "Find Items Near You",
    description: "Filter by distance and discover trades in your area with interactive map integration",
    gradient: "from-green-500 to-emerald-600",
    icon: "📍"
  },
  {
    title: "Item Management",
    subtitle: "List & Organize",
    description: "Create listings with multiple photos, categories, conditions, and detailed descriptions",
    gradient: "from-yellow-500 to-orange-600",
    icon: "📝"
  },
  {
    title: "Trade History",
    subtitle: "Track Your Trades",
    description: "View all your offers, accepted trades, and conversation history in one place",
    gradient: "from-pink-500 to-rose-600",
    icon: "📊"
  },
  {
    title: "Dark Mode",
    subtitle: "Your Style, Your Way",
    description: "Toggle between light and dark themes with smooth transitions",
    gradient: "from-slate-700 to-gray-900",
    icon: "🎨"
  },
  {
    title: "Start Trading Today",
    subtitle: "Join Circl'd",
    description: "Built with React, TypeScript, Firebase, and Tailwind CSS",
    gradient: "from-emerald-500 to-teal-600",
    icon: "🚀"
  }
];

export function Demo() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8 overflow-hidden">
      <div className="max-w-6xl w-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="relative"
          >
            <div className={`bg-gradient-to-br ${slide.gradient} rounded-3xl shadow-2xl p-16 text-white min-h-[600px] flex flex-col items-center justify-center text-center`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-9xl mb-8"
              >
                {slide.icon}
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-7xl font-bold mb-4"
              >
                {slide.title}
              </motion.h1>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-semibold mb-8 opacity-90"
              >
                {slide.subtitle}
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-2xl max-w-3xl opacity-80 leading-relaxed"
              >
                {slide.description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full p-4 transition-all backdrop-blur-sm"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Slide Indicators */}
          <div className="flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all rounded-full ${
                  index === currentSlide
                    ? 'bg-white w-12 h-3'
                    : 'bg-white/30 hover:bg-white/50 w-3 h-3'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full p-4 transition-all backdrop-blur-sm"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Keyboard Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-8 text-white/50 text-sm"
        >
          Use ← → arrow keys to navigate
        </motion.div>

        {/* Slide Counter */}
        <div className="text-center mt-4 text-white/70 text-lg font-medium">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>
    </div>
  );
}
