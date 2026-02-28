/**
 * Central export file for all type definitions
 * Import types from this file for consistency across the application
 */

// Item types
export type {
  Item,
  EnhancedItem,
  ItemMetadata,
  StatusChange,
  UserFavorite,
  ItemView,
} from './item';

// User types
export type {
  UserProfile,
  CreateUserProfile,
} from './user';

// Swipe trading types
export type {
  SwipeRecord,
  SwipeSession,
  TradeOffer,
  TradeOfferNotificationData,
  Notification,
  ItemPoolQuery,
  TradeOfferService,
  SwipeHistoryService,
  NotificationService,
  Conversation,
  Message,
  ConversationSummary,
  MessageNotificationData,
  SwipeFilterPreferences,
} from './swipe-trading';

// Firebase types
export type {
  RateLimitDocument,
  ErrorLogDocument,
  SessionDocument,
  AnalyticsEventDocument,
  WithServerTimestamp,
  PartialUpdate,
} from './firebase';

// Type guards
export {
  isTimestamp,
  isValidItemStatus,
  isValidTradeOfferStatus,
  isValidConversationStatus,
  isValidSwipeDirection,
  isValidNotificationType,
  isValidItemCondition,
} from './firebase';

// Service types
export type {
  RateLimitResult,
  ActionResult,
  SendMessageResult,
  PaginationState,
  ClassifiedError,
  ItemPoolQueryParams,
  BatchProfileResult,
  SyncResult,
  EnrichmentResult,
  ItemDetails,
  UserDetails,
  NotificationResult,
  TradeOfferResult,
  TradeCompletionResult,
  SwipeSessionResult,
  MessageSubscriptionOptions,
  UnsubscribeFunction,
  CacheStats,
  ServiceHealthResult,
  ValidationResult,
  MessageValidationResult,
  ConversationStatusResult,
} from './services';

// Component types
export type {
  BaseComponentProps,
  LoadingProps,
  ErrorProps,
  ModalProps,
  ButtonProps,
  InputProps,
  SelectProps,
  ToastProps,
  CardProps,
  SwipeCardProps,
  SwipeInterfaceProps,
  TradeAnchorSelectorProps,
  ConversationViewProps,
  MessageListProps,
  MessageInputProps,
  NotificationListProps,
  ItemCardProps,
  ItemGridProps,
  ImageGalleryProps,
  NavigationProps,
  ProfileProps,
  FilterProps,
  EmptyStateProps,
  LoadingProgressProps,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  SkipLinkProps,
  FocusTrapProps,
  LazyImageProps,
  ResponsiveImageProps,
} from './components';
