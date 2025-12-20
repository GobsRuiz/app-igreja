import { firebaseFirestore, firebaseFunctions } from '@core/config/firebase.config'
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
 * IMPORTANTE: Usa Cloud Function para não afetar a sessão do admin logado
 */
export async function createUser(
  data: CreateUserData
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Validações client-side (segurança em camadas)
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

    if (!data.displayName.trim()) {
      return { user: null, error: 'Nome é obrigatório' }
    }

    // Chamar Cloud Function (não afeta sessão atual)
    const createUserFunction = firebaseFunctions.httpsCallable('createUser')

    const result = await createUserFunction({
      email: data.email.trim(),
      password: data.password,
      displayName: data.displayName.trim(),
      role: data.role || 'user',
    })

    const userId = result.data.uid

    if (!userId) {
      return { user: null, error: 'Erro ao criar usuário' }
    }

    // Buscar documento criado
    const doc = await firebaseFirestore.collection(COLLECTION).doc(userId).get()
    const user = mapFirestoreUser(doc)

    if (!user) {
      return { user: null, error: 'Erro ao criar usuário' }
    }

    return { user, error: null }
  } catch (error: any) {
    // Tratar erros da Cloud Function
    if (error.code === 'already-exists') {
      return { user: null, error: 'Este e-mail já está cadastrado' }
    }

    if (error.code === 'invalid-argument') {
      return { user: null, error: error.message || 'Dados inválidos' }
    }

    if (error.code === 'permission-denied') {
      return { user: null, error: 'Você não tem permissão para criar usuários' }
    }

    if (error.code === 'unauthenticated') {
      return { user: null, error: 'Você precisa estar autenticado' }
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

    if (data.role !== undefined) {
      updateData.role = data.role
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'Nenhum dado para atualizar' }
    }

    await firebaseFirestore.collection(COLLECTION).doc(userId).update(updateData)

    return { error: null }
  } catch (error: any) {
    return { error: 'Erro ao atualizar usuário' }
  }
}

/**
 * Verifica se um usuário pode ser deletado
 * Regras:
 * 1. Não pode deletar a si mesmo (currentUserId)
 * 2. Não pode deletar o último superadmin do sistema
 */
export async function checkCanDeleteUser(
  userId: string,
  currentUserId: string
): Promise<{ canDelete: boolean; error: string | null }> {
  try {
    // Regra 1: Não pode deletar a si mesmo
    if (userId === currentUserId) {
      return {
        canDelete: false,
        error: 'Você não pode deletar sua própria conta',
      }
    }

    // Buscar o usuário a ser deletado
    const userDoc = await firebaseFirestore.collection(COLLECTION).doc(userId).get()

    if (!userDoc.exists) {
      return { canDelete: false, error: 'Usuário não encontrado' }
    }

    const userData = userDoc.data()
    const userRole = userData?.role

    // Regra 2: Se é superadmin, verificar se é o último
    if (userRole === 'superadmin') {
      const superadminsSnapshot = await firebaseFirestore
        .collection(COLLECTION)
        .where('role', '==', 'superadmin')
        .get()

      const superadminCount = superadminsSnapshot.size

      if (superadminCount <= 1) {
        return {
          canDelete: false,
          error: 'Não é possível deletar o último Super Admin do sistema',
        }
      }
    }

    return { canDelete: true, error: null }
  } catch (error: any) {
    return { canDelete: false, error: 'Erro ao verificar permissões de deleção' }
  }
}

/**
 * Deleta um usuário (apenas do Firestore, não do Auth por segurança)
 * IMPORTANTE: Use checkCanDeleteUser antes de chamar esta função
 */
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(userId).delete()
    return { error: null }
  } catch (error: any) {
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
    return { user: null, error: 'Erro ao buscar usuário' }
  }
}
