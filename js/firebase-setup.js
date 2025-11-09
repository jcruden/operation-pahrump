/**
 * Firebase setup script - Run this in browser console to initialize Firestore
 * 
 * Usage:
 * 1. Open index.html in browser (via local server)
 * 2. Open browser console (F12)
 * 3. Import and run setup functions
 * 
 * IMPORTANT: Set secure passwords for all users after setup!
 */

import { 
    updateAdminState, 
    addDare,
    addRiddle,
    saveUser,
    getAllRiddles,
    deleteRiddle
} from './firebase-service.js';

/**
 * Initialize admin state
 */
export async function initAdminState() {
    await updateAdminState({ unlocked: false });
    console.log('Admin state initialized');
}

/**
 * Initialize users with secure passwords
 * IMPORTANT: Change these passwords after setup!
 */
export async function initUsers() {
    const users = [
        { 
            role: 'Zoe', 
            password: prompt('Enter password for Zoe (or press Cancel for default):') || 'change_me_Zoe',
            username: 'Zoe'
        },
        { 
            role: 'JT', 
            password: prompt('Enter password for JT (or press Cancel for default):') || 'change_me_JT',
            username: 'JT'
        },
        { 
            role: 'Alana', 
            password: prompt('Enter password for Alana (or press Cancel for default):') || 'change_me_Alana',
            username: 'Alana'
        },
        { 
            role: 'admin', 
            password: prompt('Enter password for admin (REQUIRED):') || prompt('Admin password required! Enter admin password:') || 'change_me_admin',
            username: 'admin'
        }
    ];
    
    for (const user of users) {
        await saveUser(user.role, {
            role: user.role,
            username: user.username,
            password: user.password,
            active: true
        });
        console.log(`User ${user.role} initialized`);
    }
    
    console.log('All users initialized');
    console.log('⚠️ IMPORTANT: Change default passwords using admin panel: user pass <id> <newpassword>');
}

/**
 * Import dares from JSON to Firestore
 */
export async function importDaresFromJSON() {
    try {
        const response = await fetch('data/dares.json');
        const data = await response.json();
        const dares = data.dares || [];
        
        console.log(`Importing ${dares.length} dares...`);
        
        for (const dare of dares) {
            await addDare(dare);
            console.log(`Imported: ${dare.challenge || dare.id}`);
        }
        
        console.log('All dares imported successfully');
    } catch (error) {
        console.error('Error importing dares:', error);
    }
}

/**
 * Delete all riddles from Firestore
 */
export async function deleteAllRiddles() {
    try {
        const riddles = await getAllRiddles();
        console.log(`Deleting ${riddles.length} existing riddles...`);
        
        for (const riddle of riddles) {
            await deleteRiddle(riddle.id);
            console.log(`Deleted riddle ${riddle.id}`);
        }
        
        console.log('All riddles deleted successfully');
    } catch (error) {
        console.error('Error deleting riddles:', error);
        throw error;
    }
}

/**
 * Import riddles from riddles.json to Firestore (deletes existing first)
 */
export async function importRiddlesFromJSON() {
    try {
        // First, delete all existing riddles
        await deleteAllRiddles();
        
        // Then import from riddles.json
        const response = await fetch('riddles.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch riddles.json: ${response.statusText}`);
        }
        const riddles = await response.json();
        
        if (!Array.isArray(riddles)) {
            throw new Error('riddles.json must be an array');
        }
        
        console.log(`Importing ${riddles.length} riddles from riddles.json...`);
        
        for (let i = 0; i < riddles.length; i++) {
            const riddle = riddles[i];
            const riddleData = {
                id: i + 1, // Use 1-based index as id
                riddle: riddle.riddle || '',
                hint: riddle.hint || '',
                answer: riddle.answer || '',
                instruction: riddle.instruction || ''
            };
            await addRiddle(riddleData);
            console.log(`Imported riddle ${i + 1}: ${riddleData.riddle.substring(0, 50)}...`);
        }
        
        console.log('All riddles imported successfully');
    } catch (error) {
        console.error('Error importing riddles:', error);
        throw error;
    }
}

/**
 * Run complete setup (admin state + users + dares + riddles import)
 */
export async function setupFirebase() {
    console.log('Starting Firebase setup...');
    await initAdminState();
    await initUsers();
    await importDaresFromJSON();
    await importRiddlesFromJSON();
    console.log('Firebase setup complete!');
    console.log('⚠️ IMPORTANT: Change passwords using admin panel!');
}
