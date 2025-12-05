import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import type { Category } from '@features/categories'
import type { Location } from '@features/locations'

/**
 * Evento
 */
export interface Event {
  id: string
  title: string
  description: string
  date: Date
  categoryId: string
  locationId: string
  imageUrl?: string
  createdAt: Date
  createdBy: string
}

/**
 * Evento com dados populados (categoria e local)
 */
export interface EventWithDetails extends Event {
  category?: Category
  location?: Location
}

/**
 * Dados para criar evento
 */
export interface CreateEventData {
  title: string
  description: string
  date: Date
  categoryId: string
  locationId: string
  imageUrl?: string
}

/**
 * Dados para atualizar evento
 */
export interface UpdateEventData {
  title?: string
  description?: string
  date?: Date
  categoryId?: string
  locationId?: string
  imageUrl?: string
}

/**
 * Converte documento Firestore para Event
 */
export function mapFirestoreEvent(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): Event | null {
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    date: data.date?.toDate() || new Date(),
    categoryId: data.categoryId,
    locationId: data.locationId,
    imageUrl: data.imageUrl,
    createdAt: data.createdAt?.toDate() || new Date(),
    createdBy: data.createdBy,
  }
}
