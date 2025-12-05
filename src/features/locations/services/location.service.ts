import { firebaseFirestore, firebaseAuth } from '@core/config/firebase.config'
import firestore from '@react-native-firebase/firestore'
import type {
  Location,
  CreateLocationData,
  UpdateLocationData,
} from '../types/location.types'
import { mapFirestoreLocation } from '../types/location.types'

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
    console.error('[LocationService] Erro ao criar local:', error)
    return { location: null, error: 'Erro ao criar local' }
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
      .orderBy('name', 'asc')
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
    console.error('[LocationService] Erro ao listar locais:', error)
    return { locations: [], error: 'Erro ao carregar locais' }
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
    console.error('[LocationService] Erro ao atualizar local:', error)
    return { error: 'Erro ao atualizar local' }
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
    console.error('[LocationService] Erro ao deletar local:', error)
    return { error: 'Erro ao deletar local' }
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
    .orderBy('name', 'asc')
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
        console.error('[LocationService] Erro no listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )
}
