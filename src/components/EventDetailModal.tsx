import { useEffect, useMemo, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { YStack, XStack, Text, Button, Separator } from 'tamagui'
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

  if (!event) return null

  const handleMapPress = async () => {
    if (!event.latitude || !event.longitude) {
      ToastService.warning('Localização não disponível')
      return
    }

    try {
      await MapService.openGoogleMaps(event.latitude, event.longitude, event.church)
    } catch {
      ToastService.error('Não foi possível abrir o mapa')
    }
  }

  const handleFavoritePress = () => {
    const wasFavorite = event.isFavorite
    toggleFavorite(event.id)
    ToastService.success(
      wasFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos'
    )
  }

  const handleNotificationPress = () => {
    const wasNotifying = event.isNotifying
    toggleNotification(event.id)
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
            {event.title}
          </Text>

          {/* Badge do Tipo */}
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
              {event.eventType}
            </Text>
          </XStack>

          {/* Botões de Ação */}
          <XStack gap="$2">
            <Button
              flex={1}
              size="$3"
              icon={<Map size={16} color="$color1" />}
              backgroundColor="$color12"
              color="$color1"
              onPress={handleMapPress}
            >
              Mapa
            </Button>
            <Button
              flex={1}
              size="$3"
              icon={<Star size={16} color={event.isFavorite ? '$color12' : '$color11'} fill={event.isFavorite ? '$color12' : 'transparent'} />}
              variant="outlined"
              onPress={handleFavoritePress}
            >
              Favoritar
            </Button>
            <Button
              flex={1}
              size="$3"
              icon={<Bell size={16} color={event.isNotifying ? '$color12' : '$color11'} fill={event.isNotifying ? '$color12' : 'transparent'} />}
              variant="outlined"
              onPress={handleNotificationPress}
            >
              Notificar
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
                {Formatters.formatDateFull(event.date)}
              </Text>
              <XStack gap="$2" alignItems="center">
                <Clock size={16} color="$color11" />
                <Text fontSize="$3" color="$color11">
                  {event.time}
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
                {event.church}
              </Text>
              <Text fontSize="$3" color="$color11">
                {event.address}, {event.city}
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
              {event.conductor}
            </Text>
          </YStack>

          <Separator />

          {/* Descrição */}
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Descrição
            </Text>
            <Text fontSize="$3" color="$color11" lineHeight={22}>
              {event.description}
            </Text>
          </YStack>

          {/* Anexos */}
          {event.attachments.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Anexos
                </Text>
                {event.attachments.map((attachment, index) => (
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
