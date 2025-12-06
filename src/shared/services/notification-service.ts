/**
 * Notification Service
 * Handles local notification scheduling for events using expo-notifications
 */

import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { Event } from '@shared/types'
import {
  MAX_NOTIFYING_EVENTS,
  NOTIFICATION_HOUR,
  NOTIFICATION_MINUTE,
  DAYS_BEFORE_NOTIFICATIONS,
  HOURS_BEFORE_FINAL_NOTIFICATION,
  MIN_HOURS_TO_ENABLE_NOTIFICATION,
  DEBUG_NOTIFICATION_DELAY_SECONDS,
  ENABLE_DEBUG_NOTIFICATIONS,
  NOTIFICATION_STORAGE_KEY,
} from '@shared/constants/notification-config'

// ========================================
// TYPES
// ========================================

interface ScheduledNotification {
  id: string // Expo notification ID
  type: 'days_before' | 'hours_before' | 'debug'
  scheduledDate: Date
  daysBefore?: number
  hoursBefore?: number
}

interface EventNotificationMetadata {
  eventId: string
  eventTitle: string
  eventDate: string // ISO string
  scheduledNotifications: ScheduledNotification[]
  createdAt: string // ISO string
}

interface NotificationStorage {
  [eventId: string]: EventNotificationMetadata
}

// ========================================
// NOTIFICATION HANDLER CONFIGURATION
// ========================================

/**
 * Configure how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// ========================================
// PERMISSION MANAGEMENT
// ========================================

/**
 * Request notification permissions
 * @returns true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('[NotificationService] Permission not granted')
      return false
    }

    // Android: configure notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('event-reminders', {
        name: 'Lembretes de Eventos',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    return true
  } catch (error) {
    console.error('[NotificationService] Permission error:', error)
    return false
  }
}

// ========================================
// STORAGE HELPERS
// ========================================

async function loadNotificationStorage(): Promise<NotificationStorage> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('[NotificationService] Load storage error:', error)
    return {}
  }
}

async function saveNotificationStorage(storage: NotificationStorage): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(storage))
  } catch (error) {
    console.error('[NotificationService] Save storage error:', error)
  }
}

// ========================================
// NOTIFICATION CALCULATION
// ========================================

/**
 * Calculate valid notification dates for an event
 * Only returns notifications that haven't passed yet
 */
function calculateValidNotifications(event: Event): {
  type: 'days_before' | 'hours_before'
  scheduledDate: Date
  daysBefore?: number
  hoursBefore?: number
}[] {
  const notifications: {
    type: 'days_before' | 'hours_before'
    scheduledDate: Date
    daysBefore?: number
    hoursBefore?: number
  }[] = []

  // Parse event date and time
  const [year, month, day] = event.date.split('-').map(Number)
  const [hours, minutes] = event.time.split(':').map(Number)
  const eventDate = new Date(year, month - 1, day, hours, minutes)

  const now = new Date()

  // Calculate days before notifications (2 days, 1 day)
  for (const daysBefore of DAYS_BEFORE_NOTIFICATIONS) {
    const notificationDate = new Date(eventDate)
    notificationDate.setDate(notificationDate.getDate() - daysBefore)
    notificationDate.setHours(NOTIFICATION_HOUR, NOTIFICATION_MINUTE, 0, 0)

    if (notificationDate > now) {
      notifications.push({
        type: 'days_before',
        scheduledDate: notificationDate,
        daysBefore,
      })
    }
  }

  // Calculate hours before notification (3 hours)
  const hoursBeforeDate = new Date(eventDate)
  hoursBeforeDate.setHours(hoursBeforeDate.getHours() - HOURS_BEFORE_FINAL_NOTIFICATION)

  if (hoursBeforeDate > now) {
    notifications.push({
      type: 'hours_before',
      scheduledDate: hoursBeforeDate,
      hoursBefore: HOURS_BEFORE_FINAL_NOTIFICATION,
    })
  }

  return notifications
}

/**
 * Check if event is too close to enable notifications
 * @returns true if button should be shown, false if too close
 */
export function canEnableNotification(event: Event): boolean {
  const [year, month, day] = event.date.split('-').map(Number)
  const [hours, minutes] = event.time.split(':').map(Number)
  const eventDate = new Date(year, month - 1, day, hours, minutes)

  const now = new Date()
  const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  return hoursUntilEvent > MIN_HOURS_TO_ENABLE_NOTIFICATION
}

// ========================================
// CORE NOTIFICATION FUNCTIONS
// ========================================

/**
 * Schedule all valid notifications for an event
 * @returns { success: boolean, error?: string, scheduledCount: number }
 */
