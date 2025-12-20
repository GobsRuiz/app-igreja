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
        if (onError) {
          onError(error)
        }
      }
    )
}

/**
 * Busca o código do estado de uma cidade pelo nome
 * Útil para descobrir o estado quando só se tem o nome da cidade
 */
export async function getStateByCity(
  cityName: string
): Promise<{ state: string | null; error: string | null }> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .where('name', '==', cityName)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return { state: null, error: 'Cidade não encontrada' }
    }

    const city = mapFirestoreCity(snapshot.docs[0])

    if (!city) {
      return { state: null, error: 'Erro ao processar cidade' }
    }

    return { state: city.state, error: null }
  } catch (error: any) {
    return { state: null, error: 'Erro ao buscar estado' }
  }
}
