import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ========================================
// TYPES
// ========================================

interface LocationState {
  // State
  city: string | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null // timestamp

  // Actions
  setCity: (city: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  loadFromCache: () => Promise<void>
  saveToCache: (city: string) => Promise<void>
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
  isLoading: false,
  error: null,
  lastUpdated: null,

  // ========================================
  // ACTIONS
  // ========================================

  setCity: (city) => {
    // Validação básica
    if (!city || typeof city !== 'string' || !city.trim()) {
      console.warn('[LocationStore] Invalid city name')
      return
    }

    const sanitizedCity = city.trim()
    const now = Date.now()

    set({
      city: sanitizedCity,
      lastUpdated: now,
      error: null,
    })

    // Salva no cache
    get().saveToCache(sanitizedCity)
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({
      error,
      isLoading: false,
    })
  },

  clearError: () => {
    set({ error: null })
  },

  loadFromCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY)

      if (!cached) {
        console.log('[LocationStore] No cached location found')
        return
      }

      const parsed = JSON.parse(cached)
      const { city, lastUpdated } = parsed

      // Validação dos dados do cache
      if (!city || typeof city !== 'string') {
        console.warn('[LocationStore] Invalid cached data')
        await AsyncStorage.removeItem(STORAGE_KEY)
        return
      }

      const now = Date.now()
      const age = now - (lastUpdated || 0)

      // Verifica se cache está válido (< 1 hora)
      if (age < CACHE_MAX_AGE) {
        console.log('[LocationStore] Loaded city from cache:', city)
        set({
          city,
          lastUpdated,
          error: null,
        })
      } else {
        console.log('[LocationStore] Cached location is too old')
      }
    } catch (error) {
      console.error('[LocationStore] Error loading from cache:', error)
    }
  },

  saveToCache: async (city) => {
    try {
      const data = {
        city,
        lastUpdated: Date.now(),
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log('[LocationStore] Saved city to cache:', city)
    } catch (error) {
      console.error('[LocationStore] Error saving to cache:', error)
    }
  },

  reset: () => {
    set({
      city: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
    })
    AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
      console.error('[LocationStore] Error removing cache:', error)
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
