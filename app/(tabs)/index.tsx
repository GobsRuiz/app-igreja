import React, { useState, useEffect } from 'react'
import { YStack, XStack, Text, Spinner } from 'tamagui'
import { Button } from '@shared/ui'
import { FlashList } from '@shopify/flash-list'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SlidersHorizontal, Calendar } from '@tamagui/lucide-icons'
import { toast } from 'sonner-native'

import { useEventStore, selectFilteredEvents } from '@shared/store'
import { EventCard } from '@/src/components/EventCard'
import { EventDetailModal } from '@/src/components/EventDetailModal'
import { FilterModal } from '@/src/components/FilterModal'
import { CategoryFilterSlider } from '@/src/components/CategoryFilterSlider'
import { LocationBadge } from '@/src/components/LocationBadge'
import { ConnectionBadge } from '@/src/components/ConnectionBadge'
import { MapService } from '@shared/services/map-service'
import type { Event } from '@shared/types'

export default function HomePage() {
  const filteredEvents = useEventStore(selectFilteredEvents)
  const isLoading = useEventStore((state) => state.isLoading)
  const initializeFirestoreListener = useEventStore((state) => state.initializeFirestoreListener)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Initialize Firestore real-time listener
  useEffect(() => {
    const unsubscribe = initializeFirestoreListener()

    // Cleanup listener on unmount
    return () => {
      console.log('[HomePage] Cleaning up Firestore listener')
      unsubscribe()
    }
  }, [initializeFirestoreListener])

  const handleDetailsPress = (event: Event) => {
    setSelectedEvent(event)
    setIsDetailModalOpen(true)
  }

  const handleGoPress = async (event: Event) => {
    if (!event.latitude || !event.longitude) {
      toast.warning('Localização não disponível para este evento')
      return
    }

    try {
      await MapService.openGoogleMaps(event.latitude, event.longitude, event.church)
    } catch (error) {
      toast.error('Não foi possível abrir o mapa')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {/* TopBar - sem shadow */}
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <XStack gap="$2" alignItems="center">
            <LocationBadge />
            <ConnectionBadge />
          </XStack>
          <Button
            size="$3"
            variant="outlined"
            icon={<SlidersHorizontal size={18} />}
            onPress={() => setIsFilterModalOpen(true)}
          >
            Filtros
          </Button>
        </XStack>

        {/* Category Filter Slider */}
        <CategoryFilterSlider />

        {/* Lista de Eventos */}
        <YStack flex={1}>
          {isLoading ? (
            <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
              <Spinner size="large" color="$color11" />
              <Text fontSize="$4" color="$color11">
                Carregando eventos...
              </Text>
            </YStack>
          ) : filteredEvents.length === 0 ? (
            <YStack flex={1} justifyContent="center" alignItems="center" gap="$3" padding="$4">
              <Calendar size={48} color="$color11" />
              <Text fontSize="$5" color="$color11" textAlign="center">
                Nenhum evento encontrado
              </Text>
              <Text fontSize="$3" color="$color11" textAlign="center">
                Tente ajustar os filtros
              </Text>
            </YStack>
          ) : (
            <FlashList
              data={filteredEvents}
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
              contentContainerStyle={{ padding: 16 }}
            />
          )}
        </YStack>

        {/* Modal de Detalhes */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={isDetailModalOpen && selectedEvent !== null}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedEvent(null)
          }}
        />

        {/* Modal de Filtros */}
        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
        />
      </YStack>
    </SafeAreaView>
  )
}
