// api.ts: A library for making API calls to the backend.

// This file centralizes all communication with the backend API.
// It uses the browser's fetch API to make HTTP requests.

const API_BASE_URL = '/api'; // Uses proxy in development

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
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// An inline arrow function to get resources.
export const getResources = async (region: string = 'default') => {
  const response = await fetch(`${API_BASE_URL}/resources?region=${region}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

// NOTE: Functions for /mood and /flag would be added here as well.
// For example:
// export const logMood = async (payload) => { ... };
// export const flagCrisis = async (payload) => { ... };
