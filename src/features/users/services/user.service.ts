import { firebaseFirestore } from '@core/config/firebase.config'
import type { User } from '../types/user.types'
import { mapFirestoreUser } from '../types/user.types'

const COLLECTION = 'users'

/**
 * Lista todos os usuários
 */
export async function listUsers(): Promise<{
  users: User[]
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get()

    const users: User[] = []

    snapshot.forEach((doc) => {
      const user = mapFirestoreUser(doc)
      if (user) {
        users.push(user)
      }
    })

    return { users, error: null }
  } catch (error: any) {
    console.error('[UserService] Erro ao listar usuários:', error)
    return { users: [], error: 'Erro ao carregar usuários' }
  }
}

/**
 * Listener em tempo real de usuários
 */
export function onUsersChange(
  callback: (users: User[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const users: User[] = []

        snapshot.forEach((doc) => {
          const user = mapFirestoreUser(doc)
          if (user) {
            users.push(user)
          }
        })

        callback(users)
      },
      (error) => {
        console.error('[UserService] Erro no listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )
}

/**
 * Busca usuário por ID
 */
export async function getUserById(userId: string): Promise<{
  user: User | null
  error: string | null
}> {
  try {
    const doc = await firebaseFirestore.collection(COLLECTION).doc(userId).get()

    const user = mapFirestoreUser(doc)

    if (!user) {
      return { user: null, error: 'Usuário não encontrado' }
    }

    return { user, error: null }
  } catch (error: any) {
    console.error('[UserService] Erro ao buscar usuário:', error)
    return { user: null, error: 'Erro ao buscar usuário' }
  }
}
