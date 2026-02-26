/**
 * Flow Step Configuration System
 * 
 * Defines the complete trade flow demonstration with 11 comprehensive steps
 * covering the entire user journey from profile setup through trade completion.
 * 
 * Each step includes:
 * - Component to render
 * - Props for the component
 * - Simulated interaction (animation/gesture)
 * - Minimum display duration (at least 3000ms)
 */

import { ComponentType } from 'react';
import { IntroSlide } from '../components/IntroSlide';
import { WelcomeSlide } from '../components/WelcomeSlide';
import { CompletionSlide } from '../components/CompletionSlide';
import { DemoSwipeCard } from '../components/DemoSwipeCard';
import { DemoNotificationList } from '../components/DemoNotificationList';
import { DemoConversationView } from '../components/DemoConversationView';

/**
 * Simulated interaction types that can be performed during a flow step
 */
export interface SimulatedInteraction {
  /** Type of interaction to simulate */
  type: 'swipe' | 'notification-appear' | 'message-send' | 'button-click';
  /** Delay in milliseconds before starting the interaction */
  delay: number;
  /** Duration in milliseconds for the interaction animation */
  duration: number;
  /** Optional interaction-specific data */
  data?: any;
}

/**
 * Configuration for a single step in the demo flow
 */
export interface FlowStep {
  /** Unique identifier for the step */
  id: string;
  /** Type of step (determines behavior and styling) */
  type: 'intro' | 'swipe' | 'match' | 'message' | 'completion';
  /** Title displayed for the step */
  title: string;
  /** Description text (may be animated with typing effect) */
  description: string;
  /** React component to render for this step */
  component: ComponentType<any>;
  /** Props to pass to the component */
  componentProps: Record<string, any>;
  /** Optional simulated interaction to perform during this step */
  simulatedInteraction?: SimulatedInteraction;
  /** Minimum time in milliseconds to display this step before auto-advancing */
  minDisplayDuration: number;
}

/**
 * Complete flow step configurations for the demo
 * 
 * Enhanced with 11 comprehensive steps covering the entire user journey
 */
