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
  chat_sessions: {
    key: string; // sessionId (uuid)
    value: {
      id: string;
      title: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: { 'updatedAt': number };
  };
  chat_messages: {
    key: number; // auto-increment id
    value: {
      id?: number;
      sessionId: string;
      author: 'user' | 'bot';
      text: string;
      timestamp: number;
    };
    indexes: { 'sessionId': string; 'sessionId_timestamp': [string, number] };
  };
}

const dbPromise = openDB<SakhiDB>('sakhi-journal', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const store = db.createObjectStore('moods', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('timestamp', 'timestamp');
    }
    if (oldVersion < 2) {
      // chat_sessions
      const s = db.createObjectStore('chat_sessions', { keyPath: 'id' });
      s.createIndex('updatedAt', 'updatedAt');
      // chat_messages
      const m = db.createObjectStore('chat_messages', { keyPath: 'id', autoIncrement: true });
      m.createIndex('sessionId', 'sessionId');
      m.createIndex('sessionId_timestamp', ['sessionId', 'timestamp']);
    }
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

// ---------------- Chat persistence helpers ----------------
import { v4 as uuidv4 } from 'uuid';

export type ChatSession = { id: string; title: string; createdAt: number; updatedAt: number };
export type ChatMessage = { id?: number; sessionId: string; author: 'user' | 'bot'; text: string; timestamp: number };

export const createChatSession = async (title = 'New chat'): Promise<ChatSession> => {
  const db = await dbPromise;
  const id = uuidv4();
  const now = Date.now();
  const session: ChatSession = { id, title, createdAt: now, updatedAt: now };
  await db.put('chat_sessions', session);
  return session;
};

export const listChatSessions = async (): Promise<ChatSession[]> => {
  const db = await dbPromise;
  const all = await db.getAll('chat_sessions');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const renameChatSession = async (id: string, newTitle: string): Promise<void> => {
  const db = await dbPromise;
  const s = await db.get('chat_sessions', id);
  if (!s) return;
  s.title = newTitle || s.title;
  s.updatedAt = Date.now();
  await db.put('chat_sessions', s);
};

export const deleteChatSession = async (id: string): Promise<void> => {
  const db = await dbPromise;
  // delete messages for session
  const idx = db.transaction('chat_messages', 'readwrite');
  const store = idx.store;
  let cursor = await store.index('sessionId').openCursor(IDBKeyRange.only(id));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await db.delete('chat_sessions', id);
};

export const addChatMessage = async (msg: ChatMessage): Promise<number> => {
  const db = await dbPromise;
  // update session updatedAt
  const s = await db.get('chat_sessions', msg.sessionId);
  if (s) {
    s.updatedAt = Date.now();
    await db.put('chat_sessions', s);
  }
  return db.add('chat_messages', { ...msg, timestamp: msg.timestamp ?? Date.now() });
};

export const getChatMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const db = await dbPromise;
  const results = await db.getAllFromIndex('chat_messages', 'sessionId_timestamp', IDBKeyRange.bound([sessionId, 0], [sessionId, Date.now()]));
  return results.sort((a, b) => a.timestamp - b.timestamp);
};

export const setActiveChatId = (id: string) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('active_chat_id', id);
  }
};

export const getActiveChatId = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('active_chat_id');
  }
  return null;
};
