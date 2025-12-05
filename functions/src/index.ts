/**
 * Cloud Functions for Firebase
 * Custom Claims & Role Management
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

// Inicializar Firebase Admin
admin.initializeApp()

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
