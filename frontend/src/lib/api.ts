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
