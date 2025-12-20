import { useState } from 'react'
import { YStack, XStack, Text, Separator } from 'tamagui'
import { BottomSheetModal, Button } from '@shared/ui'
import { Calendar, Clock, MapPin, User, Star, Bell, Map } from '@tamagui/lucide-icons'
import { Event } from '@shared/types/event'
import { Formatters } from '@shared/utils/formatters'
import { useEventStore } from '@shared/store/use-event-store'
import { MapService } from '@shared/services/map-service'
import { ToastService } from '@shared/services/toast-service'
import { canEnableNotification, hasReachedNotificationLimit } from '@shared/services/notification-service'
import { MAX_NOTIFYING_EVENTS } from '@shared/constants/notification-config'

interface EventDetailModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  const [isTogglingNotification, setIsTogglingNotification] = useState(false)

  const toggleFavorite = useEventStore((state) => state.toggleFavorite)
  const toggleNotification = useEventStore((state) => state.toggleNotification)

  // Busca o evento atualizado diretamente do allEvents para garantir reatividade
  const eventFromStore = useEventStore((state) =>
    event ? state.allEvents.find((e) => e.id === event.id) : undefined
  )
  const displayEvent = eventFromStore || event

  if (!displayEvent) return null

  // Check if notification button should be shown (event must be > 3h away)
  const showNotificationButton = canEnableNotification(displayEvent) || displayEvent.isNotifying
  // Check if favorite button should be shown (same logic as notification)
  const showFavoriteButton = canEnableNotification(displayEvent) || displayEvent.isFavorite

  const handleMapPress = async () => {
    if (!displayEvent.zipCode || !displayEvent.address) {
      ToastService.warning('Endereço não disponível')
      return
    }

    try {
      await MapService.openMapsWithAddress(
        displayEvent.zipCode,
        displayEvent.address,
        displayEvent.church
      )
    } catch {
      ToastService.error('Não foi possível abrir o mapa')
    }
  }

  const handleFavoritePress = () => {
    const wasFavorite = displayEvent.isFavorite
    toggleFavorite(displayEvent.id)
    ToastService.success(wasFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
  }

  const handleNotificationPress = async () => {
    const wasNotifying = displayEvent.isNotifying

    // If deactivating, just do it
    if (wasNotifying) {
      setIsTogglingNotification(true)
      await toggleNotification(displayEvent.id)
      setIsTogglingNotification(false)
      ToastService.success('Notificação desativada')
      return
    }

    // If activating, validate first

    // Check if event is too close (< 3h)
    if (!canEnableNotification(displayEvent)) {
      ToastService.error('Evento muito próximo. Não é possível ativar notificações.')
      return
    }

    // Check limit
    const limitReached = await hasReachedNotificationLimit()
    if (limitReached) {
      ToastService.error(
        `Limite atingido! Você já tem ${MAX_NOTIFYING_EVENTS} eventos com notificação ativada.`
      )
      return
    }

    // Activate notification
    setIsTogglingNotification(true)
    await toggleNotification(displayEvent.id)
    setIsTogglingNotification(false)
    ToastService.success('Notificação ativada')
  }

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={['50%', '90%']}
      initialSnapIndex={1}
      contentContainerProps={{ padding: '$4', gap: '$4' }}
      scrollContentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Cabeçalho: Categoria + Título + Descrição */}
      <YStack gap="$2">
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

        {/* Título */}
        <Text fontSize="$8" fontWeight="700" color="$color12">
          {displayEvent.title}
        </Text>

        {/* Descrição */}
        <Text fontSize="$4" color="$color11" lineHeight={22}>
          {displayEvent.description}
        </Text>
      </YStack>

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
        {showFavoriteButton && (
          <Button
            flex={1}
            variant={displayEvent.isFavorite ? 'primary' : 'outlined'}
            icon={
              <Star
                size={16}
                color={displayEvent.isFavorite ? '$color1' : '$color11'}
                fill={displayEvent.isFavorite ? '$color1' : 'transparent'}
              />
            }
            onPress={handleFavoritePress}
          >
            {displayEvent.isFavorite ? 'Favoritado' : 'Favoritar'}
          </Button>
        )}
        {showNotificationButton && (
          <Button
            flex={1}
            variant={displayEvent.isNotifying ? 'primary' : 'outlined'}
            icon={Bell}
            onPress={handleNotificationPress}
            disabled={isTogglingNotification}
            opacity={isTogglingNotification ? 0.5 : 1}
          >
            {displayEvent.isNotifying ? 'Notificará' : 'Notificar'}
          </Button>
        )}
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
            {displayEvent.address}
          </Text>
          <Text fontSize="$3" color="$color11">
            {displayEvent.city}, {displayEvent.state} - CEP {displayEvent.zipCode}
          </Text>
        </YStack>
      </YStack>

      {/* Regente - só exibe se tiver valor */}
      {displayEvent.conductor && (
        <>
          <Separator />
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
        </>
      )}

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
                {attachment.name || attachment}
              </Text>
            ))}
          </YStack>
        </>
      )}
    </BottomSheetModal>
  )
}
