# Circl'd

A modern swipe-based trading platform where users can discover and trade items through an intuitive Tinder-style interface. Built with React, TypeScript, and Firebase.

![Circl'd](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.4-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1.18-38bdf8)
![Firebase](https://img.shields.io/badge/Firebase-12.9.0-orange)

## ✨ Features

### Core Trading Experience
- 🔄 **Swipe Trading** - Tinder-style interface for discovering items to trade
- 🎯 **Trade Anchors** - Select your item and swipe through potential matches
- 💬 **Real-time Messaging** - Chat with trade partners after accepting offers
- 📊 **Trade Management** - Track offers, history, and active conversations
- 🔔 **Smart Notifications** - Get notified of new offers and messages

### Item Management
- 📝 **Item Listings** - Create and manage your tradeable items
- 📸 **Image Gallery** - Multiple photos with Cloudinary integration
- 🏷️ **Categories & Conditions** - Organize items by type and quality
- 📍 **Location-based** - Find items near you with map integration
- 📈 **Item Analytics** - View counts, favorites, and swipe interest

### User Experience
- 🔐 **Secure Authentication** - Firebase auth with profile management
- 🎨 **Dark/Light Themes** - Toggle between themes with smooth transitions
- 📱 **Fully Responsive** - Optimized for mobile, tablet, and desktop
- ⚡ **Offline Support** - Local caching for seamless experience
- 🎭 **Smooth Animations** - Card swipes, transitions, and micro-interactions

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your environment variables:
# - Firebase config (auth, firestore, storage)
# - Cloudinary credentials
# - Google Maps API key

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see your app!

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **React Router** - Client-side routing

### Backend & Services
- **Firebase Auth** - User authentication
- **Firestore** - Real-time database
- **Firebase Storage** - File storage
- **Cloudinary** - Image optimization and delivery
- **Leaflet** - Interactive maps

### Testing
- **Vitest** - Unit and integration testing
- **Testing Library** - Component testing
- **Fast-check** - Property-based testing

## 📦 Project Structure

```
circld/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Card, etc.)
│   │   ├── SwipeInterface.tsx
│   │   ├── ConversationView.tsx
│   │   └── ...
│   ├── pages/              # Route pages
│   │   ├── SwipeTradingPage.tsx
│   │   ├── MessagesPage.tsx
│   │   ├── TradeOffers.tsx
│   │   └── ...
│   ├── services/           # Business logic
│   │   ├── itemPoolService.ts
│   │   ├── messagingService.ts
│   │   ├── tradeOfferService.ts
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ProfileContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Helper functions
│   └── firebase.ts         # Firebase configuration
├── .kiro/
│   └── specs/              # Feature specifications
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── vite.config.ts          # Build configuration
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication
3. Create Firestore database
4. Enable Firebase Storage
5. Copy configuration to `.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Cloudinary Setup
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name and upload preset
3. Add to `.env`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Lint TypeScript files
- `npm run lint:fix` - Auto-fix linting issues
- `npm run audit:buttons` - Audit button components in codebase
- `npm run migrate:buttons` - Generate button migration suggestions

## 🎯 Key Features Explained

### Swipe Trading
Users select a "trade anchor" (their item) and swipe through available items:
- **Swipe Right** - Express interest in trading
- **Swipe Left** - Pass on the item
- **Filters** - Distance, category, and condition filters
- **Session Management** - Persistent swipe sessions with history

### Trade Offers
When you swipe right:
1. A trade offer is created and sent to the item owner
2. Owner receives a notification
3. Owner can accept or decline
4. Accepted offers unlock messaging

### Messaging System
Real-time chat for accepted trades:
- Conversation per accepted trade
- Message notifications
- Unread message badges
- Conversation history
- Participant validation

### Item Discovery
- Location-based search with map picker
- Category filtering
- Condition-based filtering
- Related items suggestions
- View tracking and analytics

## 🔒 Security

- **Firestore Security Rules** - Row-level security for all data
- **Storage Rules** - Secure file uploads
- **Environment Variables** - Sensitive data protection
- **Input Validation** - Client and server-side validation
- **Authentication Required** - Protected routes and API calls

## 🎨 Design System

### UI Components
The project includes a comprehensive design system with reusable components:

- **Button Component** - 5 variants (primary, secondary, outline, ghost, danger) with loading states, icon support, and full accessibility
- **LoadingSpinner** - 9 stylish variants (default, dots, pulse, gradient, orbit, bars, flow, ripple, wave) with size options
- **Card, Input, Select** - Consistent form and layout components
- **Modal, Toast, Alert** - Feedback and notification components
- **Dropdown, Checkbox, Pagination** - Interactive UI elements

### Design Principles
- **Color Themes** - Light and dark mode with smooth transitions
- **Responsive Grid** - Mobile-first design with touch-optimized interactions
- **Loading States** - Skeleton screens and animated spinners
- **Error Handling** - User-friendly error messages with recovery options
- **Accessibility** - WCAG 2.1 compliant with ARIA labels, keyboard navigation, and 48px minimum touch targets
- **Animations** - Smooth transitions using Framer Motion with reduced motion support

## 🧪 Testing

The project uses a comprehensive testing strategy:
- **Unit Tests** - Component and service testing
- **Property-Based Tests** - Correctness validation with fast-check
- **Integration Tests** - End-to-end user flows
- **Test Coverage** - Critical paths covered

Run tests with:
```bash
npm test
```

## 🛠️ Development Tools

### Button Audit & Migration
The project includes automated tools for maintaining UI consistency:

- **Button Audit** - Scans codebase to identify all button components and native elements
- **Button Migration** - Analyzes native buttons and provides automated migration suggestions with confidence levels

See [scripts/README.md](scripts/README.md) for detailed documentation.

### Component Documentation
Detailed component documentation is available in:
- [src/components/README.md](src/components/README.md) - Component usage guides
- [scripts/README.md](scripts/README.md) - Development tool documentation

## 📄 License

Private and proprietary.

---

Built with ❤️ by the Circl'd team
