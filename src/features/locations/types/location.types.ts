import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

/**
 * Local/Igreja
 */
export interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode?: string
  createdAt: Date
  createdBy: string
}

/**
 * Dados para criar local
 */
export interface CreateLocationData {
  name: string
  address: string
  city: string
  state: string
  zipCode?: string
}

/**
 * Dados para atualizar local
 */
export interface UpdateLocationData {
  name?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
}

/**
 * Converte documento Firestore para Location
 */
export function mapFirestoreLocation(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): Location | null {
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    name: data.name,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    createdAt: data.createdAt?.toDate() || new Date(),
    createdBy: data.createdBy,
  }
}
