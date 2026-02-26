import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { getPrimaryButtonClasses } from '../styles/designSystem';
import { HowItWorksSlideshow } from '../components/HowItWorksSlideshow';
import { usePageTitle } from '../hooks/usePageTitle';

/* ─── Animation variants ─────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 16 } },
};
const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 16 } },
};

/* ─── Marquee strip ──────────────────────────────────── */
const marqueeItems = [
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '📚', label: 'Books' },
  { emoji: '👟', label: 'Sneakers' },
  { emoji: '🎸', label: 'Music Gear' },
  { emoji: '🖥️', label: 'Electronics' },
  { emoji: '🧸', label: 'Toys' },
  { emoji: '🏕️', label: 'Outdoors' },
  { emoji: '👗', label: 'Fashion' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🔧', label: 'Tools' },
  { emoji: '📷', label: 'Cameras' },
  { emoji: '🎿', label: 'Sports' },
  { emoji: '🪴', label: 'Plants' },
  { emoji: '🎵', label: 'Vinyl' },
  { emoji: '🧩', label: 'Collectibles' },
];

function MarqueeStrip() {
  const items = [...marqueeItems, ...marqueeItems]; // double for seamless loop
  return (
    <div className="relative w-full overflow-hidden py-5 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 dark:from-primary/8 dark:via-accent/5 dark:to-primary/8 border-y border-primary/15 dark:border-primary/15 shadow-inner">
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="flex gap-4 whitespace-nowrap will-change-transform"
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-primary/20 dark:border-gray-700/70 text-sm font-bold text-text dark:text-gray-200 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 flex-shrink-0 backdrop-blur-sm cursor-default"
          >
            <span className="text-lg">{item.emoji}</span>
            <span>{item.label}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Swipe card mockup ──────────────────────────────── */
function SwipeMockup() {
  return (
    <div className="relative w-72 h-[400px] sm:w-80 sm:h-[440px] mx-auto select-none">
      {/* Background stacked cards with improved depth */}
      <motion.div 
        animate={{ rotate: [8, 9, 8], scale: [0.94, 0.95, 0.94] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/30 to-primary/30 backdrop-blur-sm rotate-[8deg] scale-94 border border-white/25 dark:border-white/10 shadow-xl"
      />
      <motion.div 
        animate={{ rotate: [4, 5, 4], scale: [0.96, 0.97, 0.96] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/25 to-accent/25 backdrop-blur-sm rotate-[4deg] scale-96 border border-white/25 dark:border-white/10 shadow-lg"
      />

      {/* Swipe hint arrows - both sides */}
      <motion.div
        animate={{ x: [0, 20, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-10 -translate-y-1/2 text-primary dark:text-primary-light text-3xl z-20 drop-shadow-lg font-bold"
      >
        →
      </motion.div>
      <motion.div
        animate={{ x: [0, -20, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.25 }}
        className="absolute top-1/2 -left-10 -translate-y-1/2 text-error dark:text-error-light text-3xl z-20 drop-shadow-lg font-bold"
      >
        ←
      </motion.div>

      {/* Main card */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/40 dark:border-white/15 bg-white dark:bg-gray-900"
      >
        {/* Image area with gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-[260px] sm:h-[280px] bg-gradient-to-br from-emerald-300 via-teal-200 to-emerald-400 dark:from-emerald-900/70 dark:via-teal-800/50 dark:to-emerald-800/70 flex items-center justify-center relative overflow-hidden">
          {/* Animated background pattern */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"
          />
          
          <motion.div
            animate={{ rotate: [-5, 5, -5], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl drop-shadow-2xl relative z-10"
          >
            🎮
          </motion.div>

          {/* Like badge with improved animation */}
          <motion.div
            animate={{ 
              opacity: [0, 1, 1, 1, 0], 
              x: [30, 0, 0, 0, -10], 
              rotate: [20, 12, 12, 12, 6],
              scale: [0.8, 1, 1, 1, 0.9]
            }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 1.5, repeatDelay: 1.5 }}
            className="absolute top-5 right-5 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-black px-4 py-1.5 rounded-full shadow-xl border-2 border-white/60 backdrop-blur-sm"
          >
            LIKE ♥
          </motion.div>

          {/* Category badge */}
          <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-xs font-bold rounded-full px-3 py-1 text-primary shadow-lg border border-primary/20">
            🎮 Gaming
          </div>
        </div>

        {/* Card content area with better styling */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-black text-text dark:text-white text-base leading-tight">Nintendo Switch</div>
              <div className="text-xs text-primary dark:text-primary-light font-bold mt-1 flex items-center gap-1">
                <span>→</span> Wants: Headphones
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary/15 to-accent/15 dark:from-primary/25 dark:to-accent/25 rounded-xl px-3 py-1 text-xs font-bold text-primary dark:text-primary-light border border-primary/20">
              📍 Near you
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 shadow-md ring-2 ring-white dark:ring-gray-900" />
            <span className="text-xs text-text-secondary dark:text-gray-400 font-semibold">marcus_99</span>
            <span className="ml-auto text-xs font-bold text-warning flex items-center gap-0.5">
              <span>★</span> 4.9
            </span>
          </div>
        </div>
      </motion.div>

      {/* Action buttons with improved styling */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
        className="absolute -bottom-9 left-1/2 -translate-x-1/2 flex gap-6 z-20"
      >
        <motion.div 
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-2xl border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center text-xl font-bold text-error hover:bg-error/10 dark:hover:bg-error/20 transition-all cursor-pointer"
        >
          ✕
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/40 border-2 border-white/40 flex items-center justify-center text-2xl text-white hover:shadow-primary/60 transition-all cursor-pointer"
        >
          ♥
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Comparison table ───────────────────────────────── */
function ComparisonTable() {
  const features = [
    { label: 'No cash required', circld: true, others: false },
    { label: 'Swipe-based matching', circld: true, others: false },
    { label: 'Built-in messaging', circld: true, others: '⚠️ Limited' },
    { label: 'Eco-friendly by design', circld: true, others: false },
    { label: 'Zero listing fees', circld: true, others: false },
    { label: 'Community trust system', circld: true, others: '⚠️ Varies' },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur">
      {/* Header */}
      <div className="grid grid-cols-3 text-center text-xs font-black uppercase tracking-widest">
        <div className="py-4 px-4 text-left text-text-secondary dark:text-gray-400 bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-200/60 dark:border-gray-700/50">Feature</div>
        <div className="py-4 px-4 bg-primary/10 dark:bg-primary/15 border-b border-primary/20 relative">
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Circl'd</span>
          <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>
        <div className="py-4 px-4 text-text-secondary dark:text-gray-400 bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-200/60 dark:border-gray-700/50">Others</div>
      </div>
      {features.map((f, i) => (
        <div
          key={i}
          className={`grid grid-cols-3 text-center text-sm ${i !== features.length - 1 ? 'border-b border-gray-100 dark:border-gray-800/70' : ''}`}
        >
          <div className="py-3.5 px-4 text-left text-text-secondary dark:text-gray-400 font-medium bg-gray-50/30 dark:bg-gray-800/20">{f.label}</div>
          <div className="py-3.5 px-4 bg-primary/5 dark:bg-primary/8 font-bold text-primary text-lg">✓</div>
          <div className="py-3.5 px-4 text-gray-400 dark:text-gray-600 font-semibold text-sm bg-gray-50/30 dark:bg-gray-800/20">
            {f.others === false ? '✗' : f.others}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Bento grid card ────────────────────────────────── */
function BentoCard({
  children, className = '', delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      variants={scaleIn}
      custom={delay}
      whileHover={{ y: -5, scale: 1.015 }}
      className={`rounded-3xl p-6 bg-white/70 dark:bg-gray-800/50 backdrop-blur border border-white/60 dark:border-gray-700/40 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export function Home() {
  usePageTitle('Home');
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.7], [0, 60]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ─── Hero ───────────────────────────────────────────── */}
        <section ref={heroRef} className="relative px-6 pt-20 pb-32 sm:pt-28 sm:pb-40 overflow-hidden">
          {/* Enhanced dot-grid background pattern */}
          <div
            className="absolute inset-0 -z-20 opacity-40 dark:opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #10b981 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Gradient overlays with better blending */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-background/85 to-background pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary opacity-80 shadow-lg shadow-primary/20" />

          {/* Enhanced animated blobs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.12, 0.15, 0.12]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/6 w-[600px] h-[600px] bg-primary rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.12, 0.15, 0.12]
            }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-1/4 right-1/6 w-[500px] h-[500px] bg-accent rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none"
          />

          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            {/* Left copy with enhanced animations */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 dark:from-primary/20 dark:to-accent/20 text-primary-dark dark:text-primary-light font-bold text-sm mb-7 border border-primary/30 backdrop-blur-md shadow-lg shadow-primary/10">
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
                  />
                  The New Circular Economy
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-text dark:text-white mb-6 tracking-tight leading-[1.05]"
              >
                Trade Items<br />
                <span className="relative inline-block mt-2">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary-dark dark:from-primary-light dark:via-accent-light dark:to-primary bg-clip-text text-transparent">
                    With a Swipe
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
                    className="absolute -bottom-2 left-0 w-full h-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 dark:from-primary/30 dark:via-accent/30 dark:to-primary/30 -z-10 rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base sm:text-xl text-text-secondary dark:text-gray-300 mb-10 max-w-xl leading-relaxed font-medium">
                List what you have. Discover what you need. Swipe, match, and swap — no money, no fees, no hassle. Join thousands of traders going circular every day.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    className={`w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-black shadow-2xl shadow-primary/30 ${getPrimaryButtonClasses()} border-0 hover:shadow-primary/50`}
                  >
                    Start Trading Free →
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/listings')}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl text-base font-bold border-2 border-primary/40 hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/15 backdrop-blur-sm transition-all shadow-lg"
                  >
                    Browse Listings
                  </Button>
                </motion.div>
              </motion.div>

              {/* Enhanced social proof */}
              <motion.div variants={fadeUp} className="flex items-center gap-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl px-5 py-4 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                <div className="flex -space-x-3">
                  {['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰'].map((e, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 dark:from-gray-700 dark:to-gray-600 border-3 border-white dark:border-gray-900 flex items-center justify-center text-base shadow-md"
                      style={{ zIndex: 5 - i }}
                    >
                      {e}
                    </motion.div>
                  ))}
                </div>
                <div>
                  <p className="text-sm sm:text-base text-text dark:text-white font-bold">15,000+ traders</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-warning text-sm">★</span>)}
                    <span className="text-xs text-text-secondary dark:text-gray-400 ml-1.5 font-semibold">4.9/5 rating</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right mockup with enhanced entrance */}
            <motion.div
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 70 }}
              className="flex justify-center lg:justify-end pb-12 lg:pb-0"
            >
              <SwipeMockup />
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Category marquee ─────────────────────────────── */}
        <MarqueeStrip />

        {/* ─── Stats bar ─────────────────────────────────────── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="py-16 bg-gradient-to-r from-white/60 via-white/80 to-white/60 dark:from-gray-800/50 dark:via-gray-800/70 dark:to-gray-800/50 backdrop-blur-xl border-y border-gray-200/60 dark:border-gray-700/50 shadow-lg relative z-10"
        >
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {[
              { number: '15K+', label: 'Active Traders', icon: '👥', color: 'from-primary to-accent' },
              { number: '50K+', label: 'Successful Trades', icon: '🔄', color: 'from-accent to-primary-dark' },
              { number: '120+', label: 'Communities', icon: '🌍', color: 'from-primary-dark to-primary' },
              { number: '1M+', label: 'Items Listed', icon: '📦', color: 'from-accent-dark to-accent' },
            ].map((s, i) => (
              <motion.div key={i} variants={scaleIn} className="group cursor-default flex flex-col items-center gap-2">
                <motion.div 
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="text-3xl mb-2 filter drop-shadow-lg"
                >
                  {s.icon}
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className={`text-4xl sm:text-5xl font-black bg-gradient-to-br ${s.color} dark:from-primary-light dark:to-accent bg-clip-text text-transparent pb-1`}
                >
                  {s.number}
                </motion.div>
                <div className="text-xs sm:text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── How It Works ──────────────────────────────────── */}
        <section className="py-28 px-6 bg-gradient-to-b from-white/90 to-gray-50/90 dark:from-gray-900/90 dark:to-gray-950/90 backdrop-blur-xl relative z-10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-accent/15 to-accent-light/15 dark:from-accent/20 dark:to-accent-light/20 text-accent dark:text-accent-light font-bold text-sm uppercase tracking-widest mb-5 border border-accent/30 shadow-lg"
              >
                How It Works
              </motion.span>
              <h2 className="text-3xl sm:text-5xl font-black text-text dark:text-white mb-4">
                Three steps to your perfect trade
              </h2>
              <p className="text-base sm:text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto">
                Getting started is simple. Follow these steps and you'll be trading in minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <HowItWorksSlideshow />
            </motion.div>
          </div>
        </section>

        {/* ─── Bento feature grid ────────────────────────────── */}
        <section className="py-28 px-6 bg-gradient-to-br from-gray-50/90 via-white/95 to-primary/8 dark:from-gray-950 dark:via-gray-900/95 dark:to-gray-900 relative z-10 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl" />
          
          <div className="max-w-6xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-primary/15 to-primary-dark/15 dark:from-primary/20 dark:to-primary-dark/20 text-primary-dark dark:text-primary-light font-bold text-sm uppercase tracking-widest mb-5 border border-primary/30 shadow-lg"
              >
                Why Circl'd?
              </motion.span>
              <h2 className="text-3xl sm:text-5xl font-black text-text dark:text-white mb-4">
                Built different, by design
              </h2>
              <p className="text-base sm:text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto">
                We're not just another marketplace. We're building the future of sustainable trading.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Large card */}
              <BentoCard className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-accent/8 dark:from-primary/15 dark:to-accent/10 border-primary/25 hover:border-primary/40 transition-all">
                <div className="text-5xl mb-5">♻️</div>
                <h3 className="text-2xl font-black text-text dark:text-white mb-3">100% Cash-Free Trading</h3>
                <p className="text-text-secondary dark:text-gray-400 text-base leading-relaxed max-w-lg mb-6">
                  Trade your unused stuff for what you actually want. No wallets, no payment processors, no hidden fees — ever. Pure peer-to-peer barter, reimagined for the modern age.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['No listing fees', 'No commission', 'No buyer fees'].map(t => (
                    <span key={t} className="px-4 py-2 rounded-full bg-primary/15 dark:bg-primary/25 text-primary-dark dark:text-primary-light text-sm font-bold border border-primary/25 shadow-sm hover:shadow-md hover:scale-105 transition-all">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </BentoCard>

              <BentoCard className="bg-gradient-to-br from-emerald-100/80 to-teal-100/80 dark:from-emerald-900/25 dark:to-teal-900/25 border-emerald-300/50 dark:border-emerald-800/40 hover:border-emerald-400/60 dark:hover:border-emerald-700/60 transition-all">
                <div className="text-5xl mb-5">🌱</div>
                <h3 className="text-xl font-black text-text dark:text-white mb-3">Good for Earth</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                  Every trade keeps items out of landfill. Join the movement toward a genuinely circular economy.
                </p>
              </BentoCard>

              <BentoCard className="bg-gradient-to-br from-blue-100/80 to-indigo-100/80 dark:from-blue-900/25 dark:to-indigo-900/25 border-blue-300/50 dark:border-blue-800/40 hover:border-blue-400/60 dark:hover:border-blue-700/60 transition-all">
                <div className="text-5xl mb-5">⚡</div>
                <h3 className="text-xl font-black text-text dark:text-white mb-3">Match in Minutes</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                  Smart swipe-based discovery surfaces the best matches for your items instantly, no endless scrolling.
                </p>
              </BentoCard>

              {/* Wide card */}
              <BentoCard className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-violet-100/80 to-purple-100/80 dark:from-violet-900/25 dark:to-purple-900/25 border-violet-300/50 dark:border-violet-800/40 hover:border-violet-400/60 dark:hover:border-violet-700/60 transition-all">
                <div className="text-5xl mb-5">🔒</div>
                <h3 className="text-2xl font-black text-text dark:text-white mb-3">A Community You Can Trust</h3>
                <p className="text-text-secondary dark:text-gray-400 text-base leading-relaxed max-w-lg">
                  Every user is verified and reviewed. Built-in chat keeps all negotiation safe and transparent — no third-party apps required.
                </p>
              </BentoCard>

              <BentoCard className="bg-gradient-to-br from-orange-100/80 to-amber-100/80 dark:from-orange-900/25 dark:to-amber-900/25 border-orange-300/50 dark:border-orange-800/40 hover:border-orange-400/60 dark:hover:border-orange-700/60 transition-all">
                <div className="text-5xl mb-5">🗺️</div>
                <h3 className="text-xl font-black text-text dark:text-white mb-3">Trade Locally</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                  See what's available near you and arrange simple, local meetups. No shipping costs.
                </p>
              </BentoCard>
            </motion.div>
          </div>
        </section>

        {/* ─── Testimonials ──────────────────────────────────── */}
        <section className="py-28 px-6 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl relative z-10 border-t border-gray-200/60 dark:border-gray-800/60">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-warning/15 to-warning-light/15 dark:from-warning/20 dark:to-warning-light/20 text-warning-dark dark:text-warning-light font-bold text-sm uppercase tracking-widest mb-5 border border-warning/30 shadow-lg"
              >
                Testimonials
              </motion.span>
              <h2 className="text-3xl sm:text-5xl font-black text-text dark:text-white mb-4">
                Real trades, real people
              </h2>
              <p className="text-base sm:text-lg text-text-secondary dark:text-gray-400 max-w-2xl mx-auto">
                See what our community members have to say about their trading experience.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                { avatar: '👩', name: 'Sofia R.', role: 'Camera → Guitar', text: 'Traded my old DSLR for an acoustic guitar I\'ve always wanted. Zero hassle — matched in one afternoon!', stars: 5 },
                { avatar: '👨', name: 'James T.', role: 'Books → Backpack', text: 'The swipe interface is incredibly intuitive. Found my first match within minutes and completed the trade the same day.', stars: 5 },
                { avatar: '🧑', name: 'Ava M.', role: 'Keyboard → Headphones', text: 'I love how sustainable this feels. No cash exchanged, no waste — just stuff going to people who truly need it.', stars: 5 },
              ].map((t, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="p-7 rounded-3xl bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/80 dark:to-gray-800/50 backdrop-blur-md border border-gray-200/60 dark:border-gray-700/50 hover:shadow-2xl hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 flex flex-col gap-5"
                >
                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className="text-warning text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-text dark:text-gray-200 text-base leading-relaxed flex-1 italic font-medium">"{t.text}"</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700/70">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-2xl shadow-md flex-shrink-0 ring-2 ring-white dark:ring-gray-800">
                      {t.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-base text-text dark:text-white">{t.name}</div>
                      <div className="text-xs text-primary dark:text-primary-light font-bold">{t.role}</div>
                    </div>
                    <span className="text-xs bg-primary/15 dark:bg-primary/25 text-primary-dark dark:text-primary-light font-bold px-3 py-1 rounded-full border border-primary/25 shadow-sm">Verified</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Comparison ────────────────────────────────────── */}
        <section className="py-24 px-6 bg-gradient-to-b from-gray-50/80 to-white/90 dark:from-gray-900/80 dark:to-gray-900/95 relative z-10 border-t border-gray-100 dark:border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-info/10 dark:bg-info/15 text-info-dark dark:text-info-light font-bold text-xs uppercase tracking-widest mb-4 border border-info/20">
                The Difference
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-text dark:text-white">
                Circl'd vs. other platforms
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
            >
              <ComparisonTable />
            </motion.div>
          </div>
        </section>

        {/* ─── Final CTA ─────────────────────────────────────── */}
        <section className="py-32 px-6 relative overflow-hidden">
          {/* Rich layered gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary-dark dark:from-primary-dark dark:via-accent-dark dark:to-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(0,0,0,0.12)_0%,transparent_60%)]" />
          {/* Animated pattern overlay */}
          <motion.div
            animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1.5px, transparent 1.5px)',
              backgroundSize: '32px 32px',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative z-10 max-w-4xl mx-auto text-center"
          >
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block px-5 py-2 rounded-full bg-white/25 text-white font-bold text-sm uppercase tracking-widest mb-7 border border-white/40 backdrop-blur-md shadow-xl"
            >
              Join for Free
            </motion.span>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 drop-shadow-2xl leading-tight">
              Your next great swap<br />is waiting.
            </h2>
            <p className="text-white/90 text-base sm:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Sign up in seconds, list your first item, and discover a community of traders who have exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-12">
              <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}>
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-12 py-5 rounded-2xl text-lg font-black bg-white text-primary hover:bg-gray-50 border-0 shadow-2xl shadow-black/30 hover:shadow-black/40"
                >
                  Get Started — It's Free
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.96 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-12 py-5 rounded-2xl text-lg font-bold border-2 border-white/50 text-white hover:bg-white/20 hover:border-white/80 transition-all backdrop-blur-md shadow-xl"
                >
                  See How It Works ↓
                </Button>
              </motion.div>
            </div>

            {/* Enhanced trust badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center justify-center flex-wrap gap-8 text-white/80 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">✓</span>
                No credit card
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">✓</span>
                Free forever
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">✓</span>
                Cancel anytime
              </span>
            </motion.div>
          </motion.div>
        </section>

      </div>

      {/* Enhanced Footer */}
      <footer className="py-10 border-t border-gray-200/60 dark:border-gray-800/60 bg-gradient-to-b from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-950/50 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-xl flex items-center justify-center shadow-lg p-2">
                <img src="/logo.svg" alt="Circl'd Logo" className="w-full h-full object-contain invert" />
              </div>
              <div>
                <h3 className="text-lg font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Circl'd</h3>
                <p className="text-xs text-text-secondary dark:text-gray-500 font-medium">Circular Economy</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm font-semibold">
              <a href="#" className="text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">About</a>
              <a href="#" className="text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">Privacy</a>
              <a href="#" className="text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">Terms</a>
              <a href="#" className="text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors">Contact</a>
            </div>
          </div>
          <div className="text-center pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
            <p className="text-sm text-text-secondary dark:text-gray-500 font-medium">
              © {new Date().getFullYear()} Circl'd · Made with 💚 for a better planet
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
