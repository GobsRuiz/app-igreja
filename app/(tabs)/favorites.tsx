import { FlashList } from '@shopify/flash-list'
import { MapPin, Star } from '@tamagui/lucide-icons'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text, XStack, YStack } from 'tamagui'

import { AddFavoriteCityModal } from '@/src/components/AddFavoriteCityModal'
import { EventCard } from '@/src/components/EventCard'
import { EventDetailModal } from '@/src/components/EventDetailModal'
import { FavoriteCitiesList } from '@/src/components/FavoriteCitiesList'
import { MapService } from '@shared/services/map-service'
import { selectFavoriteEvents, useEventStore, useFavoriteCitiesStore } from '@shared/store'
import type { Event } from '@shared/types'
import { EmptyState, toast } from '@shared/ui'

type TabValue = 'events' | 'cities'

export default function FavoritesPage() {
  const favoriteEvents = useEventStore(selectFavoriteEvents)
  const loadFavoriteCities = useFavoriteCitiesStore((state) => state.loadFromCache)

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>('events')

  // Carregar favoritos de cidades do cache
  useEffect(() => {
    loadFavoriteCities()
  }, [])

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
        <YStack padding="$4" paddingBottom="$2">
          <Text fontSize="$8" fontWeight="700" color="$foreground">
            Favoritos
          </Text>
        </YStack>

        {/* Custom Tabs */}
        <XStack
          paddingHorizontal="$4"
          paddingBottom="$3"
          gap="$2"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Button
            flex={1}
            size="$3"
            variant={activeTab === 'events' ? 'outlined' : 'text'}
            onPress={() => setActiveTab('events')}
            backgroundColor={activeTab === 'events' ? '$color3' : 'transparent'}
            borderColor={activeTab === 'events' ? '$borderColor' : 'transparent'}
            icon={<Star size={16} />}
          >
            Eventos
          </Button>
          <Button
            flex={1}
            size="$3"
            variant={activeTab === 'cities' ? 'outlined' : 'text'}
            onPress={() => setActiveTab('cities')}
            backgroundColor={activeTab === 'cities' ? '$color3' : 'transparent'}
            borderColor={activeTab === 'cities' ? '$borderColor' : 'transparent'}
            icon={<MapPin size={16} />}
          >
            Cidades
          </Button>
        </XStack>

        {/* Tab Content */}
        <YStack flex={1} paddingHorizontal="$4" paddingTop="$3">
          {activeTab === 'events' ? (
            // Tab Eventos
            favoriteEvents.length === 0 ? (
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
            )
          ) : (
            // Tab Cidades
            <FavoriteCitiesList onOpenAddModal={() => setIsAddCityModalOpen(true)} />
          )}
        </YStack>

        {/* Modals - renderizados fora do conteúdo para z-index correto */}
        <EventDetailModal
          event={selectedEvent}
          isOpen={isDetailModalOpen && selectedEvent !== null}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedEvent(null)
          }}
        />

        <AddFavoriteCityModal
          isOpen={isAddCityModalOpen}
          onClose={() => setIsAddCityModalOpen(false)}
        />
      </YStack>
    </SafeAreaView>
  )
}
