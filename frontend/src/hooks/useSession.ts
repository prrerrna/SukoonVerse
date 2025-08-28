// useSession.ts: A custom hook for managing the anonymous user session.
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// This custom hook manages the anonymous session ID.
// It checks sessionStorage for an existing ID or creates a new one.
const useSession = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  // This effect runs once on mount to initialize the session.
  // All logic is self-contained.
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem('session_id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      sessionStorage.setItem('session_id', newSessionId);
      setSessionId(newSessionId);
    }
  }, []); // Empty dependency array ensures this runs only once.

  return { sessionId };
};

export default useSession;
