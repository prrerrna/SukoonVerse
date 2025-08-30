// Chat.tsx: The main chat interface component where users interact with the AI.
import { useState, useRef, useEffect } from 'react';
import useSession from '../hooks/useSession';
import { sendMessage } from '../lib/api';
import ChatBubble from '../components/ChatBubble';
import BreathTimer from '../components/BreathTimer';
import { addSnapshot } from '../utils/indexeddb';

// This component handles the main chat functionality.
// All state and logic are managed inline using React hooks.
const Chat = () => {
  const { sessionId } = useSession();
  const [messages, setMessages] = useState<{ id: string; author: 'user' | 'bot'; text: string; floating?: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCrisis, setIsCrisis] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);
  

  // helper to clear floating flag after animation
  const clearFloating = (id: string) => {
    setTimeout(() => {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, floating: false } : m)));
    }, 650); // slightly longer than animation
  };

  // Inline arrow function for handling form submission.
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId) return;

    const userId = `u_${Date.now()}`;
    const userMessage = { id: userId, author: 'user' as const, text: inputValue, floating: true };
    setMessages(prev => [...prev, userMessage]);
    clearFloating(userId);
    const textToSend = inputValue;
    setInputValue('');

    try {
      const response = await sendMessage({ session_id: sessionId, message: textToSend, lang_hint: 'en' });
      const botId = `b_${Date.now()}`;
      const botMessage = { id: botId, author: 'bot' as const, text: response.reply, floating: true };
      setMessages(prev => [...prev, botMessage]);
      clearFloating(botId);

      if (response.is_crisis) {
        setIsCrisis(true);
      } else {
        setIsCrisis(false);
      }
      
      // Save mood from chatbot response to update trend chart (silent)
      if (response.mood && typeof response.mood === 'object') {
        const moodData = {
          label: response.mood.label || 'neutral',
          score: response.mood.score || 5,
          journal: undefined, // do not include raw chat in journal for privacy
          source: 'chat' as const // Explicitly set source to chat
        };
        
        // Add to IndexedDB to update the mood trend chart
        await addSnapshot(moodData);
        // No user-facing announcement in chat
      }
    } catch (error) {
      const errId = `e_${Date.now()}`;
      const errorMessage = { id: errId, author: 'bot' as const, text: 'Sorry, something went wrong.', floating: true };
      setMessages(prev => [...prev, errorMessage]);
      clearFloating(errId);
    }
  };

  if (isCrisis) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-red-600">Need immediate help?</h2>
          <p className="mb-4">
            If you're experiencing a mental health crisis or emergency, please reach out to one of these resources immediately:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li className="mb-2">National Suicide Prevention Lifeline: <a href="tel:988" className="text-blue-600 underline">988</a></li>
            <li className="mb-2">Crisis Text Line: Text HOME to <a href="sms:741741" className="text-blue-600 underline">741741</a></li>
            <li>Emergency Services: <a href="tel:911" className="text-blue-600 underline">911</a></li>
          </ul>
          <BreathTimer />
          <div className="flex justify-end">
            <button 
              onClick={() => setIsCrisis(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              I understand
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="flex flex-col h-screen p-4">
      {/* inject small keyframes for floating animation */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .floating {
          animation: floatUp 600ms cubic-bezier(.22,.9,.36,1) forwards;
        }
      `}</style>

      <div ref={containerRef} className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.floating ? 'floating' : undefined}
            // ensure the animation doesn't block layout or interaction
            style={{ willChange: 'transform, opacity' }}
          >
            <ChatBubble author={msg.author} text={msg.text} />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center justify-center">
        <div className="flex items-center w-full max-w-2xl mx-auto bg-white rounded-full shadow-md overflow-hidden border border-teal-100">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 p-3 outline-none text-gray-700"
            placeholder="Type your message..."
          />
          <button type="submit" className="p-3 text-teal-600 hover:text-teal-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5"></path>
              <path d="m5 12 7-7 7 7"></path>
            </svg>
          </button>
        </div>
      </form>
      <div className="text-center text-xs text-gray-700 mt-2 bg-white/80 p-2 rounded-lg max-w-2xl mx-auto">
        Disclaimer: Not a clinician. For emergencies call your local helpline.
      </div>
    </div>
  );
};

export default Chat;
