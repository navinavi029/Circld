import { DemoDataProvider } from '../demo/contexts/DemoDataContext';
import { DemoFlowController } from '../demo/components/DemoFlowController';

/**
 * Demo Page Component
 * 
 * Enhanced demonstration page that showcases the Circl'd trading platform
 * using real application components with typing animations and a complete
 * trade flow from profile setup through completion.
 * 
 * Features:
 * - 11 comprehensive slides covering the entire user journey
 * - Real component integration (SwipeCard, ConversationView, NotificationList)
 * - Typing animations for engaging presentation
 * - Complete trade flow demonstration
 * - Auto-advance with configurable timing
 * - Keyboard navigation support (arrow keys, space, enter)
 * - Responsive design for all devices
 * - Smooth transitions using Framer Motion
 * - Progress indicator showing current step
 * 
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.3
 */
export function Demo() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 flex items-center justify-center overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>
      
      <div className="w-full h-full flex flex-col relative z-10">
        {/* Wrap demo with data provider to supply mock data to all components */}
        <DemoDataProvider>
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <DemoFlowController 
              autoAdvance={false} 
              autoAdvanceDelay={6000}
            />
          </div>
        </DemoDataProvider>
      </div>
    </div>
  );
}
