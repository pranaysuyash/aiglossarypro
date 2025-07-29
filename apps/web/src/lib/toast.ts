/**
 * Toast notification utilities
 * Using Sonner for modern, performant toast notifications
 */

import { toast as sonnerToast } from 'sonner';

// Re-export sonner's toast with consistent API
export const toast = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
  loading: sonnerToast.loading,
  promise: sonnerToast.promise,
  custom: sonnerToast,
  dismiss: sonnerToast.dismiss,
};

export default toast;

// Also export the original sonner toast for full API access
export { sonnerToast };