import { useEffect } from 'react'
import { XStack, Text, Spinner } from 'tamagui'
import { MapPin, RefreshCw } from '@tamagui/lucide-icons'
import { useUserLocation } from '@shared/hooks/use-user-location'
import { useLocationStore } from '@shared/store/use-location-store'

const DEFAULT_CITY = 'Taquaritinga'

export function LocationBadge() {
  const { city, isLoading, error, detectLocation } = useUserLocation()
  const loadFromCache = useLocationStore((state) => state.loadFromCache)

  // Carrega cidade do cache ao montar
  useEffect(() => {
    loadFromCache()
  }, [loadFromCache])

  // Determina texto do badge
  const getBadgeText = () => {
    if (isLoading) return 'Localizando...'
    if (error) return error // "Loc não encontrada" ou "Offline"
    if (city) return city
    return DEFAULT_CITY
  }

  return (
    <XStack
      alignItems="center"
      gap="$1.5"
      paddingHorizontal="$2.5"
      paddingVertical="$1.5"
      borderRadius="$10"
      backgroundColor="transparent"
      borderWidth={1}
      borderColor="$color7"
      pressStyle={{ opacity: 0.7 }}
      onPress={detectLocation}
      disabled={isLoading}
      cursor={isLoading ? 'not-allowed' : 'pointer'}
    >
      {isLoading ? (
        <Spinner size="small" color="$color11" />
      ) : (
        <MapPin size={14} color="$color12" />
      )}
      <Text fontSize="$2" fontWeight="500" color="$color12">
        {getBadgeText()}
      </Text>
      <RefreshCw size={12} color="$color12" opacity={0.7} />
    </XStack>
  )
}
