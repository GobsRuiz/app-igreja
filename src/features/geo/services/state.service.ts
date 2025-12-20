import { firebaseFirestore } from '@core/config/firebase.config'
import type { State } from '../types'
import { mapFirestoreState } from '../types'

const COLLECTION = 'states'

/**
 * Lista todos os estados
 */
export async function listStates(): Promise<{
  states: State[]
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .orderBy('name', 'asc')
      .get()

    const states: State[] = []

    snapshot.forEach((doc) => {
      const state = mapFirestoreState(doc)
      if (state) {
        states.push(state)
      }
    })

    return { states, error: null }
  } catch (error: any) {
    return { states: [], error: 'Erro ao carregar estados' }
  }
}

/**
 * Busca estado por código
 */
export async function getStateByCode(
  stateCode: string
): Promise<{ state: State | null; error: string | null }> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .where('code', '==', stateCode)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return { state: null, error: 'Estado não encontrado' }
    }

    const state = mapFirestoreState(snapshot.docs[0])
    return { state, error: null }
  } catch (error: any) {
    return { state: null, error: 'Erro ao buscar estado' }
  }
}

/**
 * Listener em tempo real de estados
 */
export function onStatesChange(
  callback: (states: State[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .orderBy('name', 'asc')
    .onSnapshot(
      (snapshot) => {
        const states: State[] = []

        snapshot.forEach((doc) => {
          const state = mapFirestoreState(doc)
          if (state) {
            states.push(state)
          }
        })

        callback(states)
      },
      (error) => {
        if (onError) {
          onError(error)
        }
      }
    )
}
