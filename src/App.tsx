import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import { CompleteProfile } from './pages/CompleteProfile';
import { EditProfile } from './pages/EditProfile';
import { Listings } from './pages/Listings';
import { ItemDetail } from './pages/ItemDetail';
import { SwipeTradingPage } from './pages/SwipeTradingPage';
import { SwipeHistory } from './pages/SwipeHistory';
import { MessagesPage } from './pages/MessagesPage';
import { ConversationView } from './components/ConversationView';
import { TradeOffers } from './pages/TradeOffers';
import { TradeHistory } from './pages/TradeHistory';
import { Home } from './pages/Home';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

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
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute requireProfile={false}>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      )}

      {/* Main layout routes — AnimatePresence inside MainLayout handles page transitions */}
      {!isAuthPath && (
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings"
              element={
                <ProtectedRoute>
                  <Listings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute>
                  <ItemDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/swipe-trading"
              element={
                <ProtectedRoute>
                  <SwipeTradingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/swipe-history"
              element={
                <ProtectedRoute>
                  <SwipeHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages/:conversationId"
              element={
                <ProtectedRoute>
                  <ConversationView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade-offers"
              element={
                <ProtectedRoute>
                  <TradeOffers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trade-history"
              element={
                <ProtectedRoute>
                  <TradeHistory />
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
      <BrowserRouter>
        <AnimatedApp />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
