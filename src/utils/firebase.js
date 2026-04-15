/**
 * firebase.js — SafeLine Firebase Integration
 *
 * Services:
 *  - Analytics:  logs screen views + user events
 *  - Firestore:  stores navigation sessions (real backend data)
 *
 * Every QR scan creates a Firestore document under /sessions/{id}
 * tracking: destination, color, distance, timestamp, turnCount.
 */

import { initializeApp }              from 'firebase/app';
import { getAnalytics, logEvent }     from 'firebase/analytics';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

// ── Firebase config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyCsy5j_8OMUb0iAoP5IfSjrKfe9KLqd-u8',
  authDomain:        'safeline-app-6a643.firebaseapp.com',
  projectId:         'safeline-app-6a643',
  storageBucket:     'safeline-app-6a643.firebasestorage.app',
  messagingSenderId: '1030561019680',
  appId:             '1:1030561019680:web:67028d16681129c0220945',
  measurementId:     'G-W8FLYMEZ9T',
};

// ── Initialize ─────────────────────────────────────────────────────────────
const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db        = getFirestore(app);

export { app, analytics, db };

// ── Analytics helpers ──────────────────────────────────────────────────────
/** Log any custom event to Firebase Analytics */
export function logAnalyticsEvent(name, params = {}) {
  try { logEvent(analytics, name, params); } catch (e) { /* silently ignore */ }
}

// ── Firestore session logging ──────────────────────────────────────────────
/**
 * Called when a ticket is scanned / route generated.
 * Creates a new session document in Firestore and returns its ID.
 *
 * @param {object} ticket — full ticket object from generateTicket()
 * @returns {Promise<string|null>} Firestore document ID, or null on error
 */
export async function logSessionStart(ticket) {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ticketId:      ticket.id,
      destination:   ticket.destination,
      color:         ticket.colorName,
      totalDistance: ticket.totalDistance,
      turnCount:     ticket.turnDirs?.length ?? 0,
      gate:          ticket.gate,
      status:        'active',
      startedAt:     serverTimestamp(),
      platform:      navigator.userAgent,
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
 * Called when user reaches destination or exits AR.
 * Updates the session document with completion status.
 *
 * @param {string} sessionId  — Firestore document ID from logSessionStart
 * @param {boolean} completed — true if destination reached, false if exited early
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
