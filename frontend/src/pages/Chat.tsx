import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatBubble from '../components/ChatBubble';
import ChatToolbar from '../components/ChatToolbar';
import { 
  createNewChat, 
  sendRemoteMessage, 
  getRemoteMessages
} from '../lib/api';
import { 
  createChatSession, 
  getChatMessages, 
  addChatMessage
} from '../utils/indexeddb';
import { onAuthChange, FirebaseUser } from '../lib/firebase';

// Message interface for our app
interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  animate?: boolean;
}

const Chat: React.FC = () => {
  // Router
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();

  // UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // References
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for authentication changes
  useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, []);

  // Load messages when session ID changes
  useEffect(() => {
    const loadMessages = async () => {
      // Clear messages when no session ID is present
      if (!sessionId) {
        setMessages([]);
        setActiveChatId(null);
        return;
      }

      setActiveChatId(sessionId);
      
      try {
        if (user) {
          // Load remote messages for authenticated users
          const response = await getRemoteMessages(sessionId);
          const data = await response.json();
          
          setMessages(data.map((msg: any) => ({
            id: msg.id,
            role: msg.author === 'user' ? 'user' : 'model',
            content: msg.text,
            timestamp: new Date(msg.timestamp).getTime()
          })));
        } else {
          // Load local messages for guest users
          const localMessages = await getChatMessages(sessionId);
          
          setMessages(localMessages.map(msg => ({
            id: `${msg.sessionId}_${msg.timestamp}`,
            role: msg.author === 'user' ? 'user' : 'model',
            content: msg.text,
            timestamp: msg.timestamp
          })));
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Navigate to /chat if we can't load the session
        navigate('/chat', { replace: true });
      }
    };

    loadMessages();
  }, [sessionId, user, navigate]);

  // Handle sending messages
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const message = inputValue.trim();
    if (!message || isProcessing) return;
    
    setInputValue('');
    setIsProcessing(true);
    
    // Create a unique ID for the user message
    const userMessageId = `user_${Date.now()}`;
    
    // Add user message to the UI immediately
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: Date.now(),
      animate: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      if (user) {
        // Authenticated flow
        if (!sessionId) {
          // First message in a new conversation
          try {
            // Create a new chat session with the first message
            const response = await createNewChat(message);
            const { sessionId: newSessionId, initialResponse } = await response.json();
            
            // Update URL to include the session ID
            navigate(`/chat/${newSessionId}`, { replace: true });
            setActiveChatId(newSessionId);
            
            // Add the bot response
            const botMessage: Message = {
              id: `model_${Date.now()}`,
              role: 'model',
              content: initialResponse,
              timestamp: Date.now(),
              animate: true
            };
            
            setMessages(prev => [...prev, botMessage]);
            
            // Refresh the sidebar to show the new chat
            setRefreshTrigger(prev => prev + 1);
          } catch (error) {
            console.error('Failed to create new chat:', error);
            // Show error in UI
            setMessages(prev => [
              ...prev,
              {
                id: `error_${Date.now()}`,
                role: 'model',
                content: 'Sorry, I encountered an error creating a new chat. Please try again.',
                timestamp: Date.now(),
                animate: true
              }
            ]);
          }
        } else {
          // Subsequent message in existing conversation
          try {
            const response = await sendRemoteMessage(sessionId, message);
            const data = await response.json();
            
            // Add the bot response
            const botMessage: Message = {
              id: `model_${Date.now()}`,
              role: 'model',
              content: data.reply || data.text,
              timestamp: Date.now(),
              animate: true
            };
            
            setMessages(prev => [...prev, botMessage]);
          } catch (error) {
            console.error('Failed to send message:', error);
            // Show error in UI
            setMessages(prev => [
              ...prev,
              {
                id: `error_${Date.now()}`,
                role: 'model',
                content: 'Sorry, I encountered an error processing your message. Please try again.',
                timestamp: Date.now(),
                animate: true
              }
            ]);
          }
        }
      } else {
        // Guest flow using IndexedDB
        if (!sessionId) {
          // Create a new local session
          const newSession = await createChatSession('New Chat');
          
          // Add user message to local storage
          await addChatMessage({
            sessionId: newSession.id,
            author: 'user',
            text: message,
            timestamp: Date.now()
          });
          
          // Navigate to the new session
          navigate(`/chat/${newSession.id}`, { replace: true });
          setActiveChatId(newSession.id);
          
          // Simulate a response for the guest user
          setTimeout(() => {
            const botMessage: Message = {
              id: `model_${Date.now()}`,
              role: 'model',
              content: "Hello! I'm Sukoon AI. How can I help you today?",
              timestamp: Date.now(),
              animate: true
            };
            
            setMessages(prev => [...prev, botMessage]);
            
            // Add bot message to local storage
            addChatMessage({
              sessionId: newSession.id,
              author: 'bot',
              text: botMessage.content,
              timestamp: botMessage.timestamp
            });
            
            // Refresh the sidebar
            setRefreshTrigger(prev => prev + 1);
          }, 1000);
        } else {
          // Add user message to local storage
          await addChatMessage({
            sessionId,
            author: 'user',
            text: message,
            timestamp: Date.now()
          });
          
          // Simulate a response for the guest user
          setTimeout(() => {
            const botMessage: Message = {
              id: `model_${Date.now()}`,
              role: 'model',
              content: "I'm responding as a guest session. To get full AI responses, please log in.",
              timestamp: Date.now(),
              animate: true
            };
            
            setMessages(prev => [...prev, botMessage]);
            
            // Add bot message to local storage
            addChatMessage({
              sessionId,
              author: 'bot',
              text: botMessage.content,
              timestamp: botMessage.timestamp
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error in message handling:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle selecting a chat session
  const handleSelectSession = async (id: string | null) => {
    if (id) {
      navigate(`/chat/${id}`);
    } else {
      navigate('/chat');
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <ChatToolbar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeId={activeChatId}
        onSelect={handleSelectSession}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Chat Area */}
      <main 
        className="flex-1 flex flex-col transition-all duration-200 ease-in-out"
        style={{
          marginLeft: sidebarOpen ? '16rem' : '4rem'
        }}
      >
        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Welcome message when no messages exist */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <h1 className="text-2xl font-bold mb-2 text-accentDark">Welcome to Sukoon AI</h1>
              <p className="text-textSubtle mb-6">
                Your mental wellness companion. Ask me anything or share how you're feeling.
              </p>
              <div className="bg-surface p-4 rounded-lg shadow-md max-w-lg">
                <p className="text-sm text-textSubtle">Try asking:</p>
                <div className="mt-3 space-y-2">
                  {["I'm feeling anxious about work", 
                    "What are some breathing exercises for stress?", 
                    "How can I improve my sleep?"].map((suggestion, i) => (
                    <button
                      key={i}
                      className="block w-full text-left p-2 rounded-md hover:bg-border bg-background text-textMain text-sm"
                      onClick={() => setInputValue(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actual messages */}
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`${message.animate ? 'animate-fade-in-up' : ''}`}
            >
              <ChatBubble
                role={message.role}
                content={message.content}
              />
            </div>
          ))}

          {/* Loading indicator */}
          {isProcessing && (
            <div className="animate-fade-in-up">
              <ChatBubble
                role="model"
                content="..."
              />
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isProcessing}
              ref={inputRef}
            />
            <button
              type="submit"
              className="bg-accent text-buttontext px-4 py-2 rounded-lg hover:bg-accentDark focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              disabled={!inputValue.trim() || isProcessing}
            >
              Send
            </button>
          </form>
          
          {/* Disclaimer */}
          <p className="text-xs text-textSubtle text-center mt-2">
            Disclaimer: I'm an AI assistant, not a licensed mental health professional.
            For emergencies, please contact your local crisis helpline.
          </p>
        </div>
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease forwards;
        }
      `}</style>
    </div>
  );
};

export default Chat;
