import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { motion, Variants } from 'framer-motion';

export function Home() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 } as any
    },
  };

  const featureVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 120, damping: 12 } as any
    },
  };

  return (
    <>
      <div className="flex-1 flex flex-col pt-8">
        {/* Hero Section */}
        <section className="relative px-6 py-20 sm:py-32 flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full min-h-[80vh]">
          {/* Animated decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl -z-10 animate-[pulse_4s_inifnite] mix-blend-multiply dark:mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl -z-10 animate-[pulse_5s_infinite_ease-in-out_alternate] animation-delay-2000 mix-blend-multiply dark:mix-blend-screen" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVariants}>
              <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary-dark dark:text-primary-light font-bold text-xs sm:text-sm mb-6 inline-block border border-primary/20 backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1">
                ✨ The New Circular Economy
              </span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-black text-text dark:text-white mb-6 sm:mb-8 tracking-tight relative">
              <span className="relative z-10">Trade Items With a</span> <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent relative inline-block">
                Simple Swipe
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute bottom-0 left-0 h-2 bg-primary/30 -z-10 rounded-full"
                />
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-sm sm:text-lg lg:text-xl text-text-secondary dark:text-gray-300 mb-8 sm:mb-10 max-w-2xl leading-relaxed">
              Join the community where your unused items become exactly what someone else is looking for. No money involved, just seamless, sustainable trading.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" onClick={() => navigate('/login')} className="px-8 py-4 rounded-full text-lg shadow-primary/30 shadow-2xl bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark border-0">
                  Start Trading Now
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="px-8 py-4 rounded-full text-lg border-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors backdrop-blur-sm">
                  Learn More
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Stats Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="py-12 bg-white/40 dark:bg-gray-800/40 relative z-10 backdrop-blur-md border-y border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "15K+", label: "Active Users" },
                { number: "50K+", label: "Successful Trades" },
                { number: "120+", label: "Communities" },
                { number: "1M+", label: "Items Listed" }
              ].map((stat, index) => (
                <motion.div key={index} variants={featureVariants} className="flex flex-col items-center group cursor-default">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-br from-primary via-primary-dark to-accent dark:from-primary-light dark:via-primary dark:to-accent bg-clip-text text-transparent mb-2 drop-shadow-md pb-1"
                  >
                    {stat.number}
                  </motion.div>
                  <div className="text-sm sm:text-base font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider group-hover:text-primary transition-colors">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section >

        {/* Features Section */}
        < section className="py-24 bg-gradient-to-b from-white/60 to-white/90 dark:from-gray-900/60 dark:to-gray-900/90 backdrop-blur-xl px-6 relative z-10 transition-colors" >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-5xl font-black text-center text-text dark:text-white mb-16 sm:mb-20 relative"
            >
              How It Works
              <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
            </motion.h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
            >
              {[
                {
                  title: "1. List Your Items",
                  desc: "Snap a picture and add a quick description of the item you want to trade. It takes seconds.",
                  color: "primary",
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "2. Swipe to Match",
                  desc: "Browse items from others in your community. Swipe right if you like it, left to pass.",
                  color: "accent",
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )
                },
                {
                  title: "3. Discuss & Trade",
                  desc: "When there's a match, discuss the trade details safely through our built-in messenger.",
                  color: "info",
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={featureVariants}
                  whileHover={{ y: -10 }}
                  className="flex flex-col items-center text-center p-8 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border border-white/40 dark:border-gray-700/50 hover:shadow-2xl hover:border-white/80 dark:hover:border-gray-600 transition-all duration-300"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-20 h-20 bg-${feature.color}/10 dark:bg-${feature.color}-light/10 rounded-2xl flex items-center justify-center mb-8 text-${feature.color} dark:text-${feature.color}-light shadow-inner`}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-lg sm:text-2xl font-bold text-text dark:text-white mb-3 sm:mb-4">{feature.title}</h3>
                  <p className="text-text-secondary dark:text-gray-400 leading-relaxed text-sm sm:text-lg">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section >
      </div >

      {/* Footer */}
      < footer className="py-8 border-t border-gray-200/50 dark:border-gray-800/50 text-center text-sm text-text-secondary dark:text-gray-500 bg-white/30 dark:bg-gray-900/30 font-medium z-10 transition-colors" >
        <p>© {new Date().getFullYear()} Circl'd. All rights reserved.</p>
      </footer >
    </>
  );
}
