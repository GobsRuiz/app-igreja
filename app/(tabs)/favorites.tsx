import React, { useState } from 'react'
import { YStack, Text } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Star } from '@tamagui/lucide-icons'
import { toast } from 'sonner-native'

import { useEventStore, selectFavoriteEvents } from '@shared/store'
import { EventCard } from '@/src/components/EventCard'
import { EventDetailModal } from '@/src/components/EventDetailModal'
import { MapService } from '@shared/services/map-service'
import { EmptyState } from '@shared/ui'
import type { Event } from '@shared/types'

export default function FavoritesPage() {
  const favoriteEvents = useEventStore(selectFavoriteEvents)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const handleDetailsPress = (event: Event) => {
    setSelectedEvent(event)
    setIsDetailModalOpen(true)
  }

  const handleGoPress = async (event: Event) => {
    if (!event.zipCode || !event.address) {
      toast.warning('Endereço não disponível para este evento')
      return
    }

    try {
      await MapService.openMapsWithAddress(event.zipCode, event.address, event.church)
    } catch (error) {
      toast.error('Não foi possível abrir o mapa')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <YStack padding="$4">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Favoritos
          </Text>
        </YStack>

        {/* Lista de Favoritos */}
        <YStack flex={1} paddingHorizontal="$4">
          {favoriteEvents.length === 0 ? (
            <EmptyState
              icon={<Star size={48} color="$foreground" />}
              message="Nenhum evento favorito"
              description="Adicione eventos aos favoritos para vê-los aqui"
            />
          ) : (
            <FlashList
              data={favoriteEvents}
              renderItem={({ item }) => (
                <EventCard
                  event={item}
                  onDetailsPress={() => handleDetailsPress(item)}
                  onGoPress={() => handleGoPress(item)}
                />
              )}
              keyExtractor={(item) => item.id}
              estimatedItemSize={200}
              showsVerticalScrollIndicator={false}
            />
          )}
        </YStack>

        {/* Modal */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={isDetailModalOpen && selectedEvent !== null}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedEvent(null)
          }}
        />
      </YStack>
    </SafeAreaView>
  )
}
