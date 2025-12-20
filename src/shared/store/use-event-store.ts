import { create } from 'zustand'
import { z } from 'zod'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Event } from '@shared/types'
import { listEvents, onEventsChange } from '@features/events/services/event.service'
import type { Event as FirebaseEvent } from '@features/events/types/event.types'
import { onCategoriesChange, type Category } from '@features/categories'
import { onLocationsChange, type Location } from '@features/locations'
import { format } from 'date-fns'
import {
  scheduleEventNotifications,
  cancelEventNotifications,
  hasReachedNotificationLimit,
  canEnableNotification,
} from '@shared/services/notification-service'
import { MAX_NOTIFYING_EVENTS } from '@shared/constants/notification-config'
import { shouldShowInHome } from '@shared/utils/event-helpers'

// ========================================
// CONSTANTS
// ========================================

const FAVORITES_STORAGE_KEY = '@app-igreja:favorite-events'

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

const FavoriteIdsSchema = z.array(z.string().min(1)).max(100)

const DateRangeSchema = z.object({
  start: z.date().optional(),
  end: z.date().optional(),
}).refine(
  (data) => {
    if (data.start && data.end) {
      return data.start <= data.end
    }
    return true
  },
  { message: 'Start date must be before or equal to end date' }
)

const RadiusSchema = z.number()
  .min(1, 'Radius must be at least 1km')
  .max(100, 'Radius cannot exceed 100km')

const SearchQuerySchema = z.string()
  .max(100, 'Search query too long')
  .transform((val) => val.trim())

// ========================================
// ADAPTERS
// ========================================

/**
 * Converte Event do Firebase para formato da UI
 */
function adaptFirebaseEventToUI(
  firebaseEvent: FirebaseEvent,
  categories: Category[],
  locations: Location[]
): Event {
  const category = categories.find(c => c.id === firebaseEvent.categoryId)
  const location = locations.find(l => l.id === firebaseEvent.locationId)

  return {
    id: firebaseEvent.id,
    title: firebaseEvent.title,
    description: firebaseEvent.description,
    date: format(firebaseEvent.date, 'yyyy-MM-dd'),
    time: format(firebaseEvent.date, 'HH:mm'),
    church: location?.name || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zipCode: location?.zipCode || '',
    conductor: '', // Campo não existe no Firebase (será adicionado futuramente)
    attachments: [],
    categoryId: firebaseEvent.categoryId,
    categoryName: category?.name,
    status: firebaseEvent.status || 'active',
    isFavorite: false,
    isNotifying: false,
  }
}

// ========================================
// TYPES
// ========================================

interface EventState {
  // State
  allEvents: Event[]
  filteredEvents: Event[]
  favoriteEvents: Event[]
  categories: Category[]
  locations: Location[]
  selectedCity: string
  selectedCategoryIds: Set<string>
  searchQuery: string
  startDate?: Date
  endDate?: Date
  radiusKm: number // TODO: implementar filtro com geolocation ou coordenadas de cidades
  isLoading: boolean
  error?: string

  // Actions - Filtros
  setSelectedCity: (city: string) => void
  toggleCategoryId: (categoryId: string) => void
  setSearchQuery: (query: string) => void
  setDateRange: (start?: Date, end?: Date) => void
  setRadiusKm: (radius: number) => void
  clearFilters: () => void
  applyFilters: () => void
  updateFavorites: () => void

  // Actions - Eventos
  toggleFavorite: (eventId: string) => void
  toggleNotification: (eventId: string) => Promise<void>
  refreshEvents: () => Promise<void>
  initializeFirestoreListener: () => () => void

  // Actions - Cache (persistência local)
  loadFavoritesFromCache: () => Promise<Set<string>>
  saveFavoritesToCache: () => Promise<void>

  // Selectors otimizados
  getNotifyingEvents: () => Event[]
  getEventById: (id: string) => Event | undefined
  hasActiveFilters: () => boolean
}

// ========================================
// STORE
// ========================================

