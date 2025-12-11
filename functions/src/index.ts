/**
 * Cloud Functions for Firebase
 * Custom Claims & Role Management
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Inicializar Firebase Admin
admin.initializeApp()

// ========================================
// EXPORTS
// ========================================

// Migration function (one-time use)
export { migrateEventsStatus } from './migration-add-status'

/**
 * Cloud Function: Sync Custom Claims quando role muda
 *
 * Trigger: Quando documento em users/{userId} é atualizado
 * Ação: Define custom claim 'role' no token do usuário
 *
 * IMPORTANTE: Após essa function rodar, usuário precisa fazer refresh do token:
 * await user.getIdToken(true)
 */
export const syncUserRole = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId
    const beforeData = change.before.data()
    const afterData = change.after.data()

    // Verificar se role mudou
    if (beforeData.role === afterData.role) {
      functions.logger.info(`Role não mudou para userId: ${userId}`)
      return null
    }

    const newRole = afterData.role

    // Validar role
    if (!['user', 'admin', 'superadmin'].includes(newRole)) {
      functions.logger.error(`Role inválido: ${newRole} para userId: ${userId}`)
      return null
    }

    try {
      // Definir custom claim no token
      await admin.auth().setCustomUserClaims(userId, {
        role: newRole,
      })

      functions.logger.info(`Custom claim atualizado: ${userId} → role: ${newRole}`)

      // Opcional: Atualizar campo no Firestore para indicar que claim foi atualizado
      await admin.firestore().collection('users').doc(userId).update({
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return null
    } catch (error) {
      functions.logger.error(`Erro ao atualizar custom claim para ${userId}:`, error)
      throw error
    }
  })

/**
 * Cloud Function: Define custom claim no primeiro login (onCreate)
 *
 * Trigger: Quando documento em users/{userId} é criado
 * Ação: Define custom claim 'role: user' por padrão
 */
export const setDefaultUserRole = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId
    const userData = snapshot.data()
    const role = userData.role || 'user'

    try {
      // Definir custom claim
      await admin.auth().setCustomUserClaims(userId, {
        role: role,
      })

      functions.logger.info(`Custom claim inicial definido: ${userId} → role: ${role}`)

      return null
    } catch (error) {
      functions.logger.error(`Erro ao definir custom claim inicial para ${userId}:`, error)
      throw error
    }
  })

/**
 * Cloud Function: Update Finished Events
 *
 * Atualiza automaticamente eventos para status 'finished' quando:
 * - Status atual é 'active' E
 * - Data do evento é <= 10 minutos no futuro OU já passou
 *
 * Execução: A cada 5 minutos
 * Timezone: America/Sao_Paulo (Brasília)
 */
export const updateFinishedEvents = functions
  .region('southamerica-east1')  // São Paulo (mais próximo do Brasil)
  .pubsub
  .schedule('*/5 * * * *')  // A cada 5 minutos
  .timeZone('America/Sao_Paulo')
  .onRun(async () => {
    try {
      const now = new Date()
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)

      functions.logger.info(`[updateFinishedEvents] Running at ${now.toISOString()}`)
      functions.logger.info(`[updateFinishedEvents] Looking for events before ${tenMinutesFromNow.toISOString()}`)

      // Busca eventos active que passaram OU estão <= 10 min
      const eventsRef = admin.firestore().collection('events')
      const snapshot = await eventsRef
        .where('status', '==', 'active')
        .where('date', '<', admin.firestore.Timestamp.fromDate(tenMinutesFromNow))
        .get()

      if (snapshot.empty) {
        functions.logger.info('[updateFinishedEvents] No events to update')
        return null
      }

      functions.logger.info(`[updateFinishedEvents] Found ${snapshot.size} events to mark as finished`)

      // Atualiza para finished em batch (mais eficiente)
      const batch = admin.firestore().batch()
      const eventIds: string[] = []

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'finished',
          finishedAt: admin.firestore.FieldValue.serverTimestamp()
        })
        eventIds.push(doc.id)
      })

      await batch.commit()

      functions.logger.info(`[updateFinishedEvents] ✅ Successfully updated ${snapshot.size} events:`, eventIds)

      return {
        success: true,
        updatedCount: snapshot.size,
        eventIds
      }
    } catch (error) {
      functions.logger.error('[updateFinishedEvents] ❌ Error:', error)
      throw error
    }
  })
