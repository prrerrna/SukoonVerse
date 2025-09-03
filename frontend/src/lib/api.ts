// api.ts: A library for making API calls to the backend.

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

// Function to get mood history from backend
export const getMoodHistory = async (days: number = 7) => {
  const response = await fetch(`${API_BASE_URL}/mood/history?days=${days}`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
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
