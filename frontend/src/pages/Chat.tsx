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