export const useEventStore = create<EventState>((set, get) => ({
  // ========================================
  // STATE INICIAL
  // ========================================
  allEvents: [],
  filteredEvents: [],
  favoriteEvents: [],
  categories: [],
  locations: [],
  selectedCity: 'Taquaritinga',
  selectedCategoryIds: new Set<string>(),
  searchQuery: '',
  radiusKm: 10, // TODO: filtro de raio não implementado (requer geolocation ou coordenadas de cidades)
  isLoading: true,

  // ========================================
  // ACTIONS - FILTROS
  // ========================================

  setSelectedCity: (city) => {
    // Sanitização: trim e validação básica
    const sanitizedCity = city.trim()
    if (!sanitizedCity) {
      return
    }

    set({ selectedCity: sanitizedCity })
    get().applyFilters()
  },

  toggleCategoryId: (categoryId) => {
    // Validação do ID
    if (!categoryId || typeof categoryId !== 'string') {
      return
    }

    const categoryIds = new Set(get().selectedCategoryIds)
    if (categoryIds.has(categoryId)) {
      categoryIds.delete(categoryId)
    } else {
      categoryIds.add(categoryId)
    }
    set({ selectedCategoryIds: categoryIds })
    get().applyFilters()
  },

  setSearchQuery: (query) => {
    // Validação com Zod
    const result = SearchQuerySchema.safeParse(query)

    if (!result.success) {
      return
    }

    set({ searchQuery: result.data })
    get().applyFilters()
  },

  setDateRange: (start, end) => {
    // Validação com Zod
    const result = DateRangeSchema.safeParse({ start, end })

    if (!result.success) {
      set({ error: 'Data inicial deve ser anterior ou igual à data final' })
      return
    }

    set({
      startDate: result.data.start,
      endDate: result.data.end,
      error: undefined
    })
    get().applyFilters()
  },

  setRadiusKm: (radius) => {
    // Validação com Zod
    const result = RadiusSchema.safeParse(radius)

    if (!result.success) {
      return
    }

    set({ radiusKm: result.data })
    get().applyFilters()
  },

  clearFilters: () => {
    set({
      selectedCategoryIds: new Set(),
      searchQuery: '',
      startDate: undefined,
      endDate: undefined,
      radiusKm: 10,
      error: undefined,
    })
    get().applyFilters()
  },

  applyFilters: () => {
    const {
      allEvents,
      selectedCity,
      selectedCategoryIds,
      searchQuery,
      startDate,
      endDate
    } = get()

    let filtered = allEvents

    // Filtro por status: apenas eventos 'active' (Home/Search)
    // Cloud Function marca eventos como 'finished' quando <= 10 minutos
    // Este filtro adiciona segurança client-side
    filtered = filtered.filter((event) => shouldShowInHome(event))

    // Filtro por cidade (apenas se selectedCity não for o default)
    if (selectedCity && selectedCity !== 'Taquaritinga') {
      filtered = filtered.filter((event) => event.city === selectedCity)
    }

    // Filtro por categoria
    if (selectedCategoryIds.size > 0) {
      filtered = filtered.filter((event) => {
        return event.categoryId && selectedCategoryIds.has(event.categoryId)
      })
    }

    // Filtro por busca (sanitizado)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.church.toLowerCase().includes(query) ||
          event.conductor.toLowerCase().includes(query)
      )
    }

    // Filtro por data inicial
    if (startDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate >= startDate
      })
    }

    // Filtro por data final
    if (endDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate <= endDate
      })
    }

    set({ filteredEvents: filtered })
    get().updateFavorites()
  },

  updateFavorites: () => {
    const { allEvents } = get()
    const favorites = allEvents.filter((event) => event.isFavorite)
    set({ favoriteEvents: favorites })
  },

  // ========================================
  // ACTIONS - EVENTOS
  // ========================================

  toggleFavorite: (eventId) => {
    // Validação do ID
    if (!eventId || typeof eventId !== 'string') {
      return
    }

    set((state) => ({
      allEvents: state.allEvents.map((event) =>
        event.id === eventId
          ? { ...event, isFavorite: !event.isFavorite }
          : event
      ),
    }))

    // Atualiza favoritos e reaplica filtros
    get().updateFavorites()
    get().applyFilters()

    // Persiste favoritos no AsyncStorage
    get().saveFavoritesToCache()
  },

  toggleNotification: async (eventId) => {
    // Validação do ID
    if (!eventId || typeof eventId !== 'string') {
      return
    }

    const event = get().getEventById(eventId)
    if (!event) {
      return
    }

    const isCurrentlyNotifying = event.isNotifying

    if (isCurrentlyNotifying) {
      // DEACTIVATE: Cancel notifications
      const { success, error } = await cancelEventNotifications(eventId)

      if (!success) {
        return
      }

      // Update state
      set((state) => ({
        allEvents: state.allEvents.map((e) =>
          e.id === eventId ? { ...e, isNotifying: false } : e
        ),
      }))
    } else {
      // ACTIVATE: Check limits and schedule notifications

      // Check if event is too close
      if (!canEnableNotification(event)) {
        return
      }

      // Check limit
      const limitReached = await hasReachedNotificationLimit()
      if (limitReached) {
        return
      }

      // Schedule notifications
      const { success, error, scheduledCount } = await scheduleEventNotifications(event)

      if (!success) {
        return
      }

      // Update state
      set((state) => ({
        allEvents: state.allEvents.map((e) =>
          e.id === eventId ? { ...e, isNotifying: true } : e
        ),
      }))
    }

    // Reaplica filtros para atualizar filteredEvents
    get().applyFilters()
  },

  refreshEvents: async () => {
    set({ isLoading: true, error: undefined })

    try {
      const { events, error } = await listEvents()

      if (error) {
        set({
          error,
          isLoading: false
        })
        return
      }

      // Adaptar eventos do Firebase para formato da UI
      const { categories, locations } = get()
      const adaptedEvents = events.map(event =>
        adaptFirebaseEventToUI(event, categories, locations)
      )

      set({
        allEvents: adaptedEvents,
        isLoading: false,
        error: undefined
      })

      get().applyFilters()
    } catch (error) {
      set({
        error: 'Erro ao carregar eventos. Tente novamente.',
        isLoading: false
      })
    }
  },

  initializeFirestoreListener: () => {
    // Closures para manter dados atualizados entre listeners
    let categories: Category[] = []
    let locations: Location[] = []
    let rawEvents: FirebaseEvent[] = []
    let cachedFavoriteIds: Set<string> = new Set()

    // Carregar favoritos do cache ANTES de inicializar listeners
    get().loadFavoritesFromCache().then(ids => {
      cachedFavoriteIds = ids
    })

    // Função helper para adaptar todos os eventos
    const adaptAllEvents = () => {
      const adaptedEvents = rawEvents.map(event => {
        const baseEvent = adaptFirebaseEventToUI(event, categories, locations)
        return {
          ...baseEvent,
          // MERGE: Preservar favoritos do cache
          isFavorite: cachedFavoriteIds.has(event.id)
        }
      })
      set({ allEvents: adaptedEvents })
      get().applyFilters()
    }

    // 1. Listener de categories
    const unsubscribeCategories = onCategoriesChange(
      (cats) => {
        categories = cats
        set({ categories: cats })
        adaptAllEvents()
      },
      (error) => {
        // Listener error
      }
    )

    // 2. Listener de locations
    const unsubscribeLocations = onLocationsChange(
      (locs) => {
        locations = locs
        set({ locations: locs })
        adaptAllEvents()
      },
      (error) => {
        // Listener error
      }
    )

    // 3. Listener de events
    const unsubscribeEvents = onEventsChange(
      (events) => {
        rawEvents = events
        set({ isLoading: false, error: undefined })
        adaptAllEvents()
      },
      (error) => {
        set({
          error: 'Erro ao sincronizar eventos',
          isLoading: false
        })
      }
    )

    // Retorna função que cancela todos os listeners
    return () => {
      unsubscribeCategories()
      unsubscribeLocations()
      unsubscribeEvents()
    }
  },

  // ========================================
  // SELECTORS OTIMIZADOS
  // ========================================

  getNotifyingEvents: () => {
    return get().allEvents.filter((event) => event.isNotifying)
  },

  getEventById: (id) => {
    // Validação do ID
    if (!id || typeof id !== 'string') {
      return undefined
    }
    return get().allEvents.find((event) => event.id === id)
  },

  hasActiveFilters: () => {
    const state = get()
    return (
      state.selectedCategoryIds.size > 0 ||
      state.searchQuery.trim() !== '' ||
      state.startDate !== undefined ||
      state.endDate !== undefined ||
      state.radiusKm !== 10
    )
  },

  // ========================================
  // ACTIONS - CACHE (Persistência Local)
  // ========================================

  loadFavoritesFromCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY)

      if (!cached) {
        return new Set<string>()
      }

      const parsed = JSON.parse(cached)

      // Validação com Zod
      const result = FavoriteIdsSchema.safeParse(parsed)

      if (!result.success) {
        await AsyncStorage.removeItem(FAVORITES_STORAGE_KEY)
        return new Set<string>()
      }

      // Filtrar apenas IDs válidos (eventos que existem)
      const { allEvents } = get()
      const validIds = result.data.filter(id =>
        allEvents.some(event => event.id === id)
      )

      return new Set(validIds)
    } catch (error) {
      return new Set<string>()
    }
  },

  saveFavoritesToCache: async () => {
    try {
      const favoriteIds = get().allEvents
        .filter(event => event.isFavorite)
        .map(event => event.id)

      await AsyncStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds)
      )
    } catch (error) {
      // Error saving to cache
    }
  },
}))

// ========================================
// SELECTORS EXTERNOS (Para otimização de re-renders)
// ========================================

/**
 * Selector otimizado para eventos filtrados
 * Uso: const filteredEvents = useEventStore(selectFilteredEvents)
 */
export const selectFilteredEvents = (state: EventState) => state.filteredEvents

/**
 * Selector otimizado para eventos favoritos
 * Uso: const favorites = useEventStore(selectFavoriteEvents)
 */
export const selectFavoriteEvents = (state: EventState) => state.favoriteEvents

/**
 * Selector otimizado para loading state
 * Uso: const isLoading = useEventStore(selectIsLoading)
 */
export const selectIsLoading = (state: EventState) => state.isLoading

/**
 * Selector otimizado para erro
 * Uso: const error = useEventStore(selectError)
 */
export const selectError = (state: EventState) => state.error

/**
 * Selector otimizado para cidade selecionada
 * Uso: const city = useEventStore(selectSelectedCity)
 */
export const selectSelectedCity = (state: EventState) => state.selectedCity

/**
 * Selector otimizado para query de busca
 * Uso: const query = useEventStore(selectSearchQuery)
 */
export const selectSearchQuery = (state: EventState) => state.searchQuery
