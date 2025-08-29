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
export const addSnapshot = async (snapshot: { label: string; score: number }) => {
  const db = await dbPromise;
  return db.add('moods', { ...snapshot, timestamp: Date.now() });
};

// An inline arrow function to get mood snapshots from the last 7 days.
export const getLast7Days = async () => {
  const db = await dbPromise;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return db.getAllFromIndex('moods', 'timestamp', IDBKeyRange.lowerBound(sevenDaysAgo));
};

// An inline arrow function to clear all journal entries.
export const clearAll = async () => {
    const db = await dbPromise;
    return db.clear('moods');
};

// --- Ephemeral Default Behavior ---
// By default, the journal is ephemeral. The following code clears the database
// when the page is hidden (e.g., tab closed), unless persistence is opted-in.
// To opt-in, set localStorage: `localStorage.setItem('journal-persistence', 'true');`

const isPersistenceEnabled = () => {
    if (typeof window !== 'undefined') {
        return window.localStorage.getItem('journal-persistence') === 'true';
    }
    return false;
};

if (typeof window !== 'undefined' && !isPersistenceEnabled()) {
    window.addEventListener('pagehide', () => {
        // This is a fire-and-forget call. We don't wait for it to complete,
        // as the page is being unloaded.
        clearAll();
        console.log('Ephemeral journal cleared on page hide.');
    });
}
