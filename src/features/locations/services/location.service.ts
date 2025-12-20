import { firebaseFirestore, firebaseAuth } from '@core/config/firebase.config'
import firestore from '@react-native-firebase/firestore'
import type {
  Location,
  CreateLocationData,
  UpdateLocationData,
} from '../types/location.types'
import { mapFirestoreLocation } from '../types/location.types'
import { ErrorHandler } from '@shared/services'

const COLLECTION = 'locations'

/**
 * Cria um novo local
 */
export async function createLocation(
  data: CreateLocationData
): Promise<{ location: Location | null; error: string | null }> {
  try {
    // Validações
    if (!data.name.trim()) {
      return { location: null, error: 'Nome do local é obrigatório' }
    }

    if (!data.address.trim()) {
      return { location: null, error: 'Endereço é obrigatório' }
    }

    if (!data.city.trim()) {
      return { location: null, error: 'Cidade é obrigatória' }
    }

    if (!data.state.trim()) {
      return { location: null, error: 'Estado é obrigatório' }
    }

    const currentUser = firebaseAuth.currentUser
    if (!currentUser) {
      return { location: null, error: 'Usuário não autenticado' }
    }

    // Criar no Firestore
    const docRef = await firebaseFirestore.collection(COLLECTION).add({
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      zipCode: data.zipCode?.trim() || '',
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser.uid,
    })

    // Buscar documento criado
    const doc = await docRef.get()
    const location = mapFirestoreLocation(doc)

    if (!location) {
      return { location: null, error: 'Erro ao criar local' }
    }

    return { location, error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao criar local')
    return { location: null, error: errorMessage }
  }
}

/**
 * Lista todos os locais
 */
export async function listLocations(): Promise<{
  locations: Location[]
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get()

    const locations: Location[] = []

    snapshot.forEach((doc) => {
      const location = mapFirestoreLocation(doc)
      if (location) {
        locations.push(location)
      }
    })

    return { locations, error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao carregar locais')
    return { locations: [], error: errorMessage }
  }
}

/**
 * Atualiza um local
 */
export async function updateLocation(
  locationId: string,
  data: UpdateLocationData
): Promise<{ error: string | null }> {
  try {
    // Validações
    if (data.name !== undefined && !data.name.trim()) {
      return { error: 'Nome do local não pode ser vazio' }
    }

    if (data.address !== undefined && !data.address.trim()) {
      return { error: 'Endereço não pode ser vazio' }
    }

    if (data.city !== undefined && !data.city.trim()) {
      return { error: 'Cidade não pode ser vazia' }
    }

    if (data.state !== undefined && !data.state.trim()) {
      return { error: 'Estado não pode ser vazio' }
    }

    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }

    if (data.address !== undefined) {
      updateData.address = data.address.trim()
    }

    if (data.city !== undefined) {
      updateData.city = data.city.trim()
    }

    if (data.state !== undefined) {
      updateData.state = data.state.trim()
    }

    if (data.zipCode !== undefined) {
      updateData.zipCode = data.zipCode.trim()
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'Nenhum dado para atualizar' }
    }

    await firebaseFirestore.collection(COLLECTION).doc(locationId).update(updateData)

    return { error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao atualizar local')
    return { error: errorMessage }
  }
}

/**
 * Verifica se um local está sendo usado por algum evento
 * Otimizado: para no primeiro evento encontrado
 */
export async function checkLocationInUse(locationId: string): Promise<{
  inUse: boolean
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection('events')
      .where('locationId', '==', locationId)
      .limit(1)
      .get()

    return {
      inUse: !snapshot.empty,
      error: null,
    }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao verificar dependências')
    return { inUse: false, error: errorMessage }
  }
}

/**
 * Deleta um local
 */
export async function deleteLocation(locationId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(locationId).delete()
    return { error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao deletar local')
    return { error: errorMessage }
  }
}

/**
 * Listener em tempo real de locais
 */
export function onLocationsChange(
  callback: (locations: Location[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const locations: Location[] = []

        snapshot.forEach((doc) => {
          const location = mapFirestoreLocation(doc)
          if (location) {
            locations.push(location)
          }
        })

        callback(locations)
      },
      (error) => {
        if (onError) {
          onError(error)
        }
      }
    )
}
