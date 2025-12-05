import { useState, useCallback } from 'react'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import { useLocationStore } from '@shared/store/use-location-store'
import { useConnectivityStore, selectIsConnected } from '@shared/store/use-connectivity-store'

// ========================================
// CONSTANTS
// ========================================

const CACHE_MAX_AGE = 60 * 60 * 1000 // 1 hour in milliseconds
const LOCATION_TIMEOUT = 30000 // 30 seconds

// ========================================
// TYPES
// ========================================

interface UseUserLocationReturn {
  city: string | null
  isLoading: boolean
  error: string | null
  detectLocation: (forceNew?: boolean) => Promise<void>
  clearError: () => void
}

// ========================================
// HOOK
// ========================================

/**
 * Hook para detectar localização do usuário
 *
 * Estratégia:
 * 1. Tenta usar cache do sistema (< 1 hora) - instantâneo
 * 2. Se cache antigo ou inexistente, pega nova localização
 * 3. Usa precisão máxima
 * 4. Timeout de 30s
 * 5. Tratamento offline: usa cache se disponível
 *
 * @returns {UseUserLocationReturn} Estado e funções de controle
 */
export function useUserLocation(): UseUserLocationReturn {
  const city = useLocationStore((state) => state.city)
  const isLoading = useLocationStore((state) => state.isLoading)
  const error = useLocationStore((state) => state.error)
  const setCity = useLocationStore((state) => state.setCity)
  const setLoading = useLocationStore((state) => state.setLoading)
  const setError = useLocationStore((state) => state.setError)
  const clearError = useLocationStore((state) => state.clearError)
  const lastUpdated = useLocationStore((state) => state.lastUpdated)

  const isConnected = useConnectivityStore(selectIsConnected)

  /**
   * Verifica se cache é recente (< 1 hora)
   */
  const isCacheRecent = useCallback(() => {
    if (!lastUpdated) return false
    const age = Date.now() - lastUpdated
    return age < CACHE_MAX_AGE
  }, [lastUpdated])

  /**
   * Obtém cidade a partir de coordenadas (reverse geocoding)
   */
  const getCityFromCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<string | null> => {
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        })

        if (!geocode) {
          console.warn('[useUserLocation] No geocode result')
          return null
        }

        // Prioridade: city > subregion > region
        const city = geocode.city || geocode.subregion || geocode.region

        if (!city) {
          console.warn('[useUserLocation] No city found in geocode:', geocode)
          return null
        }

        return city
      } catch (error) {
        console.error('[useUserLocation] Reverse geocoding error:', error)
        return null
      }
    },
    []
  )

  /**
   * Detecta localização do usuário
   * @param forceNew - Se true, pula cache do sistema e força busca GPS nova
   */
  const detectLocation = useCallback(async (forceNew: boolean = false) => {
    try {
      // Haptic feedback ao iniciar
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      setLoading(true)
      clearError()

      // 1. Verifica permissões
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setError('Permissão de localização negada')
        return
      }

      // 2. Se offline, tenta usar cache
      if (!isConnected) {
        if (city && isCacheRecent()) {
          console.log('[useUserLocation] Offline - using cached location')
          setLoading(false)
          return
        }

        setError('Offline')
        return
      }

      // 3. Tenta última posição conhecida (cache do sistema) - apenas se não forçar nova
      if (!forceNew) {
        console.log('[useUserLocation] Trying last known position...')
        const lastKnown = await Location.getLastKnownPositionAsync()

        if (lastKnown) {
          const { timestamp } = lastKnown
          const age = Date.now() - timestamp

          // Se última posição é recente (< 1 hora), usa ela
          if (age < CACHE_MAX_AGE) {
            console.log('[useUserLocation] Using last known position (age: ' + Math.floor(age / 60000) + 'min)')

            const detectedCity = await getCityFromCoordinates(
              lastKnown.coords.latitude,
              lastKnown.coords.longitude
            )

            if (detectedCity) {
              setCity(detectedCity)
              setLoading(false)
              // Haptic feedback de sucesso
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              return
            }
          }
        }
      } else {
        console.log('[useUserLocation] Forcing new position (skipping cache)...')
      }

      // 4. Cache antigo/inexistente ou forceNew - pega nova localização
      console.log('[useUserLocation] Getting new position with maximum accuracy...')

      // Timeout de 30s
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), LOCATION_TIMEOUT)
      })

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, // Precisão máxima
      })

      const position = await Promise.race([locationPromise, timeoutPromise])

      const detectedCity = await getCityFromCoordinates(
        position.coords.latitude,
        position.coords.longitude
      )

      if (detectedCity) {
        setCity(detectedCity)
        // Haptic feedback de sucesso
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        setError('Loc não encontrada')
        // Haptic feedback de erro
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }

      setLoading(false)
    } catch (error: any) {
      console.error('[useUserLocation] Error detecting location:', error)

      // Trata timeout
      if (error.message === 'Location timeout') {
        setError('Loc não encontrada')
        // Haptic feedback de erro
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      // Trata outros erros
      setError('Loc não encontrada')
      // Haptic feedback de erro
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [
    city,
    isConnected,
    isCacheRecent,
    setCity,
    setLoading,
    setError,
    clearError,
    getCityFromCoordinates,
  ])

  return {
    city,
    isLoading,
    error,
    detectLocation,
    clearError,
  }
}
