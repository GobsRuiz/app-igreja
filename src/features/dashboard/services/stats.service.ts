import { firebaseFirestore } from '@core/config/firebase.config'

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  usersCount: number
  eventsCount: number
}

/**
 * Fetch dashboard statistics (count only)
 * Uses Firestore count() to avoid fetching all documents
 */
export async function fetchDashboardStats(): Promise<{
  stats: DashboardStats | null
  error: string | null
}> {
  try {
    // Fetch counts in parallel
    const [usersSnapshot, eventsSnapshot] = await Promise.all([
      firebaseFirestore.collection('users').count().get(),
      firebaseFirestore.collection('events').count().get(),
    ])

    const stats: DashboardStats = {
      usersCount: usersSnapshot.data().count,
      eventsCount: eventsSnapshot.data().count,
    }

    return { stats, error: null }
  } catch (error: any) {
    console.error('[StatsService] Erro ao buscar estatísticas:', error)
    return { stats: null, error: 'Erro ao carregar estatísticas' }
  }
}
