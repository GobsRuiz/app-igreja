import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'
import type { Role } from '@shared/constants/permissions'

/**
 * Usuário do sistema
 */
export interface User {
  id: string
  email: string
  displayName?: string
  photoUrl?: string
  phone?: string
  role: Role
  createdAt: Date
}

/**
 * Dados para criar usuário (com senha para Auth)
 */
export interface CreateUserData {
  email: string
  password: string
  displayName?: string
  phone?: string
  role: Role
}

/**
 * Dados para atualizar usuário (sem email/senha)
 */
export interface UpdateUserData {
  displayName?: string
  phone?: string
  role?: Role
}

/**
 * Converte documento Firestore para User
 */
export function mapFirestoreUser(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): User | null {
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    email: data.email,
    displayName: data.displayName,
    photoUrl: data.photoUrl,
    phone: data.phone,
    role: data.role || 'user',
    createdAt: data.createdAt?.toDate() || new Date(),
  }
}