export const DEMO_FLOW_STEPS: FlowStep[] = [
  // Step 1: Introduction
  {
    id: 'intro',
    type: 'intro',
    title: 'Welcome to Circl\'d',
    description: 'The modern way to trade locally. Swipe, match, and exchange items with people in your community—all in one seamless experience.',
    component: WelcomeSlide,
    componentProps: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600'
    },
    minDisplayDuration: 3500
  },

  // Step 2: Profile Setup
  {
    id: 'profile-setup',
    type: 'intro',
    title: 'Create Your Profile',
    description: 'Set up your profile in seconds. Add a photo and location to build trust and connect with your local trading community.',
    component: IntroSlide,
    componentProps: {
      icon: '👤',
      gradient: 'from-blue-500 via-indigo-500 to-purple-600'
    },
    minDisplayDuration: 3500
  },

  // Step 3: Add Your Item
  {
    id: 'add-item',
    type: 'intro',
    title: 'List Your Items',
    description: 'Snap a few photos, write a quick description, and list what you want to trade. It takes less than a minute to get started.',
    component: IntroSlide,
    componentProps: {
      icon: '📦',
      gradient: 'from-purple-500 via-pink-500 to-rose-600'
    },
    minDisplayDuration: 3500
  },

  // Step 4: Browse Items
  {
    id: 'browse',
    type: 'intro',
    title: 'Discover Items',
    description: 'Explore items from traders nearby. Use smart filters to find exactly what you\'re looking for by category, condition, and distance.',
    component: IntroSlide,
    componentProps: {
      icon: '🔍',
      gradient: 'from-orange-500 via-amber-500 to-yellow-600'
    },
    minDisplayDuration: 3500
  },

  // Step 5: Swipe Right (Interest)
  {
    id: 'swipe-right',
    type: 'swipe',
    title: 'Swipe Right to Like',
    description: 'Found something you want? Swipe right to express interest and select which of your items you\'d trade for it.',
    component: DemoSwipeCard,
    componentProps: {
      simulationDelay: 2000,
      simulationDuration: 800,
      enableSimulation: true
    },
    simulatedInteraction: {
      type: 'swipe',
      delay: 2000,
      duration: 800,
      data: { direction: 'right' }
    },
    minDisplayDuration: 5000
  },

  // Step 6: Swipe Left (Pass)
  {
    id: 'swipe-left',
    type: 'intro',
    title: 'Swipe Left to Pass',
    description: 'Not the right fit? Swipe left to keep browsing. Don\'t worry—you can always revisit items later in your history.',
    component: IntroSlide,
    componentProps: {
      icon: '👈',
      gradient: 'from-slate-500 via-gray-500 to-zinc-600'
    },
    minDisplayDuration: 3000
  },

  // Step 7: Match Notification
  {
    id: 'match',
    type: 'match',
    title: 'Get Matched',
    description: 'When someone likes your item, you\'ll get an instant notification. Review their offer and decide if it\'s a match!',
    component: DemoNotificationList,
    componentProps: {
      simulationDelay: 1500,
      simulationDuration: 600,
      enableSimulation: true
    },
    simulatedInteraction: {
      type: 'notification-appear',
      delay: 1500,
      duration: 600
    },
    minDisplayDuration: 4500
  },

  // Step 8: Review Offers
  {
    id: 'review-offers',
    type: 'intro',
    title: 'Review Trade Offers',
    description: 'All your offers in one place. See who\'s interested, what they\'re offering, and their trader profile—then accept or decline.',
    component: IntroSlide,
    componentProps: {
      icon: '📬',
      gradient: 'from-cyan-500 via-sky-500 to-blue-600'
    },
    minDisplayDuration: 3500
  },

  // Step 9: Messaging
  {
    id: 'message',
    type: 'message',
    title: 'Start Chatting',
    description: 'Once you accept, chat directly with your trade partner. Coordinate meetup details, ask questions, and finalize the exchange.',
    component: DemoConversationView,
    componentProps: {
      simulationDelay: 1500,
      simulationDuration: 1000,
      enableSimulation: true
    },
    simulatedInteraction: {
      type: 'message-send',
      delay: 1500,
      duration: 1000,
      data: { messageText: 'Sounds great! See you then.' }
    },
    minDisplayDuration: 8000
  },

  // Step 10: Safety & Trust
  {
    id: 'safety',
    type: 'intro',
    title: 'Safe & Secure',
    description: 'Your safety matters. Always meet in public places, inspect items carefully, and only confirm when you\'re completely satisfied.',
    component: IntroSlide,
    componentProps: {
      icon: '🛡️',
      gradient: 'from-green-600 via-emerald-600 to-teal-700'
    },
    minDisplayDuration: 3500
  },

  // Step 11: Trade Completion
  {
    id: 'completion',
    type: 'completion',
    title: 'Trade Complete!',
    description: 'Success! Both parties confirm the exchange, and your trade is complete. Build your reputation and discover your next great trade.',
    component: CompletionSlide,
    componentProps: {
      icon: '🎉',
      gradient: 'from-green-500 via-emerald-500 to-teal-600'
    },
    simulatedInteraction: {
      type: 'button-click',
      delay: 2000,
      duration: 500
    },
    minDisplayDuration: 4500
  }
];

/**
 * Get a specific flow step by ID
 */
export function getFlowStepById(id: string): FlowStep | undefined {
  return DEMO_FLOW_STEPS.find(step => step.id === id);
}

/**
 * Get the total number of flow steps
 */
export function getTotalSteps(): number {
  return DEMO_FLOW_STEPS.length;
}

/**
 * Get the index of a flow step by ID
 */
export function getFlowStepIndex(id: string): number {
  return DEMO_FLOW_STEPS.findIndex(step => step.id === id);
}
