import { LoadingSpinner } from './LoadingSpinner';

/**
 * Demo component showcasing all LoadingSpinner variants and sizes
 * This file demonstrates the different spinner styles available
 */
export function LoadingSpinnerDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary-dark bg-clip-text text-transparent dark:from-primary-light dark:via-accent-light dark:to-primary mb-4">
            Loading Spinner Variants
          </h1>
          <p className="text-text-secondary dark:text-gray-400">
            Ultra-stylish loading indicators with flowing animations and smooth transitions
          </p>
        </div>

        {/* Flow Variant (Default) - Featured */}
        <section className="bg-gradient-to-br from-white via-primary/5 to-accent/5 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-primary/20 dark:border-primary-light/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
            <h2 className="text-2xl font-bold text-text dark:text-gray-100">Flow Spinner</h2>
            <span className="px-3 py-1 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold rounded-full shadow-lg">DEFAULT</span>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Liquid-like flowing animation with color-shifting gradients and smooth transitions</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-6 bg-white/60 dark:bg-gray-900/50 rounded-2xl backdrop-blur-sm">
              <LoadingSpinner variant="flow" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 bg-white/60 dark:bg-gray-900/50 rounded-2xl backdrop-blur-sm">
              <LoadingSpinner variant="flow" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 bg-white/60 dark:bg-gray-900/50 rounded-2xl backdrop-blur-sm">
              <LoadingSpinner variant="flow" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-6 bg-white/60 dark:bg-gray-900/50 rounded-2xl backdrop-blur-sm">
              <LoadingSpinner variant="flow" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="flow" size="lg" message="Loading your content" />
          </div>
        </section>

        {/* Ripple Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Ripple Effect</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Expanding ripples emanating from center with smooth fade-out</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="ripple" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="ripple" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="ripple" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="ripple" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="ripple" size="lg" message="Broadcasting signal" />
          </div>
        </section>

        {/* Wave Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Wave Spinner</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Traveling wave effect with animated gradient flow</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="wave" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="wave" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="wave" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="wave" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="wave" size="lg" message="Streaming data" />
          </div>
        </section>

        {/* Gradient Variant (Default) */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Gradient Spinner</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Smooth rotating arc with glowing gradient effect</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="gradient" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="gradient" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="gradient" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="gradient" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="gradient" size="lg" message="Loading your content" />
          </div>
        </section>

        {/* Orbit Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Orbit Spinner</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Three dots orbiting around a center point</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="orbit" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="orbit" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="orbit" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="orbit" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="orbit" size="lg" message="Syncing your data" />
          </div>
        </section>

        {/* Dots Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Bouncing Dots</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Three dots with staggered bounce animation and shadows</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="dots" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="dots" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="dots" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="dots" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="dots" size="lg" message="Processing your request" />
          </div>
        </section>

        {/* Bars Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Pulse Bars</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Five bars with wave-like pulsing animation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="bars" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="bars" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="bars" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="bars" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="bars" size="lg" message="Analyzing data" />
          </div>
        </section>

        {/* Pulse Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Pulse Effect</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Expanding ring with glowing center</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="pulse" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="pulse" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="pulse" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="pulse" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="pulse" size="lg" message="Connecting to server" />
          </div>
        </section>

        {/* Default Variant */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">Classic Spinner</h2>
          <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">Traditional circular loading indicator</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="default" size="sm" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Small</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="default" size="md" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Medium</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="default" size="lg" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Large</p>
            </div>
            <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <LoadingSpinner variant="default" size="xl" />
              <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Extra Large</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <LoadingSpinner variant="default" size="lg" message="Please wait" />
          </div>
        </section>

        {/* Usage Examples */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-6">Usage Examples</h2>
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <h3 className="text-lg font-semibold text-text dark:text-gray-100 mb-4">Full Page Loading</h3>
              <div className="h-64 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-inner">
                <LoadingSpinner variant="flow" size="xl" message="Loading application" />
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <h3 className="text-lg font-semibold text-text dark:text-gray-100 mb-4">Inline Loading</h3>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <LoadingSpinner variant="ripple" size="sm" />
                <span className="text-text-secondary dark:text-gray-400">Fetching data...</span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <h3 className="text-lg font-semibold text-text dark:text-gray-100 mb-4">Card Loading</h3>
              <div className="p-8 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                <LoadingSpinner variant="wave" size="lg" message="Loading content" />
              </div>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-6">Code Examples</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto">
              <pre className="text-sm text-gray-100">
                <code>{`// Flow spinner with message (default)
<LoadingSpinner 
  variant="flow" 
  size="lg" 
  message="Loading" 
/>

// Ripple effect
<LoadingSpinner 
  variant="ripple" 
  size="md" 
/>

// Wave animation
<LoadingSpinner 
  variant="wave" 
  size="lg" 
  message="Streaming" 
/>

// Orbit spinner
<LoadingSpinner 
  variant="orbit" 
  size="md" 
/>

// Bouncing dots
<LoadingSpinner 
  variant="dots" 
  size="lg" 
  message="Processing" 
/>

// Pulse bars
<LoadingSpinner 
  variant="bars" 
  size="xl" 
/>

// Gradient spinner
<LoadingSpinner 
  variant="gradient" 
  size="md" 
/>

// Pulse effect
<LoadingSpinner 
  variant="pulse" 
  size="md" 
  message="Syncing" 
/>

// Classic spinner
<LoadingSpinner 
  variant="default" 
  size="sm" 
/>`}</code>
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
