// useSession.ts: A custom hook for managing the anonymous user session.

import { useState, useEffect } from 'react';
import { getServerSession } from '../lib/api';

// This custom hook manages the anonymous session ID.
// It checks sessionStorage for an existing ID or creates a new one.
const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize once: prefer server-provided stable id; persist across reloads.
  useEffect(() => {
    const ls = window.localStorage;
    const stored = ls.getItem('session_id');
    if (stored) {
      setSessionId(stored);
      return;
    }
    // Ask backend for a stable session id tied to current server run
    (async () => {
      try {
        const resp = await getServerSession();
        const sid = resp.session_id || 'fallback-dev-session';
        ls.setItem('session_id', sid);
        setSessionId(sid);
      } catch {
        // Fallback to fixed id for dev if server endpoint fails
        const sid = 'fallback-dev-session';
        ls.setItem('session_id', sid);
        setSessionId(sid);
      }
    })();
  }, []); // Empty dependency array ensures this runs only once.

  return { sessionId };
};

export default useSession;
