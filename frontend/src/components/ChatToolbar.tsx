import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Home, Activity, Heart, LogOut } from 'lucide-react';
import { firebaseAuth } from '../lib/firebase';
import { ChatSession, deleteChatSession, listChatSessions, renameChatSession } from '../utils/indexeddb';
import { getRemoteChatSessions } from '../lib/api';
import Logo from './Logo';

interface ChatToolbarProps {
  onSelect: (id: string | null) => void;
  activeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger?: number;
}

const ChatToolbar: React.FC<ChatToolbarProps> = ({ 
  onSelect, 
  activeId, 
  isOpen, 
  onToggle,
  refreshTrigger = 0
}) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  const isLoggedIn = () => !!firebaseAuth?.currentUser;

  // Load sessions based on authentication status
  const loadSessions = async () => {
    setLoading(true);
    
    try {
      if (isLoggedIn()) {
        // Load remote sessions from Firebase if logged in
        const response = await getRemoteChatSessions();
        const data = await response.json();
        
        // Map the remote sessions to match our ChatSession type
        const remoteSessions = data.map((session: any) => ({
          id: session.id,
          title: session.title || 'Untitled Chat',
          createdAt: session.createdAt ? new Date(session.createdAt).getTime() : Date.now(),
          updatedAt: session.updatedAt ? new Date(session.updatedAt).getTime() : Date.now()
        }));
        
        setSessions(remoteSessions);
      } else {
        // Load local sessions from IndexedDB if not logged in
        const localSessions = await listChatSessions();
        setSessions(localSessions);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load of sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Refresh when triggered externally (e.g., after creating a new session)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadSessions();
    }
  }, [refreshTrigger]);

  // Handle creating a new chat
  const handleNewChat = () => {
    navigate('/chat');
    onSelect(null);
  };

  // Handle renaming a chat
  const handleRename = async (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    
    const newTitle = prompt('Rename chat', session.title || 'Untitled');
    if (!newTitle) return;
    
    if (isLoggedIn()) {
      // For remote sessions, we would need to implement this
      alert('Renaming remote sessions is not implemented yet');
    } else {
      await renameChatSession(id, newTitle);
    }
    
    await loadSessions();
  };

  // Handle deleting a chat
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    if (isLoggedIn()) {
      // For remote sessions, we would need to implement this
      alert('Deleting remote sessions is not implemented yet');
    } else {
      await deleteChatSession(id);
      if (activeId === id) {
        navigate('/chat');
        onSelect(null);
      }
    }
    
    await loadSessions();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accentDark to-accent text-white flex flex-col z-20 transition-all duration-300 shadow-xl ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm">
          {isOpen ? (
            <>
              <div className="flex items-center">
                <Logo size={32} />
                <span className="font-medium ml-2">SukoonVerse</span>
              </div>
              <button 
                onClick={onToggle} 
                className="p-1 rounded-full transition-colors hover:bg-accentDark/80"
                title="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-between items-center">
              <div className="flex-shrink-0">
                <Logo size={30} />
              </div>
              <button 
                onClick={onToggle} 
                className="p-1 rounded-full transition-colors hover:bg-accentDark/80"
                title="Expand sidebar"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-2 space-y-1">
          <button
            onClick={handleNewChat}
            className={`flex items-center gap-2 w-full p-2 rounded-md hover:bg-accentDark/30 transition-colors ${
              !isOpen ? 'justify-center' : ''
            }`}
            title="New Chat"
          >
            <Plus size={18} className="text-white" />
            {isOpen && <span className="font-medium">New Chat</span>}
          </button>
        </div>
        
        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {isOpen ? (
            <h3 className="text-xs uppercase tracking-wider text-white font-semibold mb-2 px-2">
              {isLoggedIn() ? 'CLOUD CHATS' : 'LOCAL CHATS'}
            </h3>
          ) : (
            <div className="flex justify-center py-1">
              <div className="w-8 border-b border-white/10"></div>
            </div>
          )}

          {loading ? (
            <div className={`text-white text-sm p-2 ${!isOpen ? 'text-center' : ''}`}>
              {isOpen ? 'Loading...' : '...'}
            </div>
          ) : sessions.length === 0 ? (
            <div className={`text-white text-sm p-2 ${!isOpen ? 'text-center' : ''}`}>
              {isOpen ? 'No chats yet' : '—'}
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map(session => (
                <div 
                  key={session.id}
                  className={`group flex items-center justify-between rounded-md p-2 cursor-pointer transition-all duration-200 ${
                    activeId === session.id 
                      ? 'bg-accentDark/30 text-white' 
                      : 'hover:bg-accentDark/30'
                  }`}
                  onClick={() => onSelect(session.id)}
                  title={!isOpen ? (session.title || 'Untitled') : ''}
                >
                  <div className={`flex-1 min-w-0 ${!isOpen ? 'text-center' : ''}`}>
                    <span className={`block text-sm truncate ${activeId === session.id ? 'font-medium' : ''}`}>
                      {isOpen 
                        ? (session.title || 'Untitled') 
                        : (session.title?.[0]?.toUpperCase() || 'U')}
                    </span>
                    {isOpen && (
                      <span className="text-xs text-white/70">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  {isOpen && (
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRename(session.id);
                        }}
                        className="p-1 rounded-full hover:bg-accentDark/30 transition-colors"
                        title="Rename chat"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        className="p-1 rounded-full hover:bg-accentDark/30 transition-colors"
                        title="Delete chat"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Navigation Icons */}
        <div className="p-2 border-t border-white/10 backdrop-blur-sm">
          <div className={`flex ${isOpen ? 'justify-around' : 'flex-col space-y-3 items-center pt-2'}`}>
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accentDark/30 rounded-full transition-all hover:scale-110"
              title="Home"
            >
              <Home size={20} />
            </button>
            <button
              onClick={() => navigate('/pulse')}
              className="p-2 hover:bg-accentDark/30 rounded-full transition-all hover:scale-110"
              title="Pulse"
            >
              <Activity size={20} />
            </button>
            <button
              onClick={() => navigate('/mood')}
              className="p-2 hover:bg-accentDark/30 rounded-full transition-all hover:scale-110"
              title="Mood"
            >
              <Heart size={20} />
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className={`p-4 border-t border-white/10 backdrop-blur-sm ${!isOpen ? 'mt-auto' : ''}`}>
          {isOpen && (
            <>
              <div className="text-sm mb-2">
                {isLoggedIn() ? (
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accentDark/30">
                    <span className="font-medium">
                      {firebaseAuth?.currentUser?.displayName || 'Logged In'}
                    </span>
                    <button
                      onClick={async () => {
                        if (firebaseAuth) await firebaseAuth.signOut();
                        window.location.href = '/login';
                      }}
                      className="p-1 hover:bg-accentDark/30 rounded-full transition-all hover:scale-110"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full p-2 rounded-lg text-white hover:bg-accentDark/30 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
              <div className="text-xs text-white/70 text-center mt-2">
                {isLoggedIn() ? 'Chats are stored in the cloud' : 'Chats are stored locally'}
              </div>
            </>
          )}
          {!isOpen && (
            <button 
              className="p-2 w-full flex justify-center hover:bg-accentDark/30 rounded-full transition-all hover:scale-110"
              onClick={() => isLoggedIn() ? (firebaseAuth?.signOut()) : navigate('/login')}
              title={isLoggedIn() ? "Sign Out" : "Sign In"}
            >
              <LogOut size={18} className={isLoggedIn() ? "" : "rotate-180"} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ChatToolbar;