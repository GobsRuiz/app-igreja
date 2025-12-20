import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ========================================
// TYPES
// ========================================

export type PermissionStatus = 'granted' | 'denied' | 'undetermined'

export type LocationErrorType =
  | 'permissionDenied'
  | 'gpsDisabled'
  | 'timeout'
  | 'networkError'
  | 'notFound'
  | 'offline'
  | null

interface LocationState {
  // State
  city: string | null
  state: string | null // Código do estado (ex: 'SP', 'RJ')
  isLoading: boolean
  error: string | null
  errorType: LocationErrorType // Tipo específico de erro
  permissionStatus: PermissionStatus
  lastUpdated: number | null // timestamp

  // Actions
  setLocation: (city: string, state: string) => void
  setCity: (city: string) => void // @deprecated - use setLocation
  setLoading: (loading: boolean) => void
  setError: (error: string | null, errorType?: LocationErrorType) => void
  setPermissionStatus: (status: PermissionStatus) => void
  clearError: () => void
  loadFromCache: () => Promise<void>
  saveToCache: (city: string, state: string) => Promise<void>
  reset: () => void
}

// ========================================
// CONSTANTS
// ========================================

const STORAGE_KEY = '@app-igreja:user-city'
const CACHE_MAX_AGE = 60 * 60 * 1000 // 1 hour in milliseconds

// ========================================
// STORE
// ========================================

export const useLocationStore = create<LocationState>((set, get) => ({
  // ========================================
  // STATE INICIAL
  // ========================================
  city: null,
  state: null,
  isLoading: false,
  error: null,
  errorType: null,
  permissionStatus: 'undetermined',
  lastUpdated: null,

  // ========================================
  // ACTIONS
  // ========================================

  setLocation: (city, state) => {
    // Validação básica
    if (!city || typeof city !== 'string' || !city.trim()) {
      return
    }

    if (!state || typeof state !== 'string' || !state.trim()) {
      return
    }

    const sanitizedCity = city.trim()
    const sanitizedState = state.trim().toUpperCase() // Estados sempre uppercase
    const now = Date.now()

    set({
      city: sanitizedCity,
      state: sanitizedState,
      lastUpdated: now,
      error: null,
    })

    // Salva no cache
    get().saveToCache(sanitizedCity, sanitizedState)
  },

  setCity: (city) => {
    // @deprecated - mantido para compatibilidade

    // Validação básica
    if (!city || typeof city !== 'string' || !city.trim()) {
      return
    }

    const sanitizedCity = city.trim()
    const now = Date.now()

    set({
      city: sanitizedCity,
      lastUpdated: now,
      error: null,
    })

    // Salva no cache (sem estado por compatibilidade)
    get().saveToCache(sanitizedCity, '')
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error, errorType = null) => {
    set({
      error,
      errorType,
      isLoading: false,
    })
  },

  setPermissionStatus: (status) => {
    set({ permissionStatus: status })
  },

  clearError: () => {
    set({ error: null, errorType: null })
  },

  loadFromCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY)

      if (!cached) {
        return
      }

      const parsed = JSON.parse(cached)
      const { city, state, lastUpdated } = parsed

      // Validação dos dados do cache
      if (!city || typeof city !== 'string') {
        await AsyncStorage.removeItem(STORAGE_KEY)
        return
      }

      const now = Date.now()
      const age = now - (lastUpdated || 0)

      // Verifica se cache está válido (< 1 hora)
      if (age < CACHE_MAX_AGE) {
        set({
          city,
          state: state || null, // Pode não ter estado em cache antigo
          lastUpdated,
          error: null,
        })
      }
    } catch (error) {
      // Error loading from cache
    }
  },

  saveToCache: async (city, state) => {
    try {
      const data = {
        city,
        state,
        lastUpdated: Date.now(),
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      // Error saving to cache
    }
  },

  reset: () => {
    set({
      city: null,
      state: null,
      isLoading: false,
      error: null,
      errorType: null,
      permissionStatus: 'undetermined',
      lastUpdated: null,
    })
    AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
      // Error removing cache
    })
  },
}))

// ========================================
// SELECTORS OTIMIZADOS
// ========================================

/**
 * Selector otimizado para cidade
 * Uso: const city = useLocationStore(selectCity)
 */
export const selectCity = (state: LocationState) => state.city

/**
 * Selector otimizado para estado
 * Uso: const stateCode = useLocationStore(selectState)
 */
export const selectState = (state: LocationState) => state.state

/**
 * Selector otimizado para loading state
 * Uso: const isLoading = useLocationStore(selectIsLoading)
 */
export const selectIsLoading = (state: LocationState) => state.isLoading

/**
 * Selector otimizado para erro
 * Uso: const error = useLocationStore(selectError)
 */
export const selectError = (state: LocationState) => state.error

/**
 * Selector para verificar se cache é válido
 * Uso: const isValid = useLocationStore(selectIsCacheValid)
 */
export const selectIsCacheValid = (state: LocationState) => {
  if (!state.lastUpdated) return false
  const age = Date.now() - state.lastUpdated
  return age < CACHE_MAX_AGE
}

/**
 * Helper para verificar idade do cache em minutos
 */
export const selectCacheAgeMinutes = (state: LocationState) => {
  if (!state.lastUpdated) return null
  const age = Date.now() - state.lastUpdated
  return Math.floor(age / 60000)
}

/**
 * Selector para tipo de erro
 */
export const selectErrorType = (state: LocationState) => state.errorType

/**
 * Selector para status de permissão
 */
export const selectPermissionStatus = (state: LocationState) => state.permissionStatus

/**
 * Selector para verificar se tem localização
 */
export const selectHasLocation = (state: LocationState) => !!state.city
