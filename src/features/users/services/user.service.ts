import { firebaseFirestore, firebaseAuth } from '@core/config/firebase.config'
import firestore from '@react-native-firebase/firestore'
import type { User, CreateUserData, UpdateUserData } from '../types/user.types'
import { mapFirestoreUser } from '../types/user.types'

const COLLECTION = 'users'

/**
 * Validar formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validar senha (mínimo 6 caracteres)
 */
function isValidPassword(password: string): boolean {
  return password.length >= 6
}

/**
 * Cria um novo usuário (Admin apenas)
 */
export async function createUser(
  data: CreateUserData
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Validações
    if (!data.email.trim()) {
      return { user: null, error: 'E-mail é obrigatório' }
    }

    if (!isValidEmail(data.email)) {
      return { user: null, error: 'E-mail inválido' }
    }

    if (!data.password) {
      return { user: null, error: 'Senha é obrigatória' }
    }

    if (!isValidPassword(data.password)) {
      return { user: null, error: 'A senha deve ter no mínimo 6 caracteres' }
    }

    // Criar no Firebase Auth
    const userCredential = await firebaseAuth.createUserWithEmailAndPassword(
      data.email.trim(),
      data.password
    )

    const userId = userCredential.user.uid

    // Criar documento no Firestore
    const userData: any = {
      email: data.email.trim(),
      role: data.role || 'user',
      createdAt: firestore.FieldValue.serverTimestamp(),
    }

    if (data.displayName?.trim()) {
      userData.displayName = data.displayName.trim()
    }

    if (data.phone?.trim()) {
      userData.phone = data.phone.trim()
    }

    await firebaseFirestore.collection(COLLECTION).doc(userId).set(userData)

    // Buscar documento criado
    const doc = await firebaseFirestore.collection(COLLECTION).doc(userId).get()
    const user = mapFirestoreUser(doc)

    if (!user) {
      return { user: null, error: 'Erro ao criar usuário' }
    }

    return { user, error: null }
  } catch (error: any) {
    console.error('[UserService] Erro ao criar usuário:', error)

    // Tratar erros específicos do Firebase Auth
    if (error.code === 'auth/email-already-in-use') {
      return { user: null, error: 'Este e-mail já está cadastrado' }
    }

    if (error.code === 'auth/invalid-email') {
      return { user: null, error: 'E-mail inválido' }
    }

    if (error.code === 'auth/weak-password') {
      return { user: null, error: 'A senha deve ter no mínimo 6 caracteres' }
    }

    return { user: null, error: 'Erro ao criar usuário' }
  }
}

/**
 * Atualiza um usuário existente (Admin apenas)
 */
export async function updateUser(
  userId: string,
  data: UpdateUserData
): Promise<{ error: string | null }> {
  try {
    const updateData: any = {}

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim() || null
    }

    if (data.phone !== undefined) {
      updateData.phone = data.phone.trim() || null
    }

    if (data.role !== undefined) {
      updateData.role = data.role
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'Nenhum dado para atualizar' }
    }

    await firebaseFirestore.collection(COLLECTION).doc(userId).update(updateData)

    return { error: null }
  } catch (error: any) {
    console.error('[UserService] Erro ao atualizar usuário:', error)
    return { error: 'Erro ao atualizar usuário' }
  }
}

/**
 * Deleta um usuário (apenas do Firestore, não do Auth por segurança)
 */
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(userId).delete()
    return { error: null }
  } catch (error: any) {
    console.error('[UserService] Erro ao deletar usuário:', error)
    return { error: 'Erro ao deletar usuário' }
  }
}

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
