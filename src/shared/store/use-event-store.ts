import { create } from 'zustand'
import { z } from 'zod'
import type { Event } from '@shared/types'
import { listEvents, onEventsChange } from '@features/events/services/event.service'
import type { Event as FirebaseEvent } from '@features/events/types/event.types'
import { format } from 'date-fns'

// ========================================
// SCHEMAS DE VALIDAÇÃO
// ========================================

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
function adaptFirebaseEventToUI(firebaseEvent: FirebaseEvent): Event {
  return {
    id: firebaseEvent.id,
    title: firebaseEvent.title,
    description: firebaseEvent.description,
    date: format(firebaseEvent.date, 'yyyy-MM-dd'),
    time: format(firebaseEvent.date, 'HH:mm'),
    church: '', // TODO: buscar do locationId
    address: '', // TODO: buscar do locationId
    city: 'Taquaritinga', // TODO: buscar do locationId
    conductor: '', // TODO: adicionar campo no Firebase
    latitude: undefined,
    longitude: undefined,
    attachments: [],
    categoryId: firebaseEvent.categoryId,
    categoryName: undefined, // TODO: buscar do categoryId
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
  toggleNotification: (eventId: string) => void
  refreshEvents: () => Promise<void>
  initializeFirestoreListener: () => () => void

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
      console.warn('[EventStore] Invalid city name')
      return
    }

    set({ selectedCity: sanitizedCity })
    get().applyFilters()
  },

  toggleCategoryId: (categoryId) => {
    // Validação do ID
    if (!categoryId || typeof categoryId !== 'string') {
      console.warn('[EventStore] Invalid category ID')
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
      console.warn('[EventStore] Invalid search query:', result.error.errors)
      return
    }

    set({ searchQuery: result.data })
    get().applyFilters()
  },

  setDateRange: (start, end) => {
    // Validação com Zod
    const result = DateRangeSchema.safeParse({ start, end })

    if (!result.success) {
      console.warn('[EventStore] Invalid date range:', result.error.errors)
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
      console.warn('[EventStore] Invalid radius:', result.error.errors)
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

    // Filtro por cidade (sempre ativo)
    filtered = filtered.filter((event) => event.city === selectedCity)

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
      console.warn('[EventStore] Invalid event ID for favorite toggle')
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
  },

  toggleNotification: (eventId) => {
    // Validação do ID
    if (!eventId || typeof eventId !== 'string') {
      console.warn('[EventStore] Invalid event ID for notification toggle')
      return
    }

    set((state) => ({
      allEvents: state.allEvents.map((event) =>
        event.id === eventId
          ? { ...event, isNotifying: !event.isNotifying }
          : event
      ),
    }))

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
      const adaptedEvents = events.map(adaptFirebaseEventToUI)

      set({
        allEvents: adaptedEvents,
        isLoading: false,
        error: undefined
      })

      get().applyFilters()
    } catch (error) {
      console.error('[EventStore] Error refreshing events:', error)
      set({
        error: 'Erro ao carregar eventos. Tente novamente.',
        isLoading: false
      })
    }
  },

  initializeFirestoreListener: () => {
    console.log('[EventStore] Initializing Firestore listener')

    const unsubscribe = onEventsChange(
      (events) => {
        console.log(`[EventStore] Received ${events.length} events from Firestore`)

        // Adaptar eventos do Firebase para formato da UI
        const adaptedEvents = events.map(adaptFirebaseEventToUI)

        set({
          allEvents: adaptedEvents,
          isLoading: false,
          error: undefined
        })

        get().applyFilters()
      },
      (error) => {
        console.error('[EventStore] Firestore listener error:', error)
        set({
          error: 'Erro ao sincronizar eventos',
          isLoading: false
        })
      }
    )

    return unsubscribe
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
      console.warn('[EventStore] Invalid event ID for getById')
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
