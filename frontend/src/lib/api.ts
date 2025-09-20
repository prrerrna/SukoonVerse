// api.ts: A library for making API calls to the backend.
// Includes both public and authenticated API endpoints.

// This file centralizes all communication with the backend API.
// It uses the browser's fetch API to make HTTP requests.

const API_BASE_URL = '/api'; // Uses proxy in development

export const getServerSession = async () => {
  const res = await fetch(`${API_BASE_URL}/session`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to get server session id');
  return res.json();
};

// Type for the chat request payload
type ChatPayload = {
  session_id: string;
  message: string;
  lang_hint: 'en' | 'hi';
  chat_id?: string;
};

// An inline arrow function to send a chat message.
export const sendMessage = async (payload: ChatPayload) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// An inline arrow function to get resources.
export const getResources = async (region: string = 'default') => {
  const response = await fetch(`${API_BASE_URL}/resources?region=${region}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Request a short chat title from backend (Gemini). Returns { title?: string | null }.
export const generateChatTitle = async (firstMessage: string): Promise<{ title?: string | null }> => {
  const response = await fetch(`${API_BASE_URL}/chat/title`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message: firstMessage }),
  });
  // Even if not ok, we'll let caller fallback
  try {
    return await response.json();
  } catch {
    return { title: null };
  }
};

// Function to analyze mood from text
export const analyzeMood = async (message: string) => {
  const response = await fetch(`${API_BASE_URL}/mood`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Function to get mood history from backend (session-based)
export const getMoodHistory = async (days: number = 7) => {
  const response = await fetch(`${API_BASE_URL}/mood/history?days=${days}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Cloud-based mood API functions that use Firestore

// Save a mood entry to Firestore (authenticated)
export const saveMoodToCloud = async (payload: { 
  label: string;
  score: number;
  journal?: string;
  source?: 'manual' | 'chat';
  themes?: string[];
}) => {
  const response = await authenticatedRequest('/mood/cloud', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.json();
};

// Get mood history from Firestore (authenticated)
export const getCloudMoodHistory = async (days: number = 7, limit: number = 100) => {
  const response = await authenticatedRequest(`/mood/cloud/history?days=${days}&limit=${limit}`);
  return response.json();
};

// Update an existing mood entry
export const updateMoodEntry = async (entryId: string, updates: {
  label?: string;
  score?: number;
  journal?: string;
  themes?: string[];
}) => {
  const response = await authenticatedRequest(`/mood/cloud/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  return response.json();
};

// Delete a mood entry
export const deleteMoodEntry = async (entryId: string) => {
  const response = await authenticatedRequest(`/mood/cloud/${entryId}`, {
    method: 'DELETE'
  });
  return response.json();
};

// Get mood statistics
export const getMoodStats = async (days: number = 7) => {
  const response = await authenticatedRequest(`/mood/cloud/stats?days=${days}`);
  return response.json();
};

// Function to flag crisis
export const flagCrisis = async (payload: { session_id: string; reason: string }) => {
  const response = await fetch(`${API_BASE_URL}/flag`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// Pulse: report anonymous aggregate
export const reportPulse = async (payload: { session_id: string; region: string; mood_score: number; themes: string[] }) => {
  const res = await fetch(`${API_BASE_URL}/pulse/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to report pulse');
  return res.json();
};

// Pulse: get region summary
export const getPulseSummary = async (region: string) => {
  const res = await fetch(`${API_BASE_URL}/pulse/summary?region=${encodeURIComponent(region)}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch pulse summary');
  return res.json();
};

// Pulse: feedback on action usefulness
export const sendPulseFeedback = async (payload: { session_id: string; region: string; suggestion_id: string; value: 1 | -1 }) => {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send feedback');
  return res.json();
};

// ===============================
// Firebase Authentication API
// ===============================
import { getAuth } from 'firebase/auth';

/**
 * Makes an authenticated request to the backend API
 * Automatically adds the Firebase ID token to the request headers
 */
export async function authenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  try {
    // Get current Firebase user
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User is not authenticated');
    }

    // Get ID token
    const token = await user.getIdToken();

    // Make the authenticated request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('Authentication request failed:', error);
    throw error;
  }
}

/**
 * User API functions
 */

// Get the current user's profile
export async function getUserProfile() {
  const response = await authenticatedRequest('/user/profile');
  return response.json();
}

// Update the user's profile
export async function updateUserProfile(profile: {
  name?: string;
  mobile?: string;
  preferredName?: string;
  region?: string;
  language?: string;
  bio?: string;
}) {
  const response = await authenticatedRequest('/user/profile', {
    method: 'POST',
    body: JSON.stringify({ profile }),
  });
  return response.json();
}

// Register a new user after Firebase authentication
export async function registerUser(profile: {
  name?: string;
  mobile?: string;
  preferredName?: string;
  region?: string;
  language?: string;
}, sessionId?: string) {
  const response = await authenticatedRequest('/user/register', {
    method: 'POST',
    body: JSON.stringify({ 
      profile,
      session_id: sessionId 
    }),
  });
  return response.json();
}

// ===============================
// Chat History API
// ===============================

/**
 * Create a new chat with the first message
 * This combines creating a session and sending the first message in one call
 * The backend will generate a title automatically based on the first message
 * 
 * @param message The first message to send in the chat
 * @returns Promise with sessionId, title, and initialResponse
 */
export const createNewChat = async (message: string) => {
  return await authenticatedRequest('/chat/new', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

/**
 * Create a new remote chat session
 * @param title Title of the chat session
 */
export const createRemoteChatSession = async (title: string) => {
    return await authenticatedRequest('/history/session', {
        method: 'POST',
        body: JSON.stringify({ title }),
    });
};

/**
 * Get all remote chat sessions for the user
 */
export const getRemoteChatSessions = async () => {
    return await authenticatedRequest('/history/sessions');
};

/**
 * Get messages for a specific remote chat session
 * @param sessionId ID of the chat session
 */
export const getRemoteMessages = async (sessionId: string) => {
    return await authenticatedRequest(`/history/messages/${sessionId}`);
};

/**
 * Send a message to a specific remote chat session
 * @param sessionId ID of the chat session
 * @param message The message content
 */
export const sendRemoteMessage = async (sessionId: string, message: string) => {
    return await authenticatedRequest(`/chat/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
};

/**
 * Delete a specific remote chat session
 * @param sessionId ID of the chat session to delete
 */
export const deleteRemoteChatSession = async (sessionId: string) => {
    return await authenticatedRequest(`/history/sessions/${sessionId}`, {
        method: 'DELETE'
    });
};
