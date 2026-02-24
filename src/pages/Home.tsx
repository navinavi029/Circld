import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/* ─── Animation variants ─────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 72, damping: 14 } },
};
const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 90, damping: 14 } },
};

/* ─── Marquee strip ──────────────────────────────────── */
const marqueeItems = [
  '🎮 Gaming', '📚 Books', '👟 Sneakers', '🎸 Music Gear', '🖥️ Electronics',
  '🧸 Toys', '🏕️ Outdoors', '👗 Fashion', '🎨 Art', '🔧 Tools',
  '📷 Cameras', '🎿 Sports', '🪴 Plants', '🎵 Vinyl', '🧩 Collectibles',
];

function MarqueeStrip() {
  const items = [...marqueeItems, ...marqueeItems]; // double for seamless loop
  return (
    <div className="relative w-full overflow-hidden py-4 bg-gradient-to-r from-primary/8 via-white/5 to-accent/8 dark:from-primary/5 dark:via-transparent dark:to-accent/5 border-y border-primary/10 dark:border-primary/10">
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="flex gap-6 whitespace-nowrap will-change-transform"
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/60 dark:bg-gray-800/60 border border-primary/15 dark:border-gray-700/60 text-sm font-semibold text-text-secondary dark:text-gray-300 shadow-sm flex-shrink-0 backdrop-blur-sm"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Swipe card mockup ──────────────────────────────── */
function SwipeMockup() {
  return (
    <div className="relative w-64 h-[340px] sm:w-72 sm:h-[380px] mx-auto select-none">
      {/* Background stacked cards */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-accent/25 to-primary/25 backdrop-blur rotate-[8deg] scale-95 border border-white/20 dark:border-white/5 shadow-lg" />
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur rotate-[4deg] scale-[0.97] border border-white/20 dark:border-white/5 shadow-md" />

      {/* Swipe hint arrow */}
      <motion.div
        animate={{ x: [0, 18, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 -right-8 -translate-y-1/2 text-primary text-2xl z-20 drop-shadow-md"
      >
        →
      </motion.div>

      {/* Main card */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 0.8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-white/30 dark:border-white/10"
      >
        {/* Image area */}
        <div className="absolute top-0 left-0 right-0 h-[220px] sm:h-[240px] bg-gradient-to-br from-emerald-200 via-teal-100 to-emerald-300 dark:from-emerald-900/60 dark:via-teal-800/40 dark:to-emerald-800/60 flex items-center justify-center">
          <motion.div
            animate={{ rotate: [-4, 4, -4], scale: [1, 1.06, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl drop-shadow-xl"
          >
            🎮
          </motion.div>

          {/* Like badge */}
          <motion.div
            animate={{ opacity: [0, 1, 1, 1, 0], x: [24, 0, 0, 0, -8], rotate: [18, 12, 12, 12, 8] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.2, repeatDelay: 1 }}
            className="absolute top-4 right-4 bg-primary text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg border-2 border-white/50"
          >
            LIKE ♥
          </motion.div>

          {/* Category badge */}
          <div className="absolute bottom-3 left-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-[10px] font-bold rounded-full px-2 py-0.5 text-primary">
            Gaming
          </div>
        </div>

        {/* Card content area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-black text-text dark:text-white text-sm leading-tight">Nintendo Switch</div>
              <div className="text-[11px] text-primary font-semibold mt-0.5">Wants: Headphones</div>
            </div>
            <div className="bg-primary/10 dark:bg-primary/20 rounded-lg px-2 py-0.5 text-[10px] font-bold text-primary">
              Near you
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex-shrink-0 shadow" />
            <span className="text-[11px] text-text-secondary dark:text-gray-400 font-semibold">marcus_99</span>
            <span className="ml-auto text-[11px] font-bold text-warning">★ 4.9</span>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex gap-5 z-20"
      >
        <div className="w-13 h-13 w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-lg font-bold text-gray-400">
          ✕
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30 border border-white/30 flex items-center justify-center text-xl text-white font-bold">
          ♥
        </div>
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
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.7], [0, 60]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ─── Hero ───────────────────────────────────────────── */}
        <section ref={heroRef} className="relative px-6 pt-16 pb-28 sm:pt-24 sm:pb-36 overflow-hidden">
          {/* Dot-grid background pattern */}
          <div
            className="absolute inset-0 -z-20 opacity-30 dark:opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/60 via-background/80 to-background pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-70" />

          {/* Blobs */}
          <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-primary/12 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] bg-accent/12 rounded-full blur-3xl -z-10 mix-blend-multiply dark:mix-blend-screen pointer-events-none" />

          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center"
          >
            {/* Left copy */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/15 text-primary-dark dark:text-primary-light font-bold text-xs sm:text-sm mb-6 border border-primary/25 backdrop-blur-sm shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  The New Circular Economy
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-black text-text dark:text-white mb-5 tracking-tight leading-[1.04]"
              >
                Trade Items<br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-accent-light to-accent bg-clip-text text-transparent">
                    With a Swipe
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1, duration: 0.75, ease: 'easeOut' }}
                    className="absolute -bottom-1.5 left-0 w-full h-3 bg-primary/15 dark:bg-primary/25 -z-10 rounded-full origin-left"
                  />
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-sm sm:text-lg text-text-secondary dark:text-gray-300 mb-8 max-w-lg leading-relaxed">
                List what you have. Discover what you need. Swipe, match, and swap — no money, no fees, no hassle. Join thousands of traders going circular every day.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="px-8 py-4 rounded-full text-base font-black shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark border-0"
                  >
                    Start Trading Free →
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 rounded-full text-base font-bold border-2 border-primary/30 hover:border-primary/70 hover:bg-primary/5 dark:hover:bg-primary/10 backdrop-blur-sm transition-all"
                  >
                    Browse Listings
                  </Button>
                </motion.div>
              </motion.div>

              {/* Social proof row */}
              <motion.div variants={fadeUp} className="flex items-center gap-4">
                <div className="flex -space-x-2.5">
                  {['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰'].map((e, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-gray-700 dark:to-gray-600 border-2 border-white dark:border-gray-900 flex items-center justify-center text-sm shadow"
                      style={{ zIndex: 5 - i }}
                    >
                      {e}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-text dark:text-white font-bold">15,000+ traders</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(i => <span key={i} className="text-warning text-xs">★</span>)}
                    <span className="text-[11px] text-text-secondary dark:text-gray-400 ml-1 font-medium">4.9/5 rating</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.75, type: 'spring', stiffness: 60 }}
              className="flex justify-center lg:justify-end pb-8 lg:pb-0"
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
          className="py-14 bg-white/50 dark:bg-gray-800/40 backdrop-blur-md border-b border-white/30 dark:border-gray-700/40 shadow-sm relative z-10"
        >
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '15K+', label: 'Active Traders', icon: '👥' },
              { number: '50K+', label: 'Successful Trades', icon: '🔄' },
              { number: '120+', label: 'Communities', icon: '🌍' },
              { number: '1M+', label: 'Items Listed', icon: '📦' },
            ].map((s, i) => (
              <motion.div key={i} variants={scaleIn} className="group cursor-default flex flex-col items-center gap-1">
                <div className="text-2xl mb-1">{s.icon}</div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="text-3xl sm:text-4xl font-black bg-gradient-to-br from-primary via-accent to-primary-dark dark:from-primary-light dark:to-accent bg-clip-text text-transparent pb-0.5"
                >
                  {s.number}
                </motion.div>
                <div className="text-xs sm:text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── How It Works ──────────────────────────────────── */}
        <section className="py-24 px-6 bg-gradient-to-b from-white/80 to-white/95 dark:from-gray-900/80 dark:to-gray-900/95 backdrop-blur-xl relative z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-accent/10 dark:bg-accent/15 text-accent dark:text-accent-light font-bold text-xs uppercase tracking-widest mb-4 border border-accent/20">
                How It Works
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-text dark:text-white">
                Three steps to your perfect trade
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
            >
              {/* Desktop connector */}
              <div className="hidden md:block absolute top-[72px] left-[calc(50%/3+24px)] right-[calc(50%/3+24px)] h-px bg-gradient-to-r from-primary/40 to-accent/40 dark:from-primary/25 dark:to-accent/25" />

              {[
                { step: '01', title: 'List Your Item', desc: 'Snap a photo, add a description, and pick what you want in return. Takes under a minute.', icon: '📸', accent: 'primary' },
                { step: '02', title: 'Swipe to Match', desc: 'Browse items nearby. Right swipe to like, left to pass. A match happens when both sides say yes.', icon: '👆', accent: 'accent' },
                { step: '03', title: 'Chat & Trade', desc: 'Agree on details in our in-app messenger. Meet up, swap, done. No payment apps needed.', icon: '💬', accent: 'info' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -10 }}
                  className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/60 dark:bg-gray-800/50 backdrop-blur-lg border border-white/50 dark:border-gray-700/40 hover:shadow-2xl hover:bg-white/90 dark:hover:bg-gray-800/80 transition-all duration-300"
                >
                  <div className="relative w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner border border-white/50 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700">
                    {f.icon}
                    <span className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-primary/30">
                      {f.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-text dark:text-white mb-3">{f.title}</h3>
                  <p className="text-text-secondary dark:text-gray-400 text-sm sm:text-base leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Bento feature grid ────────────────────────────── */}
        <section className="py-24 px-6 bg-gradient-to-br from-gray-50/80 via-white/90 to-primary/5 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-900 relative z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/15 text-primary-dark dark:text-primary-light font-bold text-xs uppercase tracking-widest mb-4 border border-primary/20">
                Why Circl'd?
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-text dark:text-white">
                Built different, by design
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {/* Large card */}
              <BentoCard className="lg:col-span-2 bg-gradient-to-br from-primary/8 to-accent/5 dark:from-primary/12 dark:to-accent/8 border-primary/20">
                <div className="text-4xl mb-4">♻️</div>
                <h3 className="text-xl font-black text-text dark:text-white mb-2">100% Cash-Free Trading</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed max-w-md">
                  Trade your unused stuff for what you actually want. No wallets, no payment processors, no hidden fees — ever. Pure peer-to-peer barter, reimagined for the modern age.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['No listing fees', 'No commission', 'No buyer fees'].map(t => (
                    <span key={t} className="px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light text-xs font-bold border border-primary/20">
                      ✓ {t}
                    </span>
                  ))}
                </div>
              </BentoCard>

              <BentoCard className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/40 dark:border-emerald-800/30">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-lg font-black text-text dark:text-white mb-2">Good for Earth</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                  Every trade keeps items out of landfill. Join the movement toward a genuinely circular economy.
                </p>
              </BentoCard>

              <BentoCard className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/40 dark:border-blue-800/30">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-lg font-black text-text dark:text-white mb-2">Match in Minutes</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                  Smart swipe-based discovery surfaces the best matches for your items instantly, no endless scrolling.
                </p>
              </BentoCard>

              {/* Wide card */}
              <BentoCard className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200/40 dark:border-violet-800/30">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="text-xl font-black text-text dark:text-white mb-2">A Community You Can Trust</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed max-w-md">
                  Every user is verified and reviewed. Built-in chat keeps all negotiation safe and transparent — no third-party apps required.
                </p>
              </BentoCard>

              <BentoCard className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/40 dark:border-orange-800/30">
                <div className="text-4xl mb-4">🗺️</div>
                <h3 className="text-lg font-black text-text dark:text-white mb-2">Trade Locally</h3>
                <p className="text-text-secondary dark:text-gray-400 text-sm leading-relaxed">
                  See what's available near you and arrange simple, local meetups. No shipping costs.
                </p>
              </BentoCard>
            </motion.div>
          </div>
        </section>

        {/* ─── Testimonials ──────────────────────────────────── */}
        <section className="py-24 px-6 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl relative z-10 border-t border-white/30 dark:border-gray-800/50">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <span className="inline-block px-3 py-1 rounded-full bg-warning/10 dark:bg-warning/15 text-warning-dark dark:text-warning-light font-bold text-xs uppercase tracking-widest mb-4 border border-warning/20">
                Testimonials
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-text dark:text-white">
                Real trades, real people
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
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
                  whileHover={{ y: -8 }}
                  className="p-6 rounded-3xl bg-gradient-to-br from-white/90 to-white/60 dark:from-gray-800/70 dark:to-gray-800/40 backdrop-blur border border-white/60 dark:border-gray-700/40 hover:shadow-2xl transition-all duration-300 flex flex-col gap-4"
                >
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <span key={j} className="text-warning">★</span>
                    ))}
                  </div>
                  <p className="text-text dark:text-gray-200 text-sm leading-relaxed flex-1 italic">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-accent/25 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-black text-sm text-text dark:text-white">{t.name}</div>
                      <div className="text-[11px] text-primary font-semibold">{t.role}</div>
                    </div>
                    <span className="ml-auto text-[10px] bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light font-bold px-2 py-0.5 rounded-full border border-primary/20">Verified</span>
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
        <section className="py-28 px-6 relative overflow-hidden">
          {/* Rich layered gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-accent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,255,255,0.12)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(0,0,0,0.15)_0%,transparent_60%)]" />
          {/* Pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-3xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-widest mb-6 border border-white/30 backdrop-blur-sm">
              Join for Free
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 drop-shadow-md">
              Your next great swap<br />is waiting.
            </h2>
            <p className="text-white/75 text-sm sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Sign up in seconds, list your first item, and discover a community of traders who have exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="px-10 py-5 rounded-full text-base font-black bg-white text-primary hover:bg-gray-50 border-0 shadow-2xl shadow-black/25"
                >
                  Get Started — It's Free
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-10 py-5 rounded-full text-base font-bold border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/70 transition-all backdrop-blur"
                >
                  See How It Works ↓
                </Button>
              </motion.div>
            </div>

            {/* Micro trust badges */}
            <div className="mt-10 flex items-center justify-center flex-wrap gap-6 text-white/60 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="text-white/80">✓</span> No credit card</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5"><span className="text-white/80">✓</span> Free forever</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5"><span className="text-white/80">✓</span> Cancel anytime</span>
            </div>
          </motion.div>
        </section>

      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-gray-900/30 z-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-secondary dark:text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} Circl'd · Made with 💚 for a better planet</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </>
  );
}
