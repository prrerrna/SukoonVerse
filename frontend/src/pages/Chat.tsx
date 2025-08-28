// Chat.tsx: The main chat interface component where users interact with the AI.
import { useState } from 'react';
import useSession from '../hooks/useSession';
import { sendMessage } from '../lib/api';
import ChatBubble from '../components/ChatBubble';
import BreathTimer from '../components/BreathTimer';

// This component handles the main chat functionality.
// All state and logic are managed inline using React hooks.
const Chat = () => {
  const { sessionId } = useSession();
  const [messages, setMessages] = useState<{ author: 'user' | 'bot'; text: string }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCrisis, setIsCrisis] = useState(false);

  // Inline arrow function for handling form submission.
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId) return;

    const userMessage = { author: 'user' as const, text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await sendMessage({ session_id: sessionId, message: inputValue, lang_hint: 'en' });
      const botMessage = { author: 'bot' as const, text: response.reply };
      setMessages(prev => [...prev, botMessage]);
      
      if (response.is_crisis) {
        setIsCrisis(true);
      } else {
        setIsCrisis(false);
      }
      // Here you would also handle mood updates and suggested interventions
    } catch (error) {
      const errorMessage = { author: 'bot' as const, text: 'Sorry, something went wrong.' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (isCrisis) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600">Crisis Detected</h2>
        <p className="my-4">It's important to get help right away. Please use a resource below.</p>
        <a href="tel:988" className="block bg-red-500 text-white p-3 rounded-lg mb-4">Call 988 (National Helpline)</a>
        <BreathTimer />
        <button onClick={() => setIsCrisis(false)} className="mt-4 text-sm text-gray-600">Return to chat</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, index) => (
          <ChatBubble key={index} author={msg.author} text={msg.text} />
        ))}
      </div>
      <form onSubmit={handleSend} className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 p-2 border rounded-l-lg"
          placeholder="Type your message..."
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-r-lg">Send</button>
      </form>
      <div className="text-center text-xs text-gray-600 mt-2">
        Disclaimer: Not a clinician. For emergencies call your local helpline.
      </div>
    </div>
  );
};

export default Chat;
