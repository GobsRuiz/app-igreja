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
export const syncUserRole = functions
  .region('southamerica-east1')
  .firestore
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
        _roleUpdatedAtMs: Date.now(),  // Timestamp em ms para cálculo client-side
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
export const setDefaultUserRole = functions
  .region('southamerica-east1')
  .firestore
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
 * Cloud Function: Create Event with Server-Side Validation
 *
 * Valida e cria evento usando horário do servidor (previne manipulação de data no client)
 *
 * Validações:
 * - Usuário autenticado e é admin
 * - Título obrigatório
 * - Categoria e local obrigatórios
 * - Data do evento deve ser no futuro (usa horário do servidor em America/Sao_Paulo)
 *
 * @param data - Dados do evento (CreateEventData)
 * @returns { eventId: string } ou erro
 */
export const createEventWithValidation = functions
  .region('southamerica-east1')
  .https
  .onCall(async (data, context) => {
    try {
      // 1. Validar autenticação
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuário não autenticado'
        )
      }

      // 2. Validar se é admin
      const userRole = context.auth.token.role
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Apenas administradores podem criar eventos'
        )
      }

      // 3. Validar campos obrigatórios
      const { title, description, date, categoryId, locationId, status } = data

      if (!title || typeof title !== 'string' || !title.trim()) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Título do evento é obrigatório'
        )
      }

      if (!categoryId || typeof categoryId !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Categoria é obrigatória'
        )
      }

      if (!locationId || typeof locationId !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Local é obrigatório'
        )
      }

      if (!date) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Data do evento é obrigatória'
        )
      }

      // 4. Validar data usando horário do servidor (América/São Paulo)
      const eventDate = new Date(date)
      const now = new Date()

      functions.logger.info(`[createEventWithValidation] Server time: ${now.toISOString()}`)
      functions.logger.info(`[createEventWithValidation] Event date: ${eventDate.toISOString()}`)

      if (eventDate <= now) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Evento não pode ser criado no passado. Verifique a data e hora.'
        )
      }

      // 5. Criar evento no Firestore
      const eventRef = await admin.firestore().collection('events').add({
        title: title.trim(),
        description: description?.trim() || '',
        date: admin.firestore.Timestamp.fromDate(eventDate),
        categoryId,
        locationId,
        status: status || 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      })

      functions.logger.info(`[createEventWithValidation] ✅ Event created: ${eventRef.id}`)

      return {
        success: true,
        eventId: eventRef.id,
      }
    } catch (error: any) {
      functions.logger.error('[createEventWithValidation] ❌ Error:', error)

      // Se já é HttpsError, relançar
      if (error instanceof functions.https.HttpsError) {
        throw error
      }

      // Erro genérico
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao criar evento'
      )
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

/**
 * Cloud Function: Create User (Admin Only)
 *
 * Cria um novo usuário usando Firebase Admin SDK sem afetar a sessão do admin logado
 *
 * Validações:
 * - Usuário autenticado e é admin/superadmin
 * - Email, password e displayName obrigatórios
 * - Email válido
 * - Password >= 6 caracteres
 *
 * @param data - { email: string, password: string, displayName: string, role: 'user' | 'admin' | 'superadmin' }
 * @returns { uid: string } ou erro
 */
export const createUser = functions
  .region('southamerica-east1')
  .https
  .onCall(async (data, context) => {
    try {
      // 1. Validar autenticação
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Usuário não autenticado'
        )
      }

      // 2. Validar se é admin
      const userRole = context.auth.token.role
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Apenas administradores podem criar usuários'
        )
      }

      // 3. Validar campos obrigatórios
      const { email, password, displayName, role } = data

      if (!email || typeof email !== 'string' || !email.trim()) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'E-mail é obrigatório'
        )
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'E-mail inválido'
        )
      }

      if (!password || typeof password !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Senha é obrigatória'
        )
      }

      if (password.length < 6) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'A senha deve ter no mínimo 6 caracteres'
        )
      }

      if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Nome é obrigatório'
        )
      }

      // 4. Validar role
      const validRoles = ['user', 'admin', 'superadmin']
      const userRoleToSet = role || 'user'

      if (!validRoles.includes(userRoleToSet)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Permissão inválida'
        )
      }

      functions.logger.info(`[createUser] Creating user with email: ${email.trim()}`)

      // 5. Criar usuário no Firebase Auth usando Admin SDK
      // IMPORTANTE: Não afeta a sessão do admin logado no client
      const userRecord = await admin.auth().createUser({
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        emailVerified: false,
      })

      functions.logger.info(`[createUser] ✅ User created in Auth: ${userRecord.uid}`)

      // 6. Criar documento no Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        email: email.trim(),
        displayName: displayName.trim(),
        role: userRoleToSet,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      functions.logger.info(`[createUser] ✅ User document created in Firestore: ${userRecord.uid}`)

      // 7. Definir custom claim inicial
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: userRoleToSet,
      })

      functions.logger.info(`[createUser] ✅ Custom claim set: ${userRecord.uid} → role: ${userRoleToSet}`)

      return {
        success: true,
        uid: userRecord.uid,
      }
    } catch (error: any) {
      functions.logger.error('[createUser] ❌ Error:', error)

      // Se já é HttpsError, relançar
      if (error instanceof functions.https.HttpsError) {
        throw error
      }

      // Tratar erros específicos do Firebase Auth
      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'Este e-mail já está cadastrado'
        )
      }

      if (error.code === 'auth/invalid-email') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'E-mail inválido'
        )
      }

      if (error.code === 'auth/invalid-password') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'A senha deve ter no mínimo 6 caracteres'
        )
      }

      // Erro genérico
      throw new functions.https.HttpsError(
        'internal',
        'Erro ao criar usuário'
      )
    }
  })
