import { firebaseFirestore, firebaseAuth } from '@core/config/firebase.config'
import firestore from '@react-native-firebase/firestore'
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types/category.types'
import { mapFirestoreCategory } from '../types/category.types'
import { ErrorHandler } from '@shared/services'

const COLLECTION = 'categories'

/**
 * Cria uma nova categoria
 */
export async function createCategory(
  data: CreateCategoryData
): Promise<{ category: Category | null; error: string | null }> {
  try {
    // Validações
    if (!data.name.trim()) {
      return { category: null, error: 'Nome da categoria é obrigatório' }
    }

    if (!data.color) {
      return { category: null, error: 'Cor da categoria é obrigatória' }
    }

    if (!data.icon) {
      return { category: null, error: 'Ícone da categoria é obrigatório' }
    }

    const currentUser = firebaseAuth.currentUser
    if (!currentUser) {
      return { category: null, error: 'Usuário não autenticado' }
    }

    // Criar no Firestore
    const docRef = await firebaseFirestore.collection(COLLECTION).add({
      name: data.name.trim(),
      color: data.color,
      icon: data.icon,
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser.uid,
    })

    // Buscar documento criado
    const doc = await docRef.get()
    const category = mapFirestoreCategory(doc)

    if (!category) {
      return { category: null, error: 'Erro ao criar categoria' }
    }

    return { category, error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao criar categoria')
    return { category: null, error: errorMessage }
  }
}

/**
 * Lista todas as categorias
 */
export async function listCategories(): Promise<{
  categories: Category[]
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get()

    const categories: Category[] = []

    snapshot.forEach((doc) => {
      const category = mapFirestoreCategory(doc)
      if (category) {
        categories.push(category)
      }
    })

    return { categories, error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao carregar categorias')
    return { categories: [], error: errorMessage }
  }
}

/**
 * Atualiza uma categoria
 */
export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryData
): Promise<{ error: string | null }> {
  try {
    // Validações
    if (data.name !== undefined && !data.name.trim()) {
      return { error: 'Nome da categoria não pode ser vazio' }
    }

    const updateData: any = {}

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }

    if (data.color !== undefined) {
      updateData.color = data.color
    }

    if (data.icon !== undefined) {
      updateData.icon = data.icon
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'Nenhum dado para atualizar' }
    }

    await firebaseFirestore.collection(COLLECTION).doc(categoryId).update(updateData)

    return { error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao atualizar categoria')
    return { error: errorMessage }
  }
}

/**
 * Verifica se uma categoria está sendo usada por algum evento
 * Otimizado: para no primeiro evento encontrado
 */
export async function checkCategoryInUse(categoryId: string): Promise<{
  inUse: boolean
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection('events')
      .where('categoryId', '==', categoryId)
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
 * Deleta uma categoria
 */
export async function deleteCategory(categoryId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(categoryId).delete()
    return { error: null }
  } catch (error: any) {
    const errorMessage = ErrorHandler.parseFirebaseError(error, 'Erro ao deletar categoria')
    return { error: errorMessage }
  }
}

/**
 * Listener em tempo real de categorias
 */
export function onCategoriesChange(
  callback: (categories: Category[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const categories: Category[] = []

        snapshot.forEach((doc) => {
          const category = mapFirestoreCategory(doc)
          if (category) {
            categories.push(category)
          }
        })

        callback(categories)
      },
      (error) => {
        if (onError) {
          onError(error)
        }
      }
    )
}
