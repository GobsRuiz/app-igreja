import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

/**
 * Estado brasileiro
 */
export interface State {
  id: string
  code: string // AC, AL, AM, etc.
  name: string // Acre, Alagoas, Amazonas, etc.
}

/**
 * Cidade brasileira
 */
export interface City {
  id: string // Código IBGE
  name: string
  state: string // Sigla do estado (AC, AL, etc.)
  stateId: string // ID do documento do estado no Firestore
  latitude?: number
  longitude?: number
}

/**
 * Converte documento Firestore para State
 */
export function mapFirestoreState(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): State | null {
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    code: data.code,
    name: data.name,
  }
}

/**
 * Converte documento Firestore para City
 */
export function mapFirestoreCity(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): City | null {
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    name: data.name,
    state: data.state,
    stateId: data.stateId,
    latitude: data.latitude,
    longitude: data.longitude,
  }
}
