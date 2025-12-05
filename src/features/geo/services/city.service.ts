import { firebaseFirestore } from '@core/config/firebase.config'
import type { City } from '../types'
import { mapFirestoreCity } from '../types'

const COLLECTION = 'cities'

/**
 * Lista todas as cidades
 */
export async function listCities(): Promise<{
  cities: City[]
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .orderBy('name', 'asc')
      .get()

    const cities: City[] = []

    snapshot.forEach((doc) => {
      const city = mapFirestoreCity(doc)
      if (city) {
        cities.push(city)
      }
    })

    return { cities, error: null }
  } catch (error: any) {
    console.error('[CityService] Erro ao listar cidades:', error)
    return { cities: [], error: 'Erro ao carregar cidades' }
  }
}

/**
 * Lista cidades por estado
 */
export async function listCitiesByState(
  stateCode: string
): Promise<{ cities: City[]; error: string | null }> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .where('state', '==', stateCode)
      .orderBy('name', 'asc')
      .get()

    const cities: City[] = []

    snapshot.forEach((doc) => {
      const city = mapFirestoreCity(doc)
      if (city) {
        cities.push(city)
      }
    })

    return { cities, error: null }
  } catch (error: any) {
    console.error('[CityService] Erro ao listar cidades por estado:', error)
    return { cities: [], error: 'Erro ao carregar cidades' }
  }
}

/**
 * Listener em tempo real de todas as cidades
 */
export function onCitiesChange(
  callback: (cities: City[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .orderBy('name', 'asc')
    .onSnapshot(
      (snapshot) => {
        const cities: City[] = []

        snapshot.forEach((doc) => {
          const city = mapFirestoreCity(doc)
          if (city) {
            cities.push(city)
          }
        })

        callback(cities)
      },
      (error) => {
        console.error('[CityService] Erro no listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )
}

/**
 * Listener em tempo real de cidades filtradas por estado
 */
export function onCitiesByStateChange(
  stateCode: string,
  callback: (cities: City[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .where('state', '==', stateCode)
    .orderBy('name', 'asc')
    .onSnapshot(
      (snapshot) => {
        const cities: City[] = []

        snapshot.forEach((doc) => {
          const city = mapFirestoreCity(doc)
          if (city) {
            cities.push(city)
          }
        })

        callback(cities)
      },
      (error) => {
        console.error('[CityService] Erro no listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )
}
