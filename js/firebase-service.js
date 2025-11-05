/**
 * Firebase service module for operation-water-rock.
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
 * Get all user points (for admin view)
 */
export function getAllUserPoints() {
    const users = getAllUsers();
    return users.map(user => ({
        ...user,
        points: getUserPoints(user.id)
    }));
}

export { db };
