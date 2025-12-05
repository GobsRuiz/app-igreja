/**
 * Firestore Seed Script
 * Deletes old collections and seeds Brazilian states and cities
 *
 * Usage:
 *   npm run seed
 *
 * IMPORTANT: This will DELETE all existing data in states and cities collections
 */

import * as admin from 'firebase-admin'
import { states } from './data/states'
import { cities } from './data/cities'

// Initialize Firebase Admin SDK
// Option 1: Use service account file (recommended for production)
// Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
// const serviceAccount = require('../../firebase-service-account.json')
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// })

// Option 2: Use application default credentials (for local development with gcloud)
// Run: gcloud auth application-default login
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// })

// Get Project ID from google-services.json
const googleServices = require('../../google-services.json')
const projectId = googleServices.project_info.project_id

// Try service account file first (most reliable for scripts)
let initialized = false

try {
  const serviceAccount = require('../../firebase-service-account.json')
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: projectId,
  })
  console.log(`✅ Firebase Admin initialized with service account (Project: ${projectId})\n`)
  initialized = true
} catch (error) {
  // Service account file not found, try application default credentials
  console.log('⚠️  Service account file not found, trying application default credentials...\n')
}

if (!initialized) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId,
    })
    console.log(`✅ Firebase Admin initialized with application default credentials (Project: ${projectId})\n`)
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK')
    console.error('\nPlease download the service account JSON:')
    console.error('1. Go to: https://console.firebase.google.com/project/app-igreja-f82a7/settings/serviceaccounts/adminsdk')
    console.error('2. Click "Generate new private key"')
    console.error('3. Save as "firebase-service-account.json" in the project root')
    console.error('\nOr run: gcloud auth application-default login')
    process.exit(1)
  }
}

const db = admin.firestore()

/**
 * Delete all documents in a collection
 */
async function deleteCollection(
  collectionPath: string,
  batchSize: number = 500
): Promise<void> {
  const collectionRef = db.collection(collectionPath)
  const query = collectionRef.limit(batchSize)

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject)
  })
}

async function deleteQueryBatch(
  query: admin.firestore.Query,
  resolve: () => void,
  reject: (error: Error) => void
): Promise<void> {
  try {
    const snapshot = await query.get()

    if (snapshot.size === 0) {
      resolve()
      return
    }

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    // Recurse if there are more documents
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject)
    })
  } catch (error) {
    reject(error as Error)
  }
}

/**
 * Seed states collection
 */
async function seedStates(): Promise<void> {
  console.log('📍 Seeding states...')

  const batch = db.batch()
  let count = 0

  states.forEach((state) => {
    const stateRef = db.collection('states').doc(state.id)
    batch.set(stateRef, state)
    count++
  })

  await batch.commit()
  console.log(`✅ ${count} states seeded successfully`)
}

/**
 * Seed cities collection
 */
async function seedCities(): Promise<void> {
  console.log('🏙️  Seeding cities...')

  // Firestore batch has a limit of 500 operations
  const batchSize = 500
  let count = 0
  let batch = db.batch()
  let operationsInBatch = 0

  for (const city of cities) {
    const cityRef = db.collection('cities').doc(city.id)
    batch.set(cityRef, city)
    operationsInBatch++
    count++

    // Commit batch when reaching limit
    if (operationsInBatch >= batchSize) {
      await batch.commit()
      console.log(`  ⏳ Committed batch: ${count} cities so far...`)
      batch = db.batch()
      operationsInBatch = 0
    }
  }

  // Commit remaining operations
  if (operationsInBatch > 0) {
    await batch.commit()
  }

  console.log(`✅ ${count} cities seeded successfully`)
}

/**
 * Main seed function
 */
async function seed(): Promise<void> {
  try {
    console.log('🔥 Starting Firestore seed process...\n')

    // Step 1: Delete old collections
    console.log('🗑️  Deleting old collections...')
    await deleteCollection('states')
    console.log('✅ States collection deleted')

    await deleteCollection('cities')
    console.log('✅ Cities collection deleted\n')

    // Step 2: Seed new data
    await seedStates()
    await seedCities()

    // Summary
    console.log('\n🎉 Seed completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - States: ${states.length}`)
    console.log(`   - Cities: ${cities.length}`)
    console.log(`   - Total documents: ${states.length + cities.length}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error during seed:', error)
    process.exit(1)
  }
}

// Run seed
seed()
