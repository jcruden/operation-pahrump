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
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase not configured:", error);
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
