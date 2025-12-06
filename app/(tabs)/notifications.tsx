import React, { useEffect, useState } from 'react'
import { YStack, XStack, Text, Spinner, Separator } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell, BellOff, Calendar, Clock } from '@tamagui/lucide-icons'
import { EmptyState, Button, Card } from '@shared/ui'
import { ScrollView } from 'react-native'
import { getAllNotifyingEvents } from '@shared/services/notification-service'
import { useEventStore } from '@shared/store/use-event-store'
import { ToastService } from '@shared/services/toast-service'
import { Formatters } from '@shared/utils/formatters'
import type { Event } from '@shared/types'

interface EventNotificationMetadata {
  eventId: string
  eventTitle: string
  eventDate: string
  scheduledNotifications: Array<{
    id: string
    type: 'days_before' | 'hours_before' | 'debug'
    scheduledDate: Date
    daysBefore?: number
    hoursBefore?: number
  }>
  createdAt: string
}

export default function NotificationsPage() {
  const [notifyingEvents, setNotifyingEvents] = useState<EventNotificationMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const toggleNotification = useEventStore((state) => state.toggleNotification)
  const allEvents = useEventStore((state) => state.allEvents)

  const loadNotifications = async () => {
    setLoading(true)
    const events = await getAllNotifyingEvents()
    setNotifyingEvents(events)
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Reload when events change
  useEffect(() => {
    loadNotifications()
  }, [allEvents])

  const handleRemoveNotification = async (eventId: string) => {
    await toggleNotification(eventId)
    ToastService.success('Notificação removida')
    await loadNotifications()
  }

  const formatNotificationTime = (notification: EventNotificationMetadata['scheduledNotifications'][0]) => {
    if (notification.type === 'debug') {
      return '🚨 DEBUG - 65s após ativar'
    }
    if (notification.type === 'days_before') {
      return notification.daysBefore === 1 ? '1 dia antes às 08h' : `${notification.daysBefore} dias antes às 08h`
    }
    return `${notification.hoursBefore}h antes do evento`
  }

  const getEventDetails = (eventId: string): Event | undefined => {
    return allEvents.find((e) => e.id === eventId)
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
          <Spinner size="large" color="$color11" />
        </YStack>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$8" fontWeight="700" color="$foreground" marginBottom="$4">
          Notificações Ativas
        </Text>

        {notifyingEvents.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} color="$foreground" />}
            message="Nenhuma notificação ativa"
            description="Ative notificações nos eventos para receber lembretes"
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {notifyingEvents.map((notification) => {
                const eventDetails = getEventDetails(notification.eventId)
                return (
                  <Card key={notification.eventId} padding="$4">
                    <YStack gap="$3">
                      {/* Event Info */}
                      <YStack gap="$2">
                        <Text fontSize="$6" fontWeight="700" color="$color12">
                          {notification.eventTitle}
                        </Text>
                        {eventDetails && (
                          <XStack gap="$2" alignItems="center">
                            <Calendar size={16} color="$color11" />
                            <Text fontSize="$3" color="$color11">
                              {Formatters.formatDateFull(eventDetails.date)}
                            </Text>
                            <Clock size={16} color="$color11" />
                            <Text fontSize="$3" color="$color11">
                              {eventDetails.time}
                            </Text>
                          </XStack>
                        )}
                      </YStack>

                      <Separator />

                      {/* Scheduled Notifications */}
                      <YStack gap="$2">
                        <Text fontSize="$3" fontWeight="600" color="$color11">
                          Lembretes agendados:
                        </Text>
                        {notification.scheduledNotifications
                          .filter((n) => n.type !== 'debug')
                          .map((n, index) => (
                            <XStack key={index} gap="$2" alignItems="center" paddingLeft="$3">
                              <Bell size={14} color="$color10" />
                              <Text fontSize="$3" color="$color11">
                                {formatNotificationTime(n)}
                              </Text>
                            </XStack>
                          ))}
                      </YStack>

                      {/* Remove Button */}
                      <Button
                        variant="outlined"
                        icon={BellOff}
                        onPress={() => handleRemoveNotification(notification.eventId)}
                        size="$3"
                      >
                        Desativar Notificações
                      </Button>
                    </YStack>
                  </Card>
                )
              })}
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  )
}
