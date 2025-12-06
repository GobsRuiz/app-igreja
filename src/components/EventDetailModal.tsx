import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { YStack, XStack, Text, Separator } from 'tamagui'
import { Button } from '@shared/ui'
import { Calendar, Clock, MapPin, User, Star, Bell, Map } from '@tamagui/lucide-icons'
import { Event } from '@shared/types/event'
import { Formatters } from '@shared/utils/formatters'
import { useEventStore } from '@shared/store/use-event-store'
import { MapService } from '@shared/services/map-service'
import { ToastService } from '@shared/services/toast-service'

interface EventDetailModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = useMemo(() => ['50%', '90%', '95%'], [])

  const toggleFavorite = useEventStore((state) => state.toggleFavorite)
  const toggleNotification = useEventStore((state) => state.toggleNotification)

  // Busca o evento atualizado diretamente do allEvents para garantir reatividade
  const eventFromStore = useEventStore((state) =>
    event ? state.allEvents.find(e => e.id === event.id) : undefined
  )
  const displayEvent = eventFromStore || event

  useEffect(() => {
    if (isOpen && event) {
      bottomSheetRef.current?.present()
      // Abre em 90%
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1)
      }, 100)
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isOpen, event])

  if (!displayEvent) return null

  const handleMapPress = async () => {
    if (!displayEvent.latitude || !displayEvent.longitude) {
      ToastService.warning('Localização não disponível')
      return
    }

    try {
      await MapService.openGoogleMaps(displayEvent.latitude, displayEvent.longitude, displayEvent.church)
    } catch {
      ToastService.error('Não foi possível abrir o mapa')
    }
  }

  const handleFavoritePress = () => {
    const wasFavorite = displayEvent.isFavorite
    toggleFavorite(displayEvent.id)
    ToastService.success(
      wasFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos'
    )
  }

  const handleNotificationPress = () => {
    const wasNotifying = displayEvent.isNotifying
    toggleNotification(displayEvent.id)
    ToastService.success(
      wasNotifying ? 'Notificação desativada' : 'Notificação ativada'
    )
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        <YStack padding="$4" gap="$4">
          {/* Título */}
          <Text fontSize="$8" fontWeight="700" color="$color12">
            {displayEvent.title}
          </Text>

          {/* Badge do Tipo */}
          {displayEvent.categoryName && (
            <XStack>
              <Text
                fontSize="$2"
                fontWeight="600"
                color="$color11"
                backgroundColor="$color3"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
              >
                {displayEvent.categoryName}
              </Text>
            </XStack>
          )}

          {/* Botões de Ação */}
          <XStack gap="$2">
            <Button
              flex={1}
              variant="primary"
              icon={<Map size={16} color="$color1" />}
              onPress={handleMapPress}
            >
              Mapa
            </Button>
            <Button
              flex={1}
              variant={displayEvent.isFavorite ? 'primary' : 'outlined'}
              icon={<Star size={16} color={displayEvent.isFavorite ? '$color1' : '$color11'} fill={displayEvent.isFavorite ? '$color1' : 'transparent'} />}
              onPress={handleFavoritePress}
            >
              {displayEvent.isFavorite ? 'Favoritado' : 'Favoritar'}
            </Button>
            <Button
              flex={1}
              variant={displayEvent.isNotifying ? 'primary' : 'outlined'}
              icon={<Bell size={16} color={displayEvent.isNotifying ? '$color1' : '$color11'} fill={displayEvent.isNotifying ? '$color1' : 'transparent'} />}
              onPress={handleNotificationPress}
            >
              {displayEvent.isNotifying ? 'Notificará' : 'Notificar'}
            </Button>
          </XStack>

          <Separator />

          {/* Data e Hora */}
          <YStack gap="$2">
            <XStack gap="$2" alignItems="center">
              <Calendar size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Data e Hora
              </Text>
            </XStack>
            <YStack paddingLeft="$7" gap="$1">
              <Text fontSize="$4" color="$color12">
                {Formatters.formatDateFull(displayEvent.date)}
              </Text>
              <XStack gap="$2" alignItems="center">
                <Clock size={16} color="$color11" />
                <Text fontSize="$3" color="$color11">
                  {displayEvent.time}
                </Text>
              </XStack>
            </YStack>
          </YStack>

          <Separator />

          {/* Local */}
          <YStack gap="$2">
            <XStack gap="$2" alignItems="center">
              <MapPin size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Local
              </Text>
            </XStack>
            <YStack paddingLeft="$7" gap="$1">
              <Text fontSize="$4" color="$color12">
                {displayEvent.church}
              </Text>
              <Text fontSize="$3" color="$color11">
                {displayEvent.address}, {displayEvent.city}
              </Text>
            </YStack>
          </YStack>

          <Separator />

          {/* Regente */}
          <YStack gap="$2">
            <XStack gap="$2" alignItems="center">
              <User size={20} color="$color11" />
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Regente
              </Text>
            </XStack>
            <Text fontSize="$4" color="$color12" paddingLeft="$7">
              {displayEvent.conductor}
            </Text>
          </YStack>

          <Separator />

          {/* Descrição */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Descrição
            </Text>
            <Text fontSize="$3" color="$color11" lineHeight={22}>
              {displayEvent.description}
            </Text>
          </YStack>

          {/* Anexos */}
          {displayEvent.attachments.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Anexos
                </Text>
                {displayEvent.attachments.map((attachment, index) => (
                  <Text key={index} fontSize="$3" color="$color11">
                    {attachment}
                  </Text>
                ))}
              </YStack>
            </>
          )}
        </YStack>
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 40,
  },
})
