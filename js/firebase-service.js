/**
 * Firebase service module for operation pahrump.
 * Handles Firestore operations for dares management only.
 * Authentication and points use localStorage.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    updateDoc,
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Initialize Firebase
let app, db;

// Firebase configuration - public API keys (security comes from Firestore rules)
const firebaseConfig = {
    apiKey: "AIzaSyDRmRxzBvc6zeoljr27OLZQq4z6XTI94Do",
    authDomain: "operation-water-rock.firebaseapp.com",
    projectId: "operation-water-rock",
    storageBucket: "operation-water-rock.firebasestorage.app",
    messagingSenderId: "484182731019",
    appId: "1:484182731019:web:5afe081132f4fcb16fda0e",
    measurementId: "G-9DFP9Z4K03"
};

// Initialize Firebase
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization failed:", error);
    db = null;
    app = null;
}

/**
 * Validate password - checks Firestore first, then localStorage fallback
 * SECURITY: Default passwords removed - must be set in Firestore
 */
export async function validatePassword(password) {
    // First, try Firestore (secure)
    if (db) {
        try {
            const usersRef = collection(db, "users");
            const usersSnapshot = await getDocs(usersRef);
            
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                if (userData.password === password && userData.active !== false) {
                    return {
                        role: userData.role,
                        userId: userDoc.id,
                        username: userData.username || userData.role
                    };
                }
            }
        } catch (error) {
            console.error("Error validating password from Firestore:", error);
        }
    }
    
    // Fallback to localStorage (for development/testing)
    try {
        const usersStr = localStorage.getItem('users');
        if (usersStr) {
            const users = JSON.parse(usersStr);
            for (const [role, userData] of Object.entries(users)) {
                if (userData.password === password && userData.active !== false) {
                    return {
                        role: role,
                        userId: role,
                        username: userData.username || role
                    };
                }
            }
        }
    } catch (error) {
        console.error("Error reading users from localStorage:", error);
    }
    
    // No default passwords - authentication fails
    return null;
}

/**
 * Get all riddles from Firestore
 */
export async function getAllRiddles() {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const riddlesRef = collection(db, "riddles");
        const q = query(riddlesRef, orderBy("id", "asc"));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading riddles:", error);
        throw error;
    }
}

/**
 * Subscribe to riddles changes (real-time)
 */
export function subscribeToRiddles(callback) {
    if (!db) {
        console.warn("Firebase not configured - subscribeToRiddles not available");
        callback([]);
        return () => {}; // Return no-op unsubscribe function
    }
    
    const riddlesRef = collection(db, "riddles");
    const q = query(riddlesRef, orderBy("id", "asc"));
    
    return onSnapshot(q, (snapshot) => {
        const riddles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(riddles);
    }, (error) => {
        console.error("Error subscribing to riddles:", error);
        callback([]);
    });
}

/**
 * Add a new riddle to Firestore
 */
export async function addRiddle(riddleData) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const riddlesRef = collection(db, "riddles");
        const docRef = await addDoc(riddlesRef, {
            ...riddleData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding riddle:", error);
        throw error;
    }
}

/**
 * Update a riddle in Firestore
 */
export async function updateRiddle(riddleId, updates) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const riddleRef = doc(db, "riddles", riddleId);
        await updateDoc(riddleRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating riddle:", error);
        throw error;
    }
}

/**
 * Delete a riddle from Firestore
 */
export async function deleteRiddle(riddleId) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const riddleRef = doc(db, "riddles", riddleId);
        await deleteDoc(riddleRef);
        return true;
    } catch (error) {
        console.error("Error deleting riddle:", error);
        throw error;
    }
}

/**
 * Get all dares from Firestore
 */
export async function getAllDares() {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const daresRef = collection(db, "dares");
        const q = query(daresRef, orderBy("id", "asc"));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading dares:", error);
        throw error;
    }
}

/**
 * Subscribe to dares changes (real-time)
 */
export function subscribeToDares(callback) {
    if (!db) {
        console.warn("Firebase not configured - subscribeToDares not available");
        callback([]);
        return () => {}; // Return no-op unsubscribe function
    }
    
    const daresRef = collection(db, "dares");
    const q = query(daresRef, orderBy("id", "asc"));
    
    return onSnapshot(q, (snapshot) => {
        const dares = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(dares);
    }, (error) => {
        console.error("Error subscribing to dares:", error);
        callback([]);
    });
}

