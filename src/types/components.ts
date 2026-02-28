/**
 * Component prop type definitions
 * Centralized type definitions for React component props
 */

import { Item, EnhancedItem } from './item';
import { UserProfile } from './user';
import {
  Message,
  Notification,
  SwipeFilterPreferences,
} from './swipe-trading';
import { ReactNode } from 'react';

/**
 * Common component props
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Loading component props
 */
export interface LoadingProps extends BaseComponentProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Error component props
 */
export interface ErrorProps extends BaseComponentProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: ReactNode;
  ariaLabel?: string;
}

/**
 * Input component props
 */
export interface InputProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  autoComplete?: string;
  ariaLabel?: string;
}

/**
 * Select/Dropdown component props
 */
export interface SelectProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  ariaLabel?: string;
}

/**
 * Toast/Notification component props
 */
export interface ToastProps extends BaseComponentProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

/**
 * Card component props
 */
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  image?: string;
  onClick?: () => void;
  footer?: ReactNode;
  header?: ReactNode;
}

/**
 * SwipeCard component props
 */
export interface SwipeCardProps {
  item: Item;
  onSwipe: (direction: 'left' | 'right') => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  distance?: number | null;
  ownerName?: string;
  className?: string;
}

/**
 * SwipeInterface component props
 */
export interface SwipeInterfaceProps {
  userId: string;
  tradeAnchorId: string;
  onTradeOfferCreated?: (offerId: string) => void;
  filters?: SwipeFilterPreferences;
  userCoordinates?: { latitude: number; longitude: number } | null;
}

/**
 * TradeAnchorSelector component props
 */
export interface TradeAnchorSelectorProps {
  userId: string;
  currentAnchorId?: string;
  onSelect: (itemId: string) => void;
  onClose: () => void;
}

/**
 * ConversationView component props
 */
export interface ConversationViewProps {
  conversationId: string;
  userId: string;
  onBack?: () => void;
}

/**
 * MessageList component props
 */
export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  className?: string;
}

/**
 * MessageInput component props
 */
export interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

/**
 * NotificationList component props
 */
export interface NotificationListProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  className?: string;
}

/**
 * ItemCard component props
 */
export interface ItemCardProps {
  item: Item | EnhancedItem;
  onClick?: () => void;
  showDistance?: boolean;
  showOwner?: boolean;
  showFavorite?: boolean;
  onFavorite?: () => void;
  isFavorited?: boolean;
  className?: string;
}

/**
 * ItemGrid component props
 */
export interface ItemGridProps {
  items: Item[] | EnhancedItem[];
  onItemClick?: (item: Item | EnhancedItem) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * ImageGallery component props
 */
export interface ImageGalleryProps {
  images: string[];
  title?: string;
  onImageChange?: (index: number) => void;
  className?: string;
}

/**
 * Navigation component props
 */
export interface NavigationProps {
  currentPath: string;
  unreadCount?: number;
  className?: string;
}

/**
 * Profile component props
 */
export interface ProfileProps {
  user: UserProfile;
  isOwnProfile: boolean;
  onEdit?: () => void;
  className?: string;
}

/**
 * Filter component props
 */
export interface FilterProps {
  filters: SwipeFilterPreferences;
  onChange: (filters: SwipeFilterPreferences) => void;
  onApply: () => void;
  onReset: () => void;
  className?: string;
}

/**
 * EmptyState component props
 */
export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * LoadingProgress component props
 */
export interface LoadingProgressProps {
  phase: 'loading' | 'processing' | 'complete' | 'error';
  messages: {
    loading?: string;
    processing?: string;
    complete?: string;
    error?: string;
  };
  progress?: number;
  className?: string;
}

/**
 * ErrorBoundary component props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * ErrorBoundary component state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * SkipLink component props
 */
export interface SkipLinkProps {
  href: string;
  label: string;
  className?: string;
}

/**
 * FocusTrap component props
 */
export interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
  onEscape?: () => void;
}

/**
 * LazyImage component props
 */
export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * ResponsiveImage component props
 */
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  deviceType?: 'mobile' | 'desktop' | 'auto';
  width?: number;
  height?: number;
  crop?: string;
  className?: string;
}
