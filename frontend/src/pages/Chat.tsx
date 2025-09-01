// Chat.tsx: The main chat interface component where users interact with the AI.
import { useState, useRef, useEffect } from 'react';
import useSession from '../hooks/useSession';
import { sendMessage } from '../lib/api';
import ChatBubble from '../components/ChatBubble';
import BreathTimer from '../components/BreathTimer';
import { addSnapshot } from '../utils/indexeddb';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Home,
  MessageCircle,
  Zap,
  BookOpen,
  User,
  Settings
} from 'lucide-react';

// This component handles the main chat functionality.
// All state and logic are managed inline using React hooks.

const Chat = () => {
  const { sessionId } = useSession();
  const [messages, setMessages] = useState<{ id: string; author: 'user' | 'bot'; text: string; floating?: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCrisis, setIsCrisis] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // sidebar state
  const [musicOn, setMusicOn] = useState(false); // music toggle
  // For toggle animation
  const handleMusicToggle = () => setMusicOn((prev) => !prev);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  useEffect(() => {
    if (audioRef.current) {
      if (musicOn) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [musicOn]);

  const clearFloating = (id: string) => {
    setTimeout(() => {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, floating: false } : m)));
    }, 650);
  };

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
      if (response.mood && typeof response.mood === 'object') {
        const moodData = {
          label: response.mood.label || 'neutral',
          score: response.mood.score || 5,
          journal: undefined,
          source: 'chat' as const
        };
        await addSnapshot(moodData);
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Calming Music Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onError={() => setMusicOn(false)}
        style={{ display: 'none' }}
      >
        <source src="/sounds/calm-music-64526.mp3" type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>

      {/* Sidebar Navigation (copied from Onboard) */}
      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accentDark to-accent text-white flex flex-col justify-between z-10`}
        style={{
          width: isOpen ? '16rem' : '5rem',
          transition: 'width 400ms cubic-bezier(.22,.9,.36,1)',
          willChange: 'width',
        }}
      >
        <div>
          <div className="flex items-center justify-between p-4">
            <img src="/logo.png" alt="SukoonVerse" className="h-10 w-10 rounded-full" />
            <button onClick={() => setIsOpen(!isOpen)} className="hover:bg-accentDark/80 p-1 rounded-full">
              {isOpen ? <ChevronLeft size={24} className="text-white" /> : <ChevronRight size={24} className="text-white" />}
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 px-4 hover:bg-accentDark/80 py-2 rounded-md">
              <Home size={22} className="text-white" />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Home</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-3 px-4 hover:bg-accentDark/80 py-2 rounded-md">
              <MessageCircle size={22} className="text-white" />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Let's Talk</span>
            </Link>
            <Link to="/mood" className="flex items-center gap-3 px-4 hover:bg-accentDark/80 py-2 rounded-md">
              <Zap size={22} className="text-white" />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Mood</span>
            </Link>
            <Link to="/Notes" className="flex items-center gap-3 px-4 hover:bg-accentDark/80 py-2 rounded-md">
              <BookOpen size={22} className="text-white" />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Tell me</span>
            </Link>
          </nav>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <Link to="/" className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors ${isOpen ? 'hover:bg-accentDark/80' : 'justify-center'}`}>
            <div className={!isOpen ? 'bg-accentDark/40 rounded-lg p-2' : ''}>
              <User size={22} className="text-white" />
            </div>
            <span
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'opacity 300ms, transform 300ms',
                display: 'inline-block',
                width: isOpen ? 'auto' : 0,
              }}
            >Profile</span>
          </Link>
          <Link to="/" className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors ${isOpen ? 'hover:bg-accentDark/80' : 'justify-center'}`}>
            <div className={!isOpen ? 'bg-accentDark/40 rounded-lg p-2' : ''}>
              <Settings size={22} className="text-white" />
            </div>
            <span
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'opacity 300ms, transform 300ms',
                display: 'inline-block',
                width: isOpen ? 'auto' : 0,
              }}
            >Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Chat Content with left margin to accommodate sidebar */}
      <div
        className={`flex-1 flex flex-col items-center pt-8 relative`}
        style={{
          marginLeft: isOpen ? '16rem' : '5rem',
          transition: 'margin-left 400ms cubic-bezier(.22,.9,.36,1)',
          willChange: 'margin-left',
        }}
      >
        {/* Calming Music Toggle Switch */}
        <div className="absolute top-2 right-4 z-20 flex items-center">
          {/* Music note icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-6 w-6 text-accentDark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18V5l12-2v13" />
            <circle cx="5" cy="19" r="3" />
          </svg>
          <button
            onClick={handleMusicToggle}
            className={`relative w-14 h-8 bg-border rounded-full transition-colors duration-300 focus:outline-none shadow-md`}
            aria-label={musicOn ? 'Pause Calming Music' : 'Play Calming Music'}
          >
            <span
              className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${musicOn ? 'translate-x-6' : ''}`}
              style={{ willChange: 'transform' }}
            >
              {musicOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 m-auto text-accentDark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 m-auto text-accentDark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" /><circle cx="5" cy="19" r="2" /></svg>
              )}
            </span>
            {/* Track color change */}
            <span
              className={`absolute inset-0 rounded-full pointer-events-none transition-colors duration-300 ${musicOn ? 'bg-accent' : 'bg-border'}`}
            />
          </button>
        </div>
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

        <div className="w-full max-w-2xl flex flex-col flex-1 p-0 mb-4">
          {/* Chat Area - no visible boundary, just spacing */}
          <div ref={containerRef} className="flex-1 overflow-y-auto px-2 pb-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.floating ? 'floating' : undefined}
                style={{ willChange: 'transform, opacity' }}
              >
                <ChatBubble author={msg.author} text={msg.text} />
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="flex items-center mt-2">
            <div className="flex items-center w-full bg-white rounded-full shadow border border-border">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 p-3 outline-none text-gray-700 bg-transparent"
                placeholder="Type your message..."
              />
              <button type="submit" className="p-3 text-accentDark hover:text-accentDark/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5"></path>
                  <path d="m5 12 7-7 7 7"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
        <div className="text-center text-xs text-gray-700 mt-2 bg-white/80 p-2 rounded-lg max-w-2xl mx-auto">
          Disclaimer: Not a clinician. For emergencies call your local helpline.
        </div>
      </div>
    </div>
  );
};

export default Chat;
