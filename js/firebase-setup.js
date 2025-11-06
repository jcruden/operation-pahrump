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
    saveUser
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
            role: 'Dani', 
            password: prompt('Enter password for Dani (or press Cancel for default):') || 'change_me_Dani',
            username: 'Dani'
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
 * Import riddles from JSON to Firestore
 */
export async function importRiddlesFromJSON() {
    try {
        const response = await fetch('data/riddles.json');
        const data = await response.json();
        const riddles = data.riddles || [];
        
        console.log(`Importing ${riddles.length} riddles...`);
        
        for (const riddle of riddles) {
            await addRiddle(riddle);
            console.log(`Imported riddle ${riddle.id}: ${riddle.riddle}`);
        }
        
        console.log('All riddles imported successfully');
    } catch (error) {
        console.error('Error importing riddles:', error);
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