/**
 * Add a new dare to Firestore
 */
export async function addDare(dareData) {
    try {
        const daresRef = collection(db, "dares");
        const docRef = await addDoc(daresRef, {
            ...dareData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding dare:", error);
        throw error;
    }
}

/**
 * Update a dare in Firestore
 */
export async function updateDare(dareId, updates) {
    try {
        const dareRef = doc(db, "dares", dareId);
        await updateDoc(dareRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating dare:", error);
        throw error;
    }
}

/**
 * Delete a dare from Firestore
 */
export async function deleteDare(dareId) {
    try {
        const dareRef = doc(db, "dares", dareId);
        await deleteDoc(dareRef);
        return true;
    } catch (error) {
        console.error("Error deleting dare:", error);
        throw error;
    }
}

/**
 * Subscribe to admin state changes
 */
export function subscribeToAdminState(callback) {
    if (!db) {
        console.warn("Firebase not configured - subscribeToAdminState not available");
        callback({ unlocked: false });
        return () => {}; // Return no-op unsubscribe function
    }
    
    const adminStateRef = doc(db, "admin", "state");
    
    return onSnapshot(adminStateRef, (snapshot) => {
        const state = snapshot.data();
        callback(state || { unlocked: false });
    }, (error) => {
        console.error("Error subscribing to admin state:", error);
        callback({ unlocked: false });
    });
}

/**
 * Update admin state
 */
export async function updateAdminState(state) {
    try {
        const adminStateRef = doc(db, "admin", "state");
        await setDoc(adminStateRef, {
            ...state,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating admin state:", error);
        throw error;
    }
}

/**
 * Get all users from Firestore, fallback to localStorage
 */
export async function getAllUsers() {
    // Try Firestore first
    if (db) {
        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error loading users from Firestore:", error);
        }
    }
    
    // Fallback to localStorage
    try {
        const usersStr = localStorage.getItem('users');
        if (usersStr) {
            const users = JSON.parse(usersStr);
            return Object.entries(users).map(([role, data]) => ({
                id: role,
                role: role,
                ...data
            }));
        }
    } catch (error) {
        console.error("Error loading users from localStorage:", error);
    }
    
    return [];
}

/**
 * Save user to Firestore, fallback to localStorage
 */
export async function saveUser(userId, userData) {
    // Try Firestore first
    if (db) {
        try {
            const userRef = doc(db, "users", userId);
            await setDoc(userRef, {
                ...userData,
                role: userId,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error("Error saving user to Firestore:", error);
            throw error;
        }
    }
    
    // Fallback to localStorage
    try {
        const usersStr = localStorage.getItem('users') || '{}';
        const users = JSON.parse(usersStr);
        users[userId] = {
            ...users[userId],
            ...userData,
            role: userId
        };
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error("Error saving user to localStorage:", error);
        throw error;
    }
}

/**
 * Get user points from localStorage
 */
export function getUserPoints(userId) {
    return parseInt(localStorage.getItem(`points_${userId}`) || '0', 10);
}

/**
 * Set user points in localStorage
 */
export function setUserPoints(userId, points) {
    localStorage.setItem(`points_${userId}`, points.toString());
}

/**
 * Update user points (add or subtract)
 */
export function updateUserPoints(userId, pointsDelta) {
    const currentPoints = getUserPoints(userId);
    const newPoints = currentPoints + pointsDelta;
    setUserPoints(userId, newPoints);
    return newPoints;
}

/**
 * Get all user points (for admin view)
 */
export function getAllUserPoints() {
    const users = getAllUsers();
    return users.map(user => ({
        ...user,
        points: getUserPoints(user.id)
    }));
}

/**
 * Record shared points change for global clue (affects all users)
 */
export async function recordGlobalCluePointsChange(clueId, pointsDelta, actionType, userId) {
    if (!db) {
        // Fallback: update all users' points locally
        const users = await getAllUsers();
        users.forEach(user => {
            updateUserPoints(user.id, pointsDelta);
        });
        return;
    }
    
    try {
        const sharedPointsRef = collection(db, "globalCluePoints");
        await addDoc(sharedPointsRef, {
            clueId: clueId,
            pointsDelta: pointsDelta,
            actionType: actionType, // 'correct', 'incorrect', 'hint'
            userId: userId,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error recording global clue points change:", error);
        // Fallback: update all users' points locally
        const users = await getAllUsers();
        users.forEach(user => {
            updateUserPoints(user.id, pointsDelta);
        });
    }
}

/**
 * Subscribe to global clue points changes (for real-time sync)
 */
export function subscribeToGlobalCluePoints(callback) {
    if (!db) {
        callback([]);
        return () => {};
    }
    
    const sharedPointsRef = collection(db, "globalCluePoints");
    const q = query(sharedPointsRef, orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
        const changes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(changes);
    }, (error) => {
        console.error("Error subscribing to global clue points:", error);
        callback([]);
    });
}

/**
 * Save drink choice for a user
 */
export async function saveDrinkChoice(userId, role, drink) {
    // Try Firestore first
    if (db) {
        try {
            const drinkChoicesRef = collection(db, "drinkChoices");
            // Check if user already has a drink choice
            const q = query(drinkChoicesRef);
            const snapshot = await getDocs(q);
            
            let existingDoc = null;
            snapshot.docs.forEach(doc => {
                if (doc.data().userId === userId) {
                    existingDoc = doc;
                }
            });
            
            if (existingDoc) {
                // Update existing choice
                await updateDoc(existingDoc.ref, {
                    drink: drink,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new choice
                await addDoc(drinkChoicesRef, {
                    userId: userId,
                    role: role,
                    drink: drink,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            return true;
        } catch (error) {
            console.error("Error saving drink choice to Firestore:", error);
            throw error;
        }
    }
    
    // Fallback to localStorage
    try {
        const drinkChoicesStr = localStorage.getItem('drinkChoices') || '{}';
        const drinkChoices = JSON.parse(drinkChoicesStr);
        drinkChoices[userId] = {
            userId: userId,
            role: role,
            drink: drink,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('drinkChoices', JSON.stringify(drinkChoices));
        return true;
    } catch (error) {
        console.error("Error saving drink choice to localStorage:", error);
        throw error;
    }
}

/**
 * Get drink choice for a user
 */
export async function getDrinkChoice(userId) {
    // Try Firestore first
    if (db) {
        try {
            const drinkChoicesRef = collection(db, "drinkChoices");
            const q = query(drinkChoicesRef);
            const snapshot = await getDocs(q);
            
            for (const doc of snapshot.docs) {
                const data = doc.data();
                if (data.userId === userId) {
                    return data.drink;
                }
            }
            return null;
        } catch (error) {
            console.error("Error getting drink choice from Firestore:", error);
        }
    }
    
    // Fallback to localStorage
    try {
        const drinkChoicesStr = localStorage.getItem('drinkChoices');
        if (drinkChoicesStr) {
            const drinkChoices = JSON.parse(drinkChoicesStr);
            return drinkChoices[userId]?.drink || null;
        }
    } catch (error) {
        console.error("Error getting drink choice from localStorage:", error);
    }
    
    return null;
}

/**
 * Get all drink choices (for admin view)
 */
export async function getAllDrinkChoices() {
    // Try Firestore first
    if (db) {
        try {
            const drinkChoicesRef = collection(db, "drinkChoices");
            const snapshot = await getDocs(drinkChoicesRef);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error("Error getting drink choices from Firestore:", error);
        }
    }
    
    // Fallback to localStorage
    try {
        const drinkChoicesStr = localStorage.getItem('drinkChoices');
        if (drinkChoicesStr) {
            const drinkChoices = JSON.parse(drinkChoicesStr);
            return Object.entries(drinkChoices).map(([userId, data]) => ({
                id: userId,
                userId: userId,
                ...data
            }));
        }
    } catch (error) {
        console.error("Error getting drink choices from localStorage:", error);
    }
    
    return [];
}

/**
 * Delete drink choice for a user
 */
export async function deleteDrinkChoice(userId) {
    // Try Firestore first
    if (db) {
        try {
            const drinkChoicesRef = collection(db, "drinkChoices");
            const q = query(drinkChoicesRef);
            const snapshot = await getDocs(q);
            
            // Find and delete the document for this user
            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                if (data.userId === userId) {
                    await deleteDoc(docSnapshot.ref);
                    return true;
                }
            }
            return false; // No document found
        } catch (error) {
            console.error("Error deleting drink choice from Firestore:", error);
            throw error;
        }
    }
    
    // Fallback to localStorage
    try {
        const drinkChoicesStr = localStorage.getItem('drinkChoices');
        if (drinkChoicesStr) {
            const drinkChoices = JSON.parse(drinkChoicesStr);
            if (drinkChoices[userId]) {
                delete drinkChoices[userId];
                localStorage.setItem('drinkChoices', JSON.stringify(drinkChoices));
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error deleting drink choice from localStorage:", error);
        throw error;
    }
}

/**
 * CLUE SYSTEM - Supports person-specific and global clues
 */

/**
 * Get all clues from Firestore, sorted by order
 */
export async function getAllClues() {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const cluesRef = collection(db, "clues");
        const q = query(cluesRef, orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error loading clues:", error);
        throw error;
    }
}

/**
 * Subscribe to clues changes (real-time)
 */
export function subscribeToClues(callback) {
    if (!db) {
        console.warn("Firebase not configured - subscribeToClues not available");
        callback([]);
        return () => {};
    }
    
    const cluesRef = collection(db, "clues");
    const q = query(cluesRef, orderBy("order", "asc"));
    
    return onSnapshot(q, (snapshot) => {
        const clues = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(clues);
    }, (error) => {
        console.error("Error subscribing to clues:", error);
        callback([]);
    });
}

/**
 * Get user's clue progress
 */
export async function getUserClueProgress(userId) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const progressRef = doc(db, "clueProgress", userId);
        const progressDoc = await progressRef.get();
        
        if (progressDoc.exists()) {
            return progressDoc.data();
        }
        return {
            userId: userId,
            currentClueOrder: 0,
            completedClueIds: [],
            waitingForOthers: false
        };
    } catch (error) {
        console.error("Error getting user clue progress:", error);
        throw error;
    }
}

/**
 * Subscribe to user's clue progress (real-time)
 */
export function subscribeToUserClueProgress(userId, callback) {
    if (!db) {
        console.warn("Firebase not configured - subscribeToUserClueProgress not available");
        callback({ userId, currentClueOrder: 0, completedClueIds: [], waitingForOthers: false });
        return () => {};
    }
    
    const progressRef = doc(db, "clueProgress", userId);
    
    return onSnapshot(progressRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data());
        } else {
            callback({ userId, currentClueOrder: 0, completedClueIds: [], waitingForOthers: false });
        }
    }, (error) => {
        console.error("Error subscribing to user clue progress:", error);
        callback({ userId, currentClueOrder: 0, completedClueIds: [], waitingForOthers: false });
    });
}

/**
 * Update user's clue progress (for when global clues are completed by others)
 */
export async function updateUserClueProgress(userId, updates) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const progressRef = doc(db, "clueProgress", userId);
        const currentProgress = await getUserClueProgress(userId);
        
        await setDoc(progressRef, {
            ...currentProgress,
            ...updates,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating user clue progress:", error);
        throw error;
    }
}

/**
 * Mark a clue as completed for a user
 */
export async function markClueComplete(userId, clueId, clueType, assignedTo = []) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        // Update user's progress
        const progressRef = doc(db, "clueProgress", userId);
        const progressDoc = await progressRef.get();
        const currentProgress = progressDoc.exists() ? progressDoc.data() : {
            userId: userId,
            currentClueOrder: 0,
            completedClueIds: [],
            waitingForOthers: false
        };
        
        // Add clue to completed list if not already there
        const completedClueIds = [...(currentProgress.completedClueIds || [])];
        if (!completedClueIds.includes(clueId)) {
            completedClueIds.push(clueId);
        }
        
        // Get the clue to find its order
        const clueRef = doc(db, "clues", clueId);
        const clueDoc = await clueRef.get();
        const clue = clueDoc.data();
        const clueOrder = clue?.order || 0;
        
        // Update progress
        const updates = {
            userId: userId,
            completedClueIds: completedClueIds,
            updatedAt: serverTimestamp()
        };
        
        if (clueType === "person-specific") {
            // For person-specific clues, check if all assigned users have completed
            const allCompleted = await checkAllPersonSpecificClueCompleted(clueId, assignedTo);
            if (!allCompleted) {
                // User completed but others haven't - set waiting flag
                updates.waitingForOthers = true;
                updates.currentClueOrder = clueOrder; // Stay on this clue
            } else {
                // All users completed - can advance
                updates.waitingForOthers = false;
                updates.currentClueOrder = clueOrder + 1;
            }
        } else {
            // For global clues, mark as complete globally
            await markGlobalClueComplete(clueId, userId);
            updates.currentClueOrder = clueOrder + 1;
            updates.waitingForOthers = false;
        }
        
        await setDoc(progressRef, updates, { merge: true });
        return true;
    } catch (error) {
        console.error("Error marking clue complete:", error);
        throw error;
    }
}

/**
 * Check if all users assigned to a person-specific clue have completed it
 */
export async function checkAllPersonSpecificClueCompleted(clueId, assignedTo) {
    if (!db || !assignedTo || assignedTo.length === 0) {
        return false;
    }
    
    try {
        // Check progress for all assigned users
        for (const userId of assignedTo) {
            const progressRef = doc(db, "clueProgress", userId);
            const progressDoc = await progressRef.get();
            const progress = progressDoc.exists() ? progressDoc.data() : {};
            const completedClueIds = progress.completedClueIds || [];
            
            if (!completedClueIds.includes(clueId)) {
                return false; // At least one user hasn't completed
            }
        }
        return true; // All users have completed
    } catch (error) {
        console.error("Error checking person-specific clue completion:", error);
        return false;
    }
}

/**
 * Mark a global clue as complete (affects all users)
 */
export async function markGlobalClueComplete(clueId, completedBy) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const globalCompletionRef = doc(db, "globalClueCompletion", clueId);
        await setDoc(globalCompletionRef, {
            clueId: clueId,
            isCompleted: true,
            completedBy: completedBy,
            completedAt: serverTimestamp()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error("Error marking global clue complete:", error);
        throw error;
    }
}

/**
 * Get global clue completion status
 */
export async function getGlobalClueCompletion(clueId) {
    if (!db) {
        return { isCompleted: false };
    }
    
    try {
        const globalCompletionRef = doc(db, "globalClueCompletion", clueId);
        const completionDoc = await globalCompletionRef.get();
        
        if (completionDoc.exists()) {
            return completionDoc.data();
        }
        return { isCompleted: false };
    } catch (error) {
        console.error("Error getting global clue completion:", error);
        return { isCompleted: false };
    }
}

/**
 * Subscribe to global clue completion (real-time)
 */
export function subscribeToGlobalClueCompletion(clueId, callback) {
    if (!db) {
        callback({ isCompleted: false });
        return () => {};
    }
    
    const globalCompletionRef = doc(db, "globalClueCompletion", clueId);
    
    return onSnapshot(globalCompletionRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data());
        } else {
            callback({ isCompleted: false });
        }
    }, (error) => {
        console.error("Error subscribing to global clue completion:", error);
        callback({ isCompleted: false });
    });
}

/**
 * Add a new clue
 */
export async function addClue(clueData) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const cluesRef = collection(db, "clues");
        const docRef = await addDoc(cluesRef, {
            ...clueData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding clue:", error);
        throw error;
    }
}

/**
 * Update a clue
 */
export async function updateClue(clueId, updates) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const clueRef = doc(db, "clues", clueId);
        await updateDoc(clueRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error("Error updating clue:", error);
        throw error;
    }
}

/**
 * Delete a clue
 */
export async function deleteClue(clueId) {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const clueRef = doc(db, "clues", clueId);
        await deleteDoc(clueRef);
        return true;
    } catch (error) {
        console.error("Error deleting clue:", error);
        throw error;
    }
}

/**
 * Get all users' clue progress (for admin)
 */
export async function getAllUsersClueProgress() {
    if (!db) {
        throw new Error("Firebase not configured");
    }
    
    try {
        const progressRef = collection(db, "clueProgress");
        const snapshot = await getDocs(progressRef);
        
        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting all users clue progress:", error);
        throw error;
    }
}

export { db };