export async function scheduleEventNotifications(event: Event): Promise<{
  success: boolean
  error?: string
  scheduledCount: number
}> {
  try {
    // 1. Check permissions
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      return {
        success: false,
        error: 'Permissão de notificação negada. Habilite nas configurações.',
        scheduledCount: 0,
      }
    }

    // 2. Check if event is too close
    if (!canEnableNotification(event)) {
      return {
        success: false,
        error: 'Evento muito próximo. Não é possível ativar notificações.',
        scheduledCount: 0,
      }
    }

    // 3. Calculate valid notifications
    const validNotifications = calculateValidNotifications(event)

    if (validNotifications.length === 0) {
      return {
        success: false,
        error: 'Não há notificações válidas para agendar. Evento muito próximo.',
        scheduledCount: 0,
      }
    }

    // 4. Schedule each notification
    const scheduledNotifications: ScheduledNotification[] = []

    for (const notification of validNotifications) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Lembrete de Evento',
          body: `${event.title} - ${formatNotificationMessage(notification)}`,
          data: { eventId: event.id, type: notification.type },
          sound: true,
        },
        trigger: {
          date: notification.scheduledDate,
        },
      })

      scheduledNotifications.push({
        id: notificationId,
        type: notification.type,
        scheduledDate: notification.scheduledDate,
        daysBefore: notification.daysBefore,
        hoursBefore: notification.hoursBefore,
      })

      console.log(
        `[NotificationService] Scheduled ${notification.type} notification for ${event.title} at ${notification.scheduledDate.toISOString()}`
      )
    }

    // 5. 🚨 DEBUG ONLY - Schedule test notification
    // This notification uses the same format as production notifications for testing
    if (ENABLE_DEBUG_NOTIFICATIONS) {
      const debugDate = new Date(Date.now() + DEBUG_NOTIFICATION_DELAY_SECONDS * 1000)
      const debugNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Lembrete de Evento',
          body: `${event.title} - Teste em ${DEBUG_NOTIFICATION_DELAY_SECONDS} segundos (debug)`,
          data: { eventId: event.id, type: 'debug' },
          sound: true,
        },
        trigger: {
          date: debugDate,
        },
      })

      scheduledNotifications.push({
        id: debugNotificationId,
        type: 'debug',
        scheduledDate: debugDate,
      })

      console.log(
        `[NotificationService] 🚨 DEBUG: Scheduled test notification for ${event.title} in ${DEBUG_NOTIFICATION_DELAY_SECONDS} seconds`
      )
    }

    // 6. Save metadata to AsyncStorage
    const storage = await loadNotificationStorage()
    storage[event.id] = {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: `${event.date}T${event.time}`,
      scheduledNotifications,
      createdAt: new Date().toISOString(),
    }
    await saveNotificationStorage(storage)

    return {
      success: true,
      scheduledCount: validNotifications.length,
    }
  } catch (error) {
    console.error('[NotificationService] Schedule error:', error)
    return {
      success: false,
      error: 'Erro ao agendar notificações. Tente novamente.',
      scheduledCount: 0,
    }
  }
}

/**
 * Cancel all notifications for an event
 * @returns { success: boolean, error?: string }
 */
export async function cancelEventNotifications(eventId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // 1. Load metadata
    const storage = await loadNotificationStorage()
    const metadata = storage[eventId]

    if (!metadata) {
      console.warn(`[NotificationService] No notifications found for event ${eventId}`)
      return { success: true } // Not an error, just nothing to cancel
    }

    // 2. Cancel each notification
    for (const notification of metadata.scheduledNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.id)
      console.log(
        `[NotificationService] Cancelled ${notification.type} notification ${notification.id}`
      )
    }

    // 3. Remove from storage
    delete storage[eventId]
    await saveNotificationStorage(storage)

    return { success: true }
  } catch (error) {
    console.error('[NotificationService] Cancel error:', error)
    return {
      success: false,
      error: 'Erro ao cancelar notificações. Tente novamente.',
    }
  }
}

/**
 * Get count of events with notifications enabled
 */
export async function getNotifyingEventsCount(): Promise<number> {
  try {
    const storage = await loadNotificationStorage()
    return Object.keys(storage).length
  } catch (error) {
    console.error('[NotificationService] Count error:', error)
    return 0
  }
}

/**
 * Get all events with active notifications
 */
export async function getAllNotifyingEvents(): Promise<EventNotificationMetadata[]> {
  try {
    const storage = await loadNotificationStorage()
    return Object.values(storage)
  } catch (error) {
    console.error('[NotificationService] Get all error:', error)
    return []
  }
}

/**
 * Get notification metadata for a specific event
 */
export async function getEventNotificationMetadata(
  eventId: string
): Promise<EventNotificationMetadata | null> {
  try {
    const storage = await loadNotificationStorage()
    return storage[eventId] || null
  } catch (error) {
    console.error('[NotificationService] Get metadata error:', error)
    return null
  }
}

/**
 * Check if notifications limit has been reached
 */
export async function hasReachedNotificationLimit(): Promise<boolean> {
  const count = await getNotifyingEventsCount()
  return count >= MAX_NOTIFYING_EVENTS
}

/**
 * Clean up expired notifications
 * Should be called periodically (e.g., on app launch)
 */
export async function cleanupExpiredNotifications(): Promise<void> {
  try {
    const storage = await loadNotificationStorage()
    const now = new Date()

    for (const [eventId, metadata] of Object.entries(storage)) {
      const eventDate = new Date(metadata.eventDate)

      // If event has passed, remove notifications
      if (eventDate < now) {
        console.log(`[NotificationService] Cleaning expired notifications for ${eventId}`)
        await cancelEventNotifications(eventId)
      }
    }
  } catch (error) {
    console.error('[NotificationService] Cleanup error:', error)
  }
}

// ========================================
// HELPERS
// ========================================

function formatNotificationMessage(notification: {
  type: 'days_before' | 'hours_before'
  daysBefore?: number
  hoursBefore?: number
}): string {
  if (notification.type === 'days_before') {
    return notification.daysBefore === 1
      ? 'Acontecerá amanhã!'
      : `Acontecerá em ${notification.daysBefore} dias`
  } else {
    return `Acontecerá em ${notification.hoursBefore} horas`
  }
}
