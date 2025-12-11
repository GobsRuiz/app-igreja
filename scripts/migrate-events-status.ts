/**
 * Migration Script: Add status field to existing events
 *
 * Run this script ONCE to add status: 'active' to all existing events in Firestore
 * that don't have a status field yet.
 *
 * HOW TO RUN:
 * 1. Make sure you have Firebase Admin SDK configured
 * 2. Run: npx ts-node scripts/migrate-events-status.ts
 *
 * SAFETY:
 * - Only updates events that don't have status field
 * - Uses batch operations for efficiency
 * - Logs all changes
 * - Can be run multiple times safely (idempotent)
 */

import * as admin from 'firebase-admin'

// Initialize Firebase Admin (adjust path to your service account key if needed)
// For production, use environment variables or proper configuration
admin.initializeApp({
  // credential: admin.credential.cert('path/to/serviceAccountKey.json'),
  // Or use default credentials if running in Firebase environment
})

const db = admin.firestore()

async function migrateEventsStatus() {
  console.log('[Migration] Starting events status migration...')

  try {
    // Get all events without status field
    const eventsRef = db.collection('events')
    const snapshot = await eventsRef.get()

    if (snapshot.empty) {
      console.log('[Migration] No events found in database')
      return
    }

    console.log(`[Migration] Found ${snapshot.size} total events`)

    // Filter events that don't have status
    const eventsToUpdate: admin.firestore.DocumentSnapshot[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (!data.status) {
        eventsToUpdate.push(doc)
      }
    })

    if (eventsToUpdate.length === 0) {
      console.log('[Migration] All events already have status field. Nothing to update.')
      return
    }

    console.log(`[Migration] Found ${eventsToUpdate.length} events without status field`)
    console.log('[Migration] Updating events to status: "active"...')

    // Update in batches (Firestore batch limit is 500)
    const batchSize = 500
    const batches: admin.firestore.WriteBatch[] = []
    let currentBatch = db.batch()
    let operationCount = 0
    let batchCount = 0

    eventsToUpdate.forEach((doc, index) => {
      currentBatch.update(doc.ref, {
        status: 'active',
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      operationCount++

      // If batch is full or last item, commit batch
      if (operationCount === batchSize || index === eventsToUpdate.length - 1) {
        batches.push(currentBatch)
        batchCount++
        console.log(`[Migration] Prepared batch ${batchCount} with ${operationCount} operations`)

        // Start new batch if not last item
        if (index !== eventsToUpdate.length - 1) {
          currentBatch = db.batch()
          operationCount = 0
        }
      }
    })

    // Commit all batches
    console.log(`[Migration] Committing ${batches.length} batch(es)...`)

    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit()
      console.log(`[Migration] ✅ Batch ${i + 1}/${batches.length} committed successfully`)
    }

    console.log(`[Migration] ✅ Successfully migrated ${eventsToUpdate.length} events`)
    console.log('[Migration] All events now have status: "active"')

    // Log sample of updated events
    console.log('\n[Migration] Sample of updated events:')
    eventsToUpdate.slice(0, 5).forEach((doc) => {
      const data = doc.data()
      console.log(`  - ${doc.id}: "${data?.title}"`)
    })

  } catch (error) {
    console.error('[Migration] ❌ Error during migration:', error)
    throw error
  }
}

// Run migration
migrateEventsStatus()
  .then(() => {
    console.log('\n[Migration] Migration completed successfully! 🎉')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n[Migration] Migration failed:', error)
    process.exit(1)
  })
