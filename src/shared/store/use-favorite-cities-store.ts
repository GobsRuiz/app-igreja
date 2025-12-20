import { create } from 'zustand'
import { z } from 'zod'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ========================================
// CONSTANTS
// ========================================

const FAVORITES_STORAGE_KEY = '@app-igreja:favorite-cities'
const MAX_FAVORITE_CITIES = 20

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

/**
 * Schema para validar chave composta de cidade
 * Formato: "UF-NomeCidade" (ex: "SP-São Paulo", "RJ-Rio de Janeiro")
 */
const CityKeySchema = z.string().regex(/^[A-Z]{2}-.+$/, 'Invalid city key format (expected: UF-CityName)')

/**
 * Schema para array de cidades favoritas
 */
const FavoriteCitiesSchema = z.array(CityKeySchema).max(MAX_FAVORITE_CITIES)

// ========================================
// TYPES
// ========================================

interface FavoriteCitiesState {
  // State
  favoriteCities: string[] // ["SP-São Paulo", "RJ-Rio de Janeiro"]

  // Actions
  toggleFavorite: (stateCode: string, cityName: string) => void
  isFavorite: (stateCode: string, cityName: string) => boolean
  removeFavorite: (cityKey: string) => void
  clearAll: () => void

  // Cache (persistência local)
  loadFromCache: () => Promise<void>
  saveToCache: () => Promise<void>
}

// ========================================
// HELPERS
// ========================================

/**
 * Cria chave composta de cidade
 * @param stateCode Código do estado (ex: "SP", "RJ")
 * @param cityName Nome da cidade (ex: "São Paulo")
 * @returns Chave composta (ex: "SP-São Paulo")
 */
function createCityKey(stateCode: string, cityName: string): string {
  // Sanitização
  const sanitizedState = stateCode.trim().toUpperCase()
  const sanitizedCity = cityName.trim()

  if (!sanitizedState || !sanitizedCity) {
    throw new Error('State code and city name are required')
  }

  if (!/^[A-Z]{2}$/.test(sanitizedState)) {
    throw new Error('Invalid state code (expected 2 uppercase letters)')
  }

  return `${sanitizedState}-${sanitizedCity}`
}

/**
 * Parseia chave composta de cidade
 * @param cityKey Chave composta (ex: "SP-São Paulo")
 * @returns { stateCode: string, cityName: string }
 */
function parseCityKey(cityKey: string): { stateCode: string; cityName: string } | null {
  const match = cityKey.match(/^([A-Z]{2})-(.+)$/)

  if (!match) return null

  return {
    stateCode: match[1],
    cityName: match[2],
  }
}

// ========================================
// STORE
// ========================================

export const useFavoriteCitiesStore = create<FavoriteCitiesState>((set, get) => ({
  // ========================================
  // STATE INICIAL
  // ========================================
  favoriteCities: [],

  // ========================================
  // ACTIONS
  // ========================================

  toggleFavorite: (stateCode, cityName) => {
    try {
      // Validação de inputs
      if (!stateCode || typeof stateCode !== 'string') {
        return
      }

      if (!cityName || typeof cityName !== 'string' || cityName === '') {
        return
      }

      const cityKey = createCityKey(stateCode, cityName)

      set((state) => {
        const isFavorited = state.favoriteCities.includes(cityKey)

        if (isFavorited) {
          // REMOVER favorito
          return {
            favoriteCities: state.favoriteCities.filter((key) => key !== cityKey),
          }
        } else {
          // ADICIONAR favorito (verificar limite)
          if (state.favoriteCities.length >= MAX_FAVORITE_CITIES) {
            return state
          }

          return {
            favoriteCities: [...state.favoriteCities, cityKey],
          }
        }
      })

      // Salvar no cache
      get().saveToCache()
    } catch (error) {
      // Error toggling favorite
    }
  },

  isFavorite: (stateCode, cityName) => {
    try {
      if (!stateCode || !cityName) return false

      const cityKey = createCityKey(stateCode, cityName)
      return get().favoriteCities.includes(cityKey)
    } catch (error) {
      return false
    }
  },

  removeFavorite: (cityKey) => {
    // Validação
    if (!cityKey || typeof cityKey !== 'string') {
      return
    }

    set((state) => ({
      favoriteCities: state.favoriteCities.filter((key) => key !== cityKey),
    }))

    // Salvar no cache
    get().saveToCache()
  },

  clearAll: () => {
    set({ favoriteCities: [] })
    AsyncStorage.removeItem(FAVORITES_STORAGE_KEY).catch((error) => {
      // Error clearing cache
    })
  },

  // ========================================
  // CACHE (Persistência Local)
  // ========================================

  loadFromCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY)

      if (!cached) {
        return
      }

      const parsed = JSON.parse(cached)

      // Validação com Zod
      const result = FavoriteCitiesSchema.safeParse(parsed)

      if (!result.success) {
        await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY)
        return
      }

      set({ favoriteCities: result.data })
    } catch (error) {
      // Error loading from cache
    }
  },

  saveToCache: async () => {
    try {
      const { favoriteCities } = get()

      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteCities))
    } catch (error) {
      // Error saving to cache
    }
  },
}))

// ========================================
// SELECTORS OTIMIZADOS
// ========================================

/**
 * Selector para lista de cidades favoritas
 * Uso: const favoriteCities = useFavoriteCitiesStore(selectFavoriteCities)
 */
export const selectFavoriteCities = (state: FavoriteCitiesState) => state.favoriteCities

/**
 * Selector para verificar se cidade é favorita
 * Uso: const isFav = useFavoriteCitiesStore(selectIsFavorite(stateCode, cityName))
 */
export const selectIsFavorite = (stateCode: string, cityName: string) => (state: FavoriteCitiesState) =>
  state.isFavorite(stateCode, cityName)

// ========================================
// EXPORTS AUXILIARES
// ========================================

export { parseCityKey, createCityKey }
