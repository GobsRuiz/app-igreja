import { firebaseFirestore, firebaseAuth } from '@core/config/firebase.config'
import firestore from '@react-native-firebase/firestore'
import type { Event, CreateEventData, UpdateEventData } from '../types/event.types'
import { mapFirestoreEvent } from '../types/event.types'

const COLLECTION = 'events'

/**
 * Cria um novo evento
 */
export async function createEvent(
  data: CreateEventData
): Promise<{ event: Event | null; error: string | null }> {
  try {
    // Validações
    if (!data.title.trim()) {
      return { event: null, error: 'Título do evento é obrigatório' }
    }

    if (!data.categoryId) {
      return { event: null, error: 'Categoria é obrigatória' }
    }

    if (!data.locationId) {
      return { event: null, error: 'Local é obrigatório' }
    }

    if (!data.date) {
      return { event: null, error: 'Data é obrigatória' }
    }

    const currentUser = firebaseAuth.currentUser
    if (!currentUser) {
      return { event: null, error: 'Usuário não autenticado' }
    }

    // Criar no Firestore
    const docRef = await firebaseFirestore.collection(COLLECTION).add({
      title: data.title.trim(),
      description: data.description?.trim() || '',
      date: firestore.Timestamp.fromDate(data.date),
      categoryId: data.categoryId,
      locationId: data.locationId,
      status: data.status || 'active',
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdBy: currentUser.uid,
    })

    // Buscar documento criado
    const doc = await docRef.get()
    const event = mapFirestoreEvent(doc)

    if (!event) {
      return { event: null, error: 'Erro ao criar evento' }
    }

    return { event, error: null }
  } catch (error: any) {
    console.error('[EventService] Erro ao criar evento:', error)
    return { event: null, error: 'Erro ao criar evento' }
  }
}

/**
 * Lista todos os eventos
 * Ordenado por data do evento (mais próximo primeiro)
 */
export async function listEvents(): Promise<{
  events: Event[]
  error: string | null
}> {
  try {
    const snapshot = await firebaseFirestore
      .collection(COLLECTION)
      .orderBy('date', 'asc')
      .get()

    const events: Event[] = []

    snapshot.forEach((doc) => {
      const event = mapFirestoreEvent(doc)
      if (event) {
        events.push(event)
      }
    })

    return { events, error: null }
  } catch (error: any) {
    console.error('[EventService] Erro ao listar eventos:', error)
    return { events: [], error: 'Erro ao carregar eventos' }
  }
}

/**
 * Atualiza um evento
 */
export async function updateEvent(
  eventId: string,
  data: UpdateEventData
): Promise<{ error: string | null }> {
  try {
    // Validações
    if (data.title !== undefined && !data.title.trim()) {
      return { error: 'Título não pode ser vazio' }
    }

    const updateData: any = {}

    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || ''
    }

    if (data.date !== undefined) {
      updateData.date = firestore.Timestamp.fromDate(data.date)
    }

    if (data.categoryId !== undefined) {
      updateData.categoryId = data.categoryId
    }

    if (data.locationId !== undefined) {
      updateData.locationId = data.locationId
    }

    if (data.status !== undefined) {
      updateData.status = data.status
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'Nenhum dado para atualizar' }
    }

    await firebaseFirestore.collection(COLLECTION).doc(eventId).update(updateData)

    return { error: null }
  } catch (error: any) {
    console.error('[EventService] Erro ao atualizar evento:', error)
    return { error: 'Erro ao atualizar evento' }
  }
}

/**
 * Deleta um evento
 */
export async function deleteEvent(eventId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(eventId).delete()
    return { error: null }
  } catch (error: any) {
    console.error('[EventService] Erro ao deletar evento:', error)
    return { error: 'Erro ao deletar evento' }
  }
}

/**
 * Listener em tempo real de eventos
 * Ordenado por data do evento (mais próximo primeiro)
 */
export function onEventsChange(
  callback: (events: Event[]) => void,
  onError?: (error: Error) => void
) {
  return firebaseFirestore
    .collection(COLLECTION)
    .orderBy('date', 'asc')
    .onSnapshot(
      (snapshot) => {
        const events: Event[] = []

        snapshot.forEach((doc) => {
          const event = mapFirestoreEvent(doc)
          if (event) {
            events.push(event)
          }
        })

        callback(events)
      },
      (error) => {
        console.error('[EventService] Erro no listener:', error)
        if (onError) {
          onError(error)
        }
      }
    )
}

/**
 * Marca evento como finalizado
 */
export async function markEventAsFinished(eventId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(eventId).update({
      status: 'finished',
      finishedAt: firestore.FieldValue.serverTimestamp(),
    })
    return { error: null }
  } catch (error: any) {
    console.error('[EventService] Erro ao marcar evento como finalizado:', error)
    return { error: 'Erro ao marcar evento como finalizado' }
  }
}

/**
 * Marca evento como cancelado
 */
export async function markEventAsCancelled(eventId: string): Promise<{ error: string | null }> {
  try {
    await firebaseFirestore.collection(COLLECTION).doc(eventId).update({
      status: 'cancelled',
    })
    return { error: null }
  } catch (error: any) {
    console.error('[EventService] Erro ao marcar evento como cancelado:', error)
    return { error: 'Erro ao marcar evento como cancelado' }
  }
}
