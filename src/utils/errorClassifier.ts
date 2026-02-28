import { FirebaseError } from 'firebase/app';

/**
 * Error classification utility for consistent error handling across the application.
 * Categorizes errors and provides user-friendly messages while preserving technical details.
 */

export type ErrorCategory = 'network' | 'authentication' | 'permission' | 'validation' | 'unknown';

export interface ClassifiedError {
  type: ErrorCategory;
  message: string;
  technicalDetails: {
    code?: string;
    originalMessage: string;
    stack?: string;
  };
}

/**
 * Firebase error code to user-friendly message mappings
 */
const FIREBASE_ERROR_MESSAGES: Record<string, { type: ErrorCategory; message: string }> = {
  // Authentication errors
  'auth/invalid-email': {
    type: 'authentication',
    message: 'Please enter a valid email address.',
  },
  'auth/user-disabled': {
    type: 'authentication',
    message: 'This account has been disabled. Please contact support.',
  },
  'auth/user-not-found': {
    type: 'authentication',
    message: 'No account found with this email address.',
  },
  'auth/wrong-password': {
    type: 'authentication',
    message: 'Incorrect password. Please try again.',
  },
  'auth/email-already-in-use': {
    type: 'authentication',
    message: 'An account with this email already exists.',
  },
  'auth/weak-password': {
    type: 'authentication',
    message: 'Password is too weak. Please use a stronger password.',
  },
  'auth/operation-not-allowed': {
    type: 'authentication',
    message: 'This operation is not allowed. Please contact support.',
  },
  'auth/account-exists-with-different-credential': {
    type: 'authentication',
    message: 'An account already exists with the same email but different sign-in credentials.',
  },
  'auth/invalid-credential': {
    type: 'authentication',
    message: 'Invalid credentials. Please check your login information.',
  },
  'auth/requires-recent-login': {
    type: 'authentication',
    message: 'This operation requires recent authentication. Please log in again.',
  },
  'auth/too-many-requests': {
    type: 'authentication',
    message: 'Too many failed attempts. Please try again later.',
  },

  // Permission errors
  'permission-denied': {
    type: 'permission',
    message: "You don't have permission to perform this action.",
  },
  'firestore/permission-denied': {
    type: 'permission',
    message: "You don't have permission to access this data.",
  },

  // Network errors
  'unavailable': {
    type: 'network',
    message: 'Unable to connect to the server. Please check your internet connection.',
  },
  'firestore/unavailable': {
    type: 'network',
    message: 'Service temporarily unavailable. Please try again.',
  },
  'auth/network-request-failed': {
    type: 'network',
    message: 'Network error. Please check your internet connection and try again.',
  },
  'auth/timeout': {
    type: 'network',
    message: 'Request timed out. Please try again.',
  },

  // Validation errors
  'not-found': {
    type: 'validation',
    message: 'The requested item was not found.',
  },
  'firestore/not-found': {
    type: 'validation',
    message: 'The requested data was not found.',
  },
  'invalid-argument': {
    type: 'validation',
    message: 'Invalid data provided. Please check your input.',
  },
  'firestore/invalid-argument': {
    type: 'validation',
    message: 'Invalid data provided. Please check your input.',
  },
  'already-exists': {
    type: 'validation',
    message: 'This item already exists.',
  },
  'firestore/already-exists': {
    type: 'validation',
    message: 'This record already exists.',
  },
  'failed-precondition': {
    type: 'validation',
    message: 'Operation cannot be completed due to current state.',
  },
  'firestore/failed-precondition': {
    type: 'validation',
    message: 'Operation cannot be completed due to current state.',
  },
  'out-of-range': {
    type: 'validation',
    message: 'Value is out of acceptable range.',
  },
  'firestore/out-of-range': {
    type: 'validation',
    message: 'Value is out of acceptable range.',
  },
};

/**
 * Classifies an error and returns a consistent error object with user-friendly message
 * and technical details for logging.
 *
 * @param error - The error to classify (can be any type)
 * @returns ClassifiedError object with type, message, and technical details
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle Firebase errors
  if (isFirebaseError(error)) {
    return classifyFirebaseError(error);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return classifyStandardError(error);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
      technicalDetails: {
        originalMessage: error,
      },
    };
  }

  // Handle unknown error types
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    technicalDetails: {
      originalMessage: String(error),
    },
  };
}

/**
 * Type guard to check if an error is a Firebase error
 */
function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string' &&
    'message' in error
  );
}

/**
 * Classifies a Firebase error
 */
function classifyFirebaseError(error: FirebaseError): ClassifiedError {
  const errorCode = error.code;
  const mapping = FIREBASE_ERROR_MESSAGES[errorCode];

  if (mapping) {
    return {
      type: mapping.type,
      message: mapping.message,
      technicalDetails: {
        code: errorCode,
        originalMessage: error.message,
        stack: error.stack,
      },
    };
  }

  // If no specific mapping, try to infer category from code prefix
  const inferredType = inferErrorTypeFromCode(errorCode);

  return {
    type: inferredType,
    message: getGenericMessageForType(inferredType),
    technicalDetails: {
      code: errorCode,
      originalMessage: error.message,
      stack: error.stack,
    },
  };
}

/**
 * Classifies a standard Error object
 */
function classifyStandardError(error: Error): ClassifiedError {
  const message = error.message.toLowerCase();

  // Check for network-related keywords
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('offline')
  ) {
    return {
      type: 'network',
      message: 'Network error. Please check your internet connection and try again.',
      technicalDetails: {
        originalMessage: error.message,
        stack: error.stack,
      },
    };
  }

  // Check for permission-related keywords
  if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
    return {
      type: 'permission',
      message: "You don't have permission to perform this action.",
      technicalDetails: {
        originalMessage: error.message,
        stack: error.stack,
      },
    };
  }

  // Check for validation-related keywords
  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('not found') ||
    message.includes('already exists') ||
    message.includes('validation')
  ) {
    return {
      type: 'validation',
      message: error.message, // Use original message for validation errors as they're usually descriptive
      technicalDetails: {
        originalMessage: error.message,
        stack: error.stack,
      },
    };
  }

  // Check for authentication-related keywords
  if (message.includes('auth') || message.includes('login') || message.includes('credential')) {
    return {
      type: 'authentication',
      message: 'Authentication error. Please log in again.',
      technicalDetails: {
        originalMessage: error.message,
        stack: error.stack,
      },
    };
  }

  // Default to unknown
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    technicalDetails: {
      originalMessage: error.message,
      stack: error.stack,
    },
  };
}

/**
 * Infers error type from Firebase error code prefix
 */
function inferErrorTypeFromCode(code: string): ErrorCategory {
  if (code.startsWith('auth/')) {
    return 'authentication';
  }
  if (code.includes('permission')) {
    return 'permission';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'network';
  }
  if (
    code.includes('invalid') ||
    code.includes('not-found') ||
    code.includes('already-exists') ||
    code.includes('failed-precondition')
  ) {
    return 'validation';
  }
  return 'unknown';
}

/**
 * Returns a generic user-friendly message for an error type
 */
function getGenericMessageForType(type: ErrorCategory): string {
  switch (type) {
    case 'network':
      return 'Network error. Please check your internet connection and try again.';
    case 'authentication':
      return 'Authentication error. Please log in again.';
    case 'permission':
      return "You don't have permission to perform this action.";
    case 'validation':
      return 'Invalid data provided. Please check your input.';
    case 'unknown':
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
