import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { HapticProvider } from './contexts/HapticContext';
import { AudioProvider } from './contexts/AudioContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { MainLayout } from './components/MainLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { SkipLinks } from './components/SkipLinks';

// Lazy load all route components for code splitting
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile').then(m => ({ default: m.CompleteProfile })));
const EditProfile = lazy(() => import('./pages/EditProfile').then(m => ({ default: m.EditProfile })));
const Listings = lazy(() => import('./pages/Listings').then(m => ({ default: m.Listings })));
const ItemDetail = lazy(() => import('./pages/ItemDetail').then(m => ({ default: m.ItemDetail })));
const EditItem = lazy(() => import('./pages/EditItem').then(m => ({ default: m.EditItem })));
const SwipeTradingPage = lazy(() => import('./pages/SwipeTradingPage').then(m => ({ default: m.SwipeTradingPage })));
const SwipeHistory = lazy(() => import('./pages/SwipeHistory').then(m => ({ default: m.SwipeHistory })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const ConversationView = lazy(() => import('./components/ConversationView').then(m => ({ default: m.ConversationView })));
const TradeOffers = lazy(() => import('./pages/TradeOffers').then(m => ({ default: m.TradeOffers })));
const TradeHistory = lazy(() => import('./pages/TradeHistory').then(m => ({ default: m.TradeHistory })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Demo = lazy(() => import('./pages/Demo').then(m => ({ default: m.Demo })));

// Loading fallback component for route transitions
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner message="Loading page" size="lg" showDots />
    </div>
  );
}

/**
 * Inner component so useLocation works inside BrowserRouter.
 *
 * Auth pages (/login, /forgot-password, /complete-profile) are rendered in a
 * stable <Routes> with NO key — React Router swaps route components without
 * remounting the whole tree. Their card-level CSS animations (animate-authCardIn,
 * animate-fadeUp) fire on each mount automatically.
 *
 * Main layout pages use a separate stable <Routes> whose <Outlet> is wrapped in
 * AnimatePresence inside MainLayout for smooth per-page transitions.
 */
function AppRoutes() {
  const location = useLocation();
  const isAuthPath = ['/login', '/forgot-password', '/complete-profile'].includes(location.pathname);

  return (
    <>
      {/* Auth routes — stable Routes, CSS animations handle entrance */}
      {isAuthPath && (
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Login />
                  </Suspense>
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ForgotPassword />
                  </Suspense>
                </PublicRoute>
              }
            />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute requireProfile={false}>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <CompleteProfile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      )}

      {/* Main layout routes — AnimatePresence inside MainLayout handles page transitions */}
      {!isAuthPath && (
        <Routes>
          <Route 
            path="/demo" 
            element={
              <Suspense fallback={<RouteLoadingFallback />}>
                <Demo />
              </Suspense>
            } 
          />
          <Route element={<MainLayout />}>
            <Route 
              path="/" 
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Home />
                </Suspense>
              } 
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Profile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <EditProfile />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Listings />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ItemDetail />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id/edit"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <EditItem />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/swipe-trading"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <SwipeTradingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/swipe-history"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <SwipeHistory />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <MessagesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ConversationView />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade-offers"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <TradeOffers />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade-history"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <TradeHistory />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

// AnimatePresence is kept at the top level to handle the auth ↔ main layout swap
function AnimatedApp() {
  const location = useLocation();
  const isAuthPath = ['/login', '/forgot-password', '/complete-profile'].includes(location.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <AppRoutes key={isAuthPath ? 'auth' : 'main'} />
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <HapticProvider>
        <AudioProvider>
          <BrowserRouter>
            <SkipLinks />
            <AnimatedApp />
          </BrowserRouter>
        </AudioProvider>
      </HapticProvider>
    </ThemeProvider>
  );
}

export default App;
