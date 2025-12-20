import { useState, useCallback, useRef, useEffect } from 'react'
import { Platform, Linking, Alert } from 'react-native'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import { useLocationStore } from '@shared/store/use-location-store'
import type { LocationErrorType } from '@shared/store/use-location-store'
import { useConnectivityStore, selectIsConnected } from '@shared/store/use-connectivity-store'
import { getStateByCity } from '@features/geo'

// ========================================
// CONSTANTS
// ========================================

const CACHE_MAX_AGE = 60 * 60 * 1000 // 1 hour in milliseconds

// Accuracy hierarchy for fallback strategy
const ACCURACY_LEVELS = [
  Location.Accuracy.Highest, // GPS required
  Location.Accuracy.High, // GPS preferred
  Location.Accuracy.Balanced, // Network + GPS
  Location.Accuracy.Low, // Network only
] as const

// Progressive timeout by accuracy level (total max: 75s instead of 120s)
const TIMEOUT_BY_ACCURACY: Record<number, number> = {
  [Location.Accuracy.Highest]: 30000, // 30s - GPS puro precisa mais tempo
  [Location.Accuracy.High]: 20000, // 20s
  [Location.Accuracy.Balanced]: 15000, // 15s - Network + GPS é mais rápido
  [Location.Accuracy.Low]: 10000, // 10s - Network-only é rápido
}

// ========================================
// TYPES
// ========================================

interface UseUserLocationReturn {
  city: string | null
  isLoading: boolean
  error: string | null
  detectLocation: (forceNew?: boolean) => Promise<void>
  setManualLocation: (city: string, state: string) => void
  clearError: () => void
}

// ========================================
// HELPERS
// ========================================

/**
 * Checks if error is related to device settings (GPS disabled)
 */
function isSettingsError(error: any): boolean {
  const message = error?.message?.toLowerCase() || ''
  return (
    message.includes('unsatisfied device settings') ||
    message.includes('location settings') || // Mais específico que só "settings"
    message.includes('location services disabled') ||
    message.includes('location is not enabled')
  )
}

/**
 * Checks if error is permission-related
 */
function isPermissionError(error: any): boolean {
  const message = error?.message?.toLowerCase() || ''
  return message.includes('permission')
}

/**
 * Opens device location settings (Android only)
 */
async function openLocationSettings() {
  if (Platform.OS === 'android') {
    try {
      await Linking.openSettings()
    } catch (error) {
      // Failed to open settings
    }
  }
}

/**
 * Try to get position with fallback accuracy levels
 * Returns null if all attempts fail
 */
async function getCurrentPositionWithFallback(): Promise<Location.LocationObject | null> {
  for (const accuracy of ACCURACY_LEVELS) {
    try {
      const timeout = TIMEOUT_BY_ACCURACY[accuracy] || 15000

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), timeout)
      })

      const locationPromise = Location.getCurrentPositionAsync({ accuracy })
      const position = await Promise.race([locationPromise, timeoutPromise])

      return position
    } catch (error: any) {
      // If settings error, no point trying lower accuracy
      if (isSettingsError(error)) {
        throw error
      }

      // Continue to next accuracy level
      continue
    }
  }

  return null
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
 * 3. Fallback de accuracy: Highest → High → Balanced → Low
 * 4. Timeout progressivo (30s → 20s → 15s → 10s, total 75s max)
 * 5. Tratamento específico de erros: GPS, permissão, offline
 *
 * @returns {UseUserLocationReturn} Estado e funções de controle
 */
