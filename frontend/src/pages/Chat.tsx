// Chat.tsx: The main chat interface component where users interact with the AI.
import { useState, useRef, useEffect } from 'react';
import useSession from '../hooks/useSession';
import { sendMessage, generateChatTitle } from '../lib/api';
import ChatBubble from '../components/ChatBubble';
import BreathTimer from '../components/BreathTimer';
import { addSnapshot, addChatMessage, createChatSession, getActiveChatId, getChatMessages, setActiveChatId } from '../utils/indexeddb';
import ChatToolbar from '../components/ChatToolbar';

// This component handles the main chat functionality.
// All state and logic are managed inline using React hooks.

const Chat = () => {
  const { sessionId } = useSession();
  const [messages, setMessages] = useState<{ id: string; author: 'user' | 'bot'; text: string; floating?: boolean }[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isCrisis, setIsCrisis] = useState(false);
  const [activeChatId, setActiveChat] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [toolbarRefreshTick, setToolbarRefreshTick] = useState(0);
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !sessionId) return;
  // Ensure we have a chat session AFTER sending the first message
  let chatId = activeChatId || getActiveChatId();
    const userId = `u_${Date.now()}`;
    const userMessage = { id: userId, author: 'user' as const, text: inputValue, floating: true };
    setMessages(prev => [...prev, userMessage]);
    clearFloating(userId);
    const textToSend = inputValue;
    setInputValue('');
  // show typing indicator immediately (even while creating session/title)
  setIsTyping(true);
    // If no session yet, generate title and create it now, then persist message
    if (!chatId) {
      let title: string | null = null;
      try {
        const { title: serverTitle } = await generateChatTitle(textToSend);
        if (serverTitle && serverTitle.trim()) {
          title = serverTitle.trim();
        }
      } catch {}
      // Fallback: first 6 words
      if (!title) {
        const words = textToSend.trim().split(/\s+/).slice(0, 6);
        const raw = words.join(' ');
        // Basic title case
        const small = new Set(['a','an','the','and','or','but','for','nor','on','at','to','from','by','of','in','with']);
        const parts = raw.split(' ');
        title = parts
          .map((w, i) => {
            const wl = w.toLowerCase();
            if (i !== 0 && small.has(wl)) return wl;
            return wl.charAt(0).toUpperCase() + wl.slice(1);
          })
          .join(' ');
      }
      const s = await createChatSession(title || 'New chat');
      chatId = s.id;
      setActiveChatId(chatId);
      setActiveChat(chatId);
      // poke toolbar to refresh list
      setToolbarRefreshTick(t => t + 1);
    }
    // persist user message (now we definitely have chatId)
    await addChatMessage({ sessionId: chatId as string, author: 'user', text: textToSend, timestamp: Date.now() });
  try {
  const response = await sendMessage({ session_id: sessionId, message: textToSend, lang_hint: 'en', chat_id: chatId });
      const botId = `b_${Date.now()}`;
      const botMessage = { id: botId, author: 'bot' as const, text: response.reply, floating: true };
      setMessages(prev => [...prev, botMessage]);
      clearFloating(botId);
      setIsTyping(false);
      // persist bot message
  await addChatMessage({ sessionId: chatId as string, author: 'bot', text: response.reply, timestamp: Date.now() });
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
      setIsTyping(false);
      const errId = `e_${Date.now()}`;
      const errorMessage = { id: errId, author: 'bot' as const, text: 'Sorry, something went wrong.', floating: true };
      setMessages(prev => [...prev, errorMessage]);
      clearFloating(errId);
    }
  };

  // Load active session on mount (do not auto-create a session)
  useEffect(() => {
    (async () => {
      const chatId = getActiveChatId();
      setActiveChat(chatId);
      if (chatId) {
        const items = await getChatMessages(chatId);
        const hydrated = items.map(m => ({ id: `${m.author}_${m.timestamp}`, author: m.author as 'user' | 'bot', text: m.text }));
        setMessages(hydrated);
      } else {
        setMessages([]);
      }
    })();
  }, []);

  if (isCrisis) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-red-600">Need immediate help?</h2>
          <p className="mb-4">
            If you're experiencing a mental health crisis or emergency, please reach out to one of these resources immediately:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li className="mb-2">KIRAN National Mental Health Helpline: <a href="tel:18005990019" className="text-blue-600 underline">1800-599-0019</a></li>
            <li className="mb-2">iCALL (TISS) Counselling Helpline: <a href="tel:9152987821" className="text-blue-600 underline">9152987821</a></li>
            <li>Emergency Services (India): <a href="tel:112" className="text-blue-600 underline">112</a></li>
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
    <div className="flex min-h-screen bg-background">
      {/* Chat Toolbar styled like sidebar */}
  <ChatToolbar isOpen={toolbarOpen} onToggle={() => setToolbarOpen(o => !o)} activeId={activeChatId} refreshToken={toolbarRefreshTick} onSelect={async (id) => {
        setActiveChat(id || null);
        if (id) {
          setActiveChatId(id);
          const items = await getChatMessages(id);
          const hydrated = items.map(m => ({ id: `${m.author}_${m.timestamp}`, author: m.author as 'user' | 'bot', text: m.text }));
          setMessages(hydrated);
        } else {
          setMessages([]);
        }
      }} />
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

      {/* Main Chat Content with left margin to accommodate sidebar */}
  <div className={`flex-1 flex flex-col items-center pt-6 relative`} style={{ marginLeft: toolbarOpen ? '16rem' : '5rem', transition: 'margin-left 400ms cubic-bezier(.22,.9,.36,1)' }}>
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
            {isTyping && (
              <div className="floating" style={{ willChange: 'transform, opacity' }}>
                <ChatBubble
                  author="bot"
                  text={
                    <div className="flex items-center gap-1">
                      <span className="sr-only">Assistant is typing</span>
                      <span className="inline-block w-2 h-2 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="inline-block w-2 h-2 bg-teal-600 rounded-full animate-bounce [animation-delay:0s]"></span>
                      <span className="inline-block w-2 h-2 bg-teal-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    </div>
                  }
                />
              </div>
            )}
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
  <div className="text-center text-xs text-gray-700 mt-2 bg-white/80 p-2 rounded-lg max-w-4xl mx-auto">
          Disclaimer: Not a clinician. For emergencies call your local helpline.
        </div>
      </div>
  </div>
  );
};

export default Chat;
