/**
 * Node.js script to import riddles from riddles.json to Firestore
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key
 *    OR create a serviceAccountKey.json file in this directory
 * 3. Run: node import-riddles.js
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
 * Delete all riddles from Firestore
 */
async function deleteAllRiddles() {
    try {
        const riddlesRef = db.collection('riddles');
        const snapshot = await riddlesRef.get();
        
        console.log(`Deleting ${snapshot.size} existing riddles...`);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(doc.ref.delete());
        });
        
        await Promise.all(deletePromises);
        console.log('All riddles deleted successfully');
    } catch (error) {
        console.error('Error deleting riddles:', error);
        throw error;
    }
}

/**
 * Import riddles from riddles.json
 */
async function importRiddles() {
    try {
        // Read riddles.json
        const riddlesPath = path.join(__dirname, 'riddles.json');
        if (!fs.existsSync(riddlesPath)) {
            throw new Error(`riddles.json not found at ${riddlesPath}`);
        }
        
        const riddlesData = fs.readFileSync(riddlesPath, 'utf8');
        const riddles = JSON.parse(riddlesData);
        
        if (!Array.isArray(riddles)) {
            throw new Error('riddles.json must be an array');
        }
        
        // Delete all existing riddles first
        await deleteAllRiddles();
        
        // Import new riddles
        console.log(`Importing ${riddles.length} riddles from riddles.json...`);
        
        const riddlesRef = db.collection('riddles');
        const batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 500; // Firestore batch limit
        
        for (let i = 0; i < riddles.length; i++) {
            const riddle = riddles[i];
            const riddleData = {
                id: i + 1, // Use 1-based index as id
                riddle: riddle.riddle || '',
                hint: riddle.hint || '',
                answer: riddle.answer || '',
                instruction: riddle.instruction || '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = riddlesRef.doc(); // Auto-generate document ID
            batch.set(docRef, riddleData);
            batchCount++;
            
            // Commit batch if we reach the limit
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                console.log(`Imported batch of ${batchCount} riddles...`);
                batchCount = 0;
            }
        }
        
        // Commit remaining riddles
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Imported final batch of ${batchCount} riddles...`);
        }
        
        console.log(`\n✅ Successfully imported ${riddles.length} riddles!`);
        console.log(`Riddles are now in Firestore with IDs 1-${riddles.length}`);
    } catch (error) {
        console.error('❌ Error importing riddles:', error);
        process.exit(1);
    }
}

// Run the import
importRiddles()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

