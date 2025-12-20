import type { Event } from '@shared/types'
import { differenceInMinutes, isPast, parseISO } from 'date-fns'

/**
 * Event status type (matches Firebase)
 */
export type EventStatus = 'active' | 'finished' | 'cancelled'

/**
 * Get minutes until event starts
 * @returns Positive number if event is in the future, negative if past
 */
export function getMinutesUntilEvent(event: Event): number {
  try {
    // Combine date and time strings into ISO format
    const eventDateTime = parseISO(`${event.date}T${event.time}`)
    const now = new Date()
    return differenceInMinutes(eventDateTime, now)
  } catch (error) {
    return 0
  }
}

/**
 * Check if event has already passed
 */
export function isEventPast(event: Event): boolean {
  try {
    const eventDateTime = parseISO(`${event.date}T${event.time}`)
    return isPast(eventDateTime)
  } catch (error) {
    return false
  }
}

/**
 * Determine if event should be shown in Home/Search screens
 * Shows only 'active' events
 *
 * Cloud Function is responsible for marking events as 'finished' when <= 10 minutes away.
 * Client only checks status - no time-based filtering to avoid dependency on device clock.
 */
export function shouldShowInHome(event: Event & { status?: EventStatus }): boolean {
  // Only show active events - Cloud Function manages the status transitions
  return event.status === 'active' || !event.status
}

/**
 * Check if event is close to starting (<= 10 minutes)
 * Used for UI feedback and conditional logic
 */
export function isEventClosing(event: Event): boolean {
  const minutesUntil = getMinutesUntilEvent(event)
  return minutesUntil <= 10 && minutesUntil > 0
}
