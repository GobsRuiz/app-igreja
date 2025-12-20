import { useEffect, useRef, useState, useCallback } from 'react'
import { XStack, Text, Spinner } from 'tamagui'
import { MapPin, RefreshCw } from '@tamagui/lucide-icons'
import { useUserLocation } from '@shared/hooks/use-user-location'
import { useLocationStore } from '@shared/store/use-location-store'
import { LocationModal } from './LocationModal'

const DEFAULT_TEXT = 'Selecione cidade'

export function LocationBadge() {
  const { city, isLoading, error, detectLocation, setManualLocation } = useUserLocation()
  const state = useLocationStore((s) => s.state)
  const loadFromCache = useLocationStore((s) => s.loadFromCache)

  const hasAttemptedAutoDetect = useRef(false)
  const detectLocationRef = useRef(detectLocation)
  const [showModal, setShowModal] = useState(false)
  const [cacheLoaded, setCacheLoaded] = useState(false)
  const prevCityRef = useRef(city)

  // Mantém ref de detectLocation atualizada
  useEffect(() => {
    detectLocationRef.current = detectLocation
  }, [detectLocation])

  // 1. Carrega cache ao montar e sinaliza quando completa
  useEffect(() => {
    loadFromCache()
      .then(() => setCacheLoaded(true))
      .catch(() => {
        setCacheLoaded(true) // Marca como carregado mesmo com erro
      })
  }, [loadFromCache])

  // 2. Auto-detect APENAS após cache carregar E se não tem cidade
  useEffect(() => {
    if (cacheLoaded && !city && !hasAttemptedAutoDetect.current) {
      hasAttemptedAutoDetect.current = true
      detectLocationRef.current()
    }
  }, [cacheLoaded, city])

  // 3. Fecha modal automaticamente quando city muda com sucesso
  useEffect(() => {
    if (city && city !== prevCityRef.current && showModal) {
      setShowModal(false)
    }
    prevCityRef.current = city
  }, [city, showModal])

  // Determina texto do badge
  const getBadgeText = () => {
    if (isLoading) return 'Localizando...'
    if (error) return error // Mensagens específicas: "GPS desligado", "Permissão negada", etc
    if (city) {
      return state ? `${city} - ${state}` : city
    }
    return DEFAULT_TEXT
  }

  // Click no badge: abre modal OU re-tenta GPS
  const handleClick = useCallback(() => {
    // Guard: não fazer nada se já estiver detectando
    if (isLoading) return

    // Se já tem localização, apenas força novo GPS
    if (city) {
      detectLocation(true)
      return
    }

    // Se não tem localização, abre modal
    setShowModal(true)
  }, [isLoading, city, detectLocation])

  // Handler para auto-detect do modal
  const handleAutoDetect = useCallback(() => {
    // Guard: não detectar se já estiver em andamento
    if (isLoading) return
    detectLocation(true) // Force new
  }, [isLoading, detectLocation])

  // Handler para seleção manual do modal
  const handleManualSelect = useCallback(
    (selectedCity: string, selectedState: string) => {
      setManualLocation(selectedCity, selectedState)
      setShowModal(false)
    },
    [setManualLocation]
  )

  return (
    <>
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
        onPress={handleClick}
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

      {/* Modal de seleção de localização */}
      <LocationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAutoDetect={handleAutoDetect}
        onManualSelect={handleManualSelect}
        isDetecting={isLoading}
      />
    </>
  )
}
