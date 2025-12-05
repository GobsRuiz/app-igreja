import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

/**
 * Categoria de eventos
 */
export interface Category {
  id: string
  name: string
  color: string // Tamagui color token (ex: "$blue10") ou hex
  icon: string // Nome do ícone Lucide (ex: "Calendar")
  createdAt: Date
  createdBy: string // userId
}

/**
 * Dados para criar categoria (sem id, sem createdAt)
 */
export interface CreateCategoryData {
  name: string
  color: string
  icon: string
}

/**
 * Dados para atualizar categoria
 */
export interface UpdateCategoryData {
  name?: string
  color?: string
  icon?: string
}

/**
 * Converte documento Firestore para Category
 */
export function mapFirestoreCategory(
  doc: FirebaseFirestoreTypes.DocumentSnapshot
): Category | null {
  if (!doc.exists) return null

  const data = doc.data()
  if (!data) return null

  return {
    id: doc.id,
    name: data.name,
    color: data.color,
    icon: data.icon,
    createdAt: data.createdAt?.toDate() || new Date(),
    createdBy: data.createdBy,
  }
}
