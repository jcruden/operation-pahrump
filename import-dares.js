/**
 * Node.js script to import dares from dares.json to Firestore
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key
 *    OR create a serviceAccountKey.json file in this directory
 * 3. Run: node import-dares.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// Option 1: Use service account key file
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    // Option 2: Use environment variable or default credentials
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (error) {
        console.error('Error initializing Firebase Admin:');
        console.error('Please either:');
        console.error('1. Create a serviceAccountKey.json file with your Firebase service account credentials');
        console.error('2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
        console.error('3. Or use gcloud auth application-default login');
        process.exit(1);
    }
}

const db = admin.firestore();

/**
 * Delete all dares from Firestore
 */
async function deleteAllDares() {
    try {
        const daresRef = db.collection('dares');
        const snapshot = await daresRef.get();
        
        console.log(`Deleting ${snapshot.size} existing dares...`);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(doc.ref.delete());
        });
        
        await Promise.all(deletePromises);
        console.log('All dares deleted successfully');
    } catch (error) {
        console.error('Error deleting dares:', error);
        throw error;
    }
}

/**
 * Import dares from dares.json
 */
async function importDares() {
    try {
        // Read dares.json
        const daresPath = path.join(__dirname, 'dares.json');
        if (!fs.existsSync(daresPath)) {
            throw new Error(`dares.json not found at ${daresPath}`);
        }
        
        const daresData = fs.readFileSync(daresPath, 'utf8');
        const dares = JSON.parse(daresData);
        
        if (!Array.isArray(dares)) {
            throw new Error('dares.json must be an array');
        }
        
        // Delete all existing dares first
        await deleteAllDares();
        
        // Import new dares
        console.log(`Importing ${dares.length} dares from dares.json...`);
        
        const daresRef = db.collection('dares');
        const batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 500; // Firestore batch limit
        
        for (let i = 0; i < dares.length; i++) {
            const dareText = dares[i];
            
            // Handle both string format and object format
            let challenge, id;
            if (typeof dareText === 'string') {
                challenge = dareText;
                id = i + 1; // Use 1-based index as id
            } else if (typeof dareText === 'object' && dareText.challenge) {
                challenge = dareText.challenge;
                id = dareText.id || (i + 1);
            } else {
                console.warn(`Skipping invalid dare at index ${i}:`, dareText);
                continue;
            }
            
            const dareData = {
                id: id,
                challenge: challenge,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = daresRef.doc(); // Auto-generate document ID
            batch.set(docRef, dareData);
            batchCount++;
            
            // Commit batch if we reach the limit
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                console.log(`Imported batch of ${batchCount} dares...`);
                batchCount = 0;
            }
        }
        
        // Commit remaining dares
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Imported final batch of ${batchCount} dares...`);
        }
        
        console.log(`\n✅ Successfully imported ${dares.length} dares!`);
        console.log(`Dares are now in Firestore with IDs 1-${dares.length}`);
    } catch (error) {
        console.error('❌ Error importing dares:', error);
        process.exit(1);
    }
}

// Run the import
importDares()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

