import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
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
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
