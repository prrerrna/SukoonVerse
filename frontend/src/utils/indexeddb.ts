// indexeddb.ts: A utility for interacting with IndexedDB for ephemeral client-side storage.
import { openDB, DBSchema } from 'idb';


// This file provides a simple interface for storing and retrieving mood data
// from the browser's IndexedDB. This storage is ephemeral and client-side only by default.

// --- How to use from a React component ---
//
// import { addSnapshot, getLast7Days } from './utils/indexeddb';
//
// const MyComponent = () => {
//   const handleSaveMood = async () => {
//     await addSnapshot({ label: 'happy', score: 8 });
//   };
//
//   const handleLoadMoods = async () => {
//     const recentMoods = await getLast7Days();
//     console.log(recentMoods);
//   };
//   
//   return ( ... );
// };

interface SakhiDB extends DBSchema {
  moods: {
    key: number;
    value: {
      id?: number;
      timestamp: number;
      label: string;
      score: number;
      journal?: string;
      source?: 'manual' | 'chat'; // Indicates if entry is from manual input or chat detection
    };
    indexes: { 'timestamp': number };
  };
}

const dbPromise = openDB<SakhiDB>('sakhi-journal', 1, {
  upgrade(db) {
    const store = db.createObjectStore('moods', {
      keyPath: 'id',
      autoIncrement: true,
    });
    store.createIndex('timestamp', 'timestamp');
  },
});

// An inline arrow function to add a mood snapshot.
export const addSnapshot = async (snapshot: { 
  label: string; 
  score: number; 
  journal?: string;
  source?: 'manual' | 'chat';
}) => {
  // Ensure score is clamped between 1-10
  const score = Math.max(1, Math.min(10, snapshot.score));
  const db = await dbPromise;
  // Default source to 'manual' if not specified
  const source = snapshot.source || 'manual';
  return db.add('moods', { ...snapshot, score, source, timestamp: Date.now() });
};

// An inline arrow function to get mood snapshots from the last 7 days.
export const getLast7Days = async () => {
  const db = await dbPromise;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  // Get entries from the last 7 days
  const entries = await db.getAllFromIndex('moods', 'timestamp', IDBKeyRange.lowerBound(sevenDaysAgo));
  // Sort by timestamp in ascending order for consistent chart display
  return entries.sort((a, b) => a.timestamp - b.timestamp);
};

// An inline arrow function to clear all journal entries.
export const clearAll = async () => {
    const db = await dbPromise;
    return db.clear('moods');
};

// --- Persistence Configuration ---
// By default, the journal is ephemeral (cleared when the page is closed).
// Users can opt-in to persistence by setting localStorage.

// Check if persistence is enabled
export const isPersistenceEnabled = (): boolean => {
    if (typeof window !== 'undefined') {
        return window.localStorage.getItem('journal-persistence') === 'true';
    }
    return false;
};

// Enable persistence
export const enablePersistence = (): void => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem('journal-persistence', 'true');
        console.log('Journal persistence enabled.');
    }
};

// Disable persistence
export const disablePersistence = (): void => {
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('journal-persistence');
        console.log('Journal persistence disabled. Entries will be cleared when the page is closed.');
    }
};

// Set up auto-clearing on page hide if persistence is not enabled
if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
        if (!isPersistenceEnabled()) {
            // This is a fire-and-forget call. We don't wait for it to complete,
            // as the page is being unloaded.
            clearAll();
            console.log('Ephemeral journal cleared on page hide.');
        }
    });
}
