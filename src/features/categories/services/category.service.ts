import { firebaseFirestore, firebaseAuth } from '@core/config/firebase.config'
import firestore from '@react-native-firebase/firestore'
import type {
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types/category.types'
import { mapFirestoreCategory } from '../types/category.types'

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
    console.error('[CategoryService] Erro ao criar categoria:', error)
    return { category: null, error: 'Erro ao criar categoria' }
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
      .orderBy('name', 'asc')
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
    console.error('[CategoryService] Erro ao listar categorias:', error)
    return { categories: [], error: 'Erro ao carregar categorias' }
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
    console.error('[CategoryService] Erro ao atualizar categoria:', error)
    return { error: 'Erro ao atualizar categoria' }
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
    console.error('[CategoryService] Erro ao deletar categoria:', error)
    return { error: 'Erro ao deletar categoria' }
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
    .orderBy('name', 'asc')
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
        console.error('[CategoryService] Erro no listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )
}