export function useUserLocation(): UseUserLocationReturn {
  const city = useLocationStore((state) => state.city)
  const isLoading = useLocationStore((state) => state.isLoading)
  const error = useLocationStore((state) => state.error)
  const setLocation = useLocationStore((state) => state.setLocation)
  const setLoading = useLocationStore((state) => state.setLoading)
  const setError = useLocationStore((state) => state.setError)
  const setPermissionStatus = useLocationStore((state) => state.setPermissionStatus)
  const clearError = useLocationStore((state) => state.clearError)
  const lastUpdated = useLocationStore((state) => state.lastUpdated)

  const isConnected = useConnectivityStore(selectIsConnected)

  // Ref para city - permite usar valor atual sem causar re-render de detectLocation
  const cityRef = useRef(city)

  // Atualiza ref quando city muda
  useEffect(() => {
    cityRef.current = city
  }, [city])

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
          return null
        }

        // Prioridade: city > subregion > region
        const city = geocode.city || geocode.subregion || geocode.region

        if (!city) {
          return null
        }

        return city
      } catch (error) {
        return null
      }
    },
    []
  )

  /**
   * Detecta localização do usuário
   * @param forceNew - Se true, pula cache do sistema e força busca GPS nova
   */
  const detectLocation = useCallback(
    async (forceNew: boolean = false) => {
      try {
        // Haptic feedback ao iniciar
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

        setLoading(true)
        clearError()

        // 1. Verifica permissões
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== 'granted') {
          setError('Permissão negada', 'permissionDenied')
          setPermissionStatus('denied')
          setLoading(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          return
        }

        setPermissionStatus('granted')

        // 2. Se offline, tenta usar cache
        if (!isConnected) {
          if (cityRef.current && isCacheRecent()) {
            setLoading(false)
            return
          }

          setError('Offline', 'offline')
          setLoading(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          return
        }

        // 3. Tenta última posição conhecida (cache do sistema) - apenas se não forçar nova
        if (!forceNew) {
          const lastKnown = await Location.getLastKnownPositionAsync()

          if (lastKnown) {
            const { timestamp } = lastKnown
            const age = Date.now() - timestamp

            // Se última posição é recente (< 1 hora), usa ela
            if (age < CACHE_MAX_AGE) {
              const detectedCity = await getCityFromCoordinates(
                lastKnown.coords.latitude,
                lastKnown.coords.longitude
              )

              if (detectedCity) {
                // Busca qual estado pertence essa cidade
                const { state: detectedState } = await getStateByCity(detectedCity)

                if (detectedState) {
                  setLocation(detectedCity, detectedState)
                } else {
                  // Fallback: salva só cidade se não encontrar estado
                  setLocation(detectedCity, 'SP') // Default SP
                }

                setLoading(false)
                // Haptic feedback de sucesso
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                return
              }
            }
          }
        }

        // 4. Get new position with fallback accuracy
        const position = await getCurrentPositionWithFallback()

        if (!position) {
          setError('Loc não encontrada', 'notFound')
          setLoading(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          return
        }

        const detectedCity = await getCityFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        )

        if (detectedCity) {
          // Busca qual estado pertence essa cidade
          const { state: detectedState } = await getStateByCity(detectedCity)

          if (detectedState) {
            setLocation(detectedCity, detectedState)
          } else {
            // Fallback: salva só cidade se não encontrar estado
            setLocation(detectedCity, 'SP') // Default SP
          }

          // Haptic feedback de sucesso
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } else {
          setError('Loc não encontrada', 'notFound')
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        }

        setLoading(false)
      } catch (error: any) {

        // ============================================
        // SPECIFIC ERROR HANDLING
        // ============================================

        // 1. Settings error (GPS disabled)
        if (isSettingsError(error)) {
          setError('GPS desligado', 'gpsDisabled')
          setLoading(false)

          // Show alert with action
          Alert.alert('GPS Desligado', 'Ative o GPS nas configurações para detectar sua localização.', [
            { text: 'Agora não', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: openLocationSettings,
            },
          ])

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          return
        }

        // 2. Permission error
        if (isPermissionError(error)) {
          setError('Permissão negada', 'permissionDenied')
          setPermissionStatus('denied')
          setLoading(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          return
        }

        // 3. Timeout
        if (error.message === 'Location timeout') {
          setError('Tempo esgotado', 'timeout')
          setLoading(false)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          return
        }

        // 4. Generic error
        setError('Erro ao detectar', 'networkError')
        setLoading(false)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      }
    },
    [
      // city REMOVIDO - usa cityRef.current ✅
      isConnected,
      isCacheRecent,
      setLocation,
      setLoading,
      setError,
      setPermissionStatus,
      clearError,
      getCityFromCoordinates,
    ]
  )

  /**
   * Define localização manualmente (sem GPS)
   * Usado quando usuário escolhe cidade no seletor manual
   * Note: Não altera permissionStatus - seleção manual ≠ permissão GPS
   */
  const setManualLocation = useCallback(
    (city: string, state: string) => {
      setLocation(city, state)
    },
    [setLocation]
  )

  return {
    city,
    isLoading,
    error,
    detectLocation,
    setManualLocation,
    clearError,
  }
}
