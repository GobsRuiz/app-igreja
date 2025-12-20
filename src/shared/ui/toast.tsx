/**
 * Custom Toast Service
 * Wrapper around sonner-native with custom configurations
 */

import { toast as sonnerToast } from 'sonner-native'

interface ToastOptions {
  description?: string
  duration?: number
}

/**
 * Custom toast service with project-specific configurations
 * - Success: 4s duration
 * - Error: 60s duration
 * - Warning: 4s duration
 * - Info: 4s duration
 */
export const toast = {
  /**
   * Success toast (green) - 4s duration
   */
  success: (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    })
  },

  /**
   * Error toast (red) - 60s duration
   */
  error: (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 60000, // 60 seconds for errors
    })
  },

  /**
   * Warning toast (yellow/orange) - 4s duration
   */
  warning: (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    })
  },

  /**
   * Info toast (blue) - 4s duration
   */
  info: (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
    })
  },

  /**
   * Loading toast - no auto-dismiss
   */
  loading: (message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      description: options?.description,
    })
  },

  /**
   * Dismiss specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  },

  /**
   * Promise-based toast
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },
}
