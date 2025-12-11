/**
 * Cloud Function: One-time migration to add status to existing events
 *
 * HOW TO USE:
 * 1. Deploy this function: firebase deploy --only functions:migrateEventsStatus
 * 2. Run via Firebase Console or CLI: firebase functions:call migrateEventsStatus
 * 3. Or run via HTTP: https://REGION-PROJECT_ID.cloudfunctions.net/migrateEventsStatus
 *
 * SAFETY:
 * - Only updates events without status field
 * - Idempotent (can run multiple times safely)
 * - Returns count of updated events
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const migrateEventsStatus = functions
  .region('southamerica-east1')
  .https.onCall(async (data, context) => {
    // Security: Only admins can run migrations
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to run migrations'
      )
    }

    const userRole = context.auth.token.role
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can run migrations'
      )
    }

    try {
      functions.logger.info('[Migration] Starting events status migration...')

      // Get all events
      const eventsRef = admin.firestore().collection('events')
      const snapshot = await eventsRef.get()

      if (snapshot.empty) {
        functions.logger.info('[Migration] No events found')
        return {
          success: true,
          message: 'No events found in database',
          updatedCount: 0,
        }
      }

      // Filter events without status
      const eventsToUpdate: FirebaseFirestore.DocumentSnapshot[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (!data.status) {
          eventsToUpdate.push(doc)
        }
      })

      if (eventsToUpdate.length === 0) {
        functions.logger.info('[Migration] All events already have status')
        return {
          success: true,
          message: 'All events already have status field',
          updatedCount: 0,
        }
      }

      functions.logger.info(`[Migration] Found ${eventsToUpdate.length} events to update`)

      // Update in batch
      const batch = admin.firestore().batch()
      eventsToUpdate.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'active',
          migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })

      await batch.commit()

      functions.logger.info(`[Migration] ✅ Updated ${eventsToUpdate.length} events`)

      return {
        success: true,
        message: `Successfully migrated ${eventsToUpdate.length} events to status: 'active'`,
        updatedCount: eventsToUpdate.length,
        eventIds: eventsToUpdate.map((doc) => doc.id),
      }
    } catch (error) {
      functions.logger.error('[Migration] ❌ Error:', error)
      throw new functions.https.HttpsError('internal', 'Migration failed', error)
    }
  })
