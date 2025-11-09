/**
 * Node.js script to import clues from riddles.json to Firestore
 * 
 * Usage:
 * 1. Install dependencies: npm install firebase-admin
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key
 *    OR create a serviceAccountKey.json file in this directory
 * 3. Run: node import-clues.js
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

// Map old player names to new names
const playerNameMap = {
    'player1': 'Zoe',
    'player2': 'JT',
    'player3': 'Alana'
};

/**
 * Delete all clues from Firestore
 */
async function deleteAllClues() {
    try {
        const cluesRef = db.collection('clues');
        const snapshot = await cluesRef.get();
        
        console.log(`Deleting ${snapshot.size} existing clues...`);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(doc.ref.delete());
        });
        
        await Promise.all(deletePromises);
        console.log('All clues deleted successfully');
    } catch (error) {
        console.error('Error deleting clues:', error);
        throw error;
    }
}

/**
 * Import clues from riddles.json
 */
async function importClues() {
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
        
        // Delete all existing clues first
        await deleteAllClues();
        
        // Import new clues
        console.log(`Importing ${riddles.length} clues from riddles.json...`);
        
        const cluesRef = db.collection('clues');
        const batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 500; // Firestore batch limit
        
        // Ordering logic:
        // - Consecutive person-specific clues (with assignedTo) share the same order
        // - Global clues (no assignedTo) each get their own sequential order
        // - When transitioning between types, increment order
        let currentOrder = 1;
        let lastHadAssignedTo = null; // null means we haven't processed any yet
        
        for (let i = 0; i < riddles.length; i++) {
            const riddle = riddles[i];
            const hasAssignedTo = riddle.assignedTo && (typeof riddle.assignedTo === 'string' || (Array.isArray(riddle.assignedTo) && riddle.assignedTo.length > 0));
            
            // Check if we're transitioning between person-specific and global (or vice versa)
            if (i > 0 && lastHadAssignedTo !== null && hasAssignedTo !== lastHadAssignedTo) {
                // Transitioning between types - increment order
                currentOrder++;
            }
            
            let assignedTo = [];
            let clueType = 'global';
            
            if (hasAssignedTo) {
                clueType = 'person-specific';
                // Map old player names to new names
                if (typeof riddle.assignedTo === 'string') {
                    const mappedName = playerNameMap[riddle.assignedTo] || riddle.assignedTo;
                    assignedTo = [mappedName];
                } else if (Array.isArray(riddle.assignedTo)) {
                    assignedTo = riddle.assignedTo.map(name => playerNameMap[name] || name);
                }
            }
            
            const clueData = {
                order: currentOrder,
                type: clueType,
                riddle: riddle.riddle || '',
                hint: riddle.hint || '',
                answer: riddle.answer || '',
                instruction: riddle.instruction || '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            if (clueType === 'person-specific') {
                clueData.assignedTo = assignedTo;
            }
            
            const docRef = cluesRef.doc();
            batch.set(docRef, clueData);
            batchCount++;
            
            const typeLabel = clueType === 'global' ? 'Global' : `Person-specific (${assignedTo.join(', ')})`;
            console.log(`  Order ${currentOrder}: ${typeLabel} - ${clueData.riddle.substring(0, 50)}...`);
            
            // Update state for next iteration
            lastHadAssignedTo = hasAssignedTo;
            
            // For global clues, increment order for the next clue (each global gets its own order)
            // For person-specific clues, keep the same order until we transition away
            if (!hasAssignedTo) {
                currentOrder++;
            }
            
            // Commit batch if we reach the limit
            if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                console.log(`Imported batch of ${batchCount} clues...`);
                batchCount = 0;
            }
        }
        
        // Commit remaining clues
        if (batchCount > 0) {
            await batch.commit();
            console.log(`Imported final batch of ${batchCount} clues...`);
        }
        
        console.log(`\n✅ Successfully imported ${riddles.length} clues!`);
        console.log(`Clues are now in Firestore, ordered by position in riddles.json`);
    } catch (error) {
        console.error('❌ Error importing clues:', error);
        process.exit(1);
    }
}

// Run the import
importClues()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

