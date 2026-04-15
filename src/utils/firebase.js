/**
 * firebase.js — SafeLine Firebase Integration
 *
 * Google Services used:
 *  1. Firebase Analytics  — tracks navigation events
 *  2. Firestore           — stores navigation sessions (real backend)
 *  3. Firebase Auth       — Google Sign-In support
 *
 * Config loaded from environment variables (VITE_FIREBASE_*) for security.
 */

import { initializeApp }                             from 'firebase/app';
import { getAnalytics, logEvent }                    from 'firebase/analytics';
import { getFirestore, collection, addDoc,
         updateDoc, doc, serverTimestamp }           from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup,
         signOut, onAuthStateChanged }               from 'firebase/auth';

// ── Config from environment variables (never hardcoded) ───────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ── Initialize ─────────────────────────────────────────────────────────────
const app           = initializeApp(firebaseConfig);
const analytics     = getAnalytics(app);
const db            = getFirestore(app);
const auth          = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, db, auth };

// ── Analytics helpers ──────────────────────────────────────────────────────
/**
 * Log a custom event to Firebase Analytics.
 * @param {string} name    - event name
 * @param {object} params  - event parameters
 */
export function logAnalyticsEvent(name, params = {}) {
  try { logEvent(analytics, name, params); } catch (e) { /* silently ignore */ }
}

// ── Firebase Auth — Google Sign-In ─────────────────────────────────────────
/**
 * Sign in with Google via popup.
 * Used to optionally identify users for session attribution.
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    logAnalyticsEvent('login', { method: 'google' });
    console.log('[SafeLine] Signed in:', result.user.displayName);
    return result.user;
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      console.warn('[SafeLine] Sign-in failed:', err.message);
    }
    return null;
  }
}

/**
 * Sign out current user.
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    logAnalyticsEvent('logout');
  } catch (err) {
    console.warn('[SafeLine] Sign-out failed:', err.message);
  }
}

/**
 * Subscribe to auth state changes.
 * @param {function} callback - called with (user | null)
 * @returns {function} unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Firestore session logging ──────────────────────────────────────────────
/**
 * Log a new navigation session to Firestore when a ticket is scanned.
 * Creates a document in /sessions/{auto-id}.
 *
 * @param {object} ticket - full ticket from generateTicket()
 * @returns {Promise<string|null>} Firestore document ID
 */
export async function logSessionStart(ticket) {
  try {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, 'sessions'), {
      ticketId:      ticket.id,
      destination:   ticket.destination,
      color:         ticket.colorName,
      totalDistance: ticket.totalDistance,
      turnCount:     ticket.turnDirs?.length ?? 0,
      gate:          ticket.gate,
      status:        'active',
      userId:        user?.uid ?? 'anonymous',
      startedAt:     serverTimestamp(),
      platform:      navigator.userAgent.substring(0, 200),
    });

    logAnalyticsEvent('navigation_start', {
      destination:   ticket.destination,
      totalDistance: ticket.totalDistance,
    });

    console.log('[SafeLine] Session logged:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn('[SafeLine] Firestore write failed:', err.message);
    return null;
  }
}

/**
 * Mark a navigation session as completed or exited.
 * Updates the document status and records timestamp.
 *
 * @param {string}  sessionId - Firestore document ID
 * @param {boolean} completed - true = reached destination
 */
export async function logSessionEnd(sessionId, completed) {
  if (!sessionId) return;
  try {
    await updateDoc(doc(db, 'sessions', sessionId), {
      status:      completed ? 'completed' : 'exited',
      completedAt: serverTimestamp(),
    });
    logAnalyticsEvent(completed ? 'navigation_complete' : 'navigation_exit');
  } catch (err) {
    console.warn('[SafeLine] Session update failed:', err.message);
  }
}
