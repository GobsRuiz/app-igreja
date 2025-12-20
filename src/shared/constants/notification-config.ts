/**
 * Notification Configuration
 * Constants for event notification scheduling
 */

// ========================================
// LIMITS
// ========================================

/**
 * Maximum number of events that can have notifications enabled simultaneously
 * iOS limit: 64 scheduled notifications
 * 20 events × 3 notifications each = 60 < 64 ✅
 */
export const MAX_NOTIFYING_EVENTS = 20

// ========================================
// NOTIFICATION TIMING
// ========================================

/**
 * Fixed hour for daily notifications (8:00 AM)
 */
export const NOTIFICATION_HOUR = 8

/**
 * Fixed minute for daily notifications (00)
 */
export const NOTIFICATION_MINUTE = 0

/**
 * Days before event to send notifications
 */
export const DAYS_BEFORE_NOTIFICATIONS = [2, 1] // 2 days before, 1 day before

/**
 * Hours before event to send final notification
 */
export const HOURS_BEFORE_FINAL_NOTIFICATION = 3

/**
 * Minimum hours before event to allow notification activation
 * If less than this, the notification button should be hidden
 */
export const MIN_HOURS_TO_ENABLE_NOTIFICATION = 3

// ========================================
// STORAGE KEYS
// ========================================

/**
 * AsyncStorage key for storing notification metadata
 */
export const NOTIFICATION_STORAGE_KEY = '@app-igreja:notifications'
