import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Pencil, MessageSquare, Home, Users, BookOpen, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChatSession, deleteChatSession, listChatSessions, renameChatSession, setActiveChatId, getActiveChatId } from '../utils/indexeddb';

type ChatToolbarProps = {
  onSelect: (id: string) => void;
  activeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  refreshToken?: number;
};

const ChatToolbar: React.FC<ChatToolbarProps> = ({ onSelect, activeId, isOpen, onToggle, refreshToken }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const s = await listChatSessions();
    setSessions(s);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    // External signal (e.g., after creating a session elsewhere)
    if (typeof refreshToken !== 'undefined') {
      refresh();
    }
  }, [refreshToken]);

  const handleNew = async () => {
    // Start a fresh chat without creating a session yet; session will be created after first message
    setActiveChatId('');
    onSelect('');
  };

  const handleRename = async (id: string) => {
    const current = sessions.find(x => x.id === id);
    const title = prompt('Rename chat', current?.title || '');
    if (title !== null) {
      await renameChatSession(id, title.trim());
      await refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this chat?')) {
      await deleteChatSession(id);
      await refresh();
      const active = getActiveChatId();
      if (active === id) {
        setActiveChatId('');
        onSelect('');
      }
    }
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accentDark to-accent text-white flex flex-col justify-between z-20`}
      style={{
        width: isOpen ? '16rem' : '5rem',
        transition: 'width 400ms cubic-bezier(.22,.9,.36,1)',
        willChange: 'width',
      }}
    >
      {/* Top */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4">
          <img src="/logo.png" alt="SukoonVerse" className="h-10 w-10 rounded-full border-2 border-accentDark" />
          <button
            onClick={onToggle}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hover:bg-accentDark/80 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent"
          >
            {isOpen ? <ChevronLeft size={24} className="text-white" /> : <ChevronRight size={24} className="text-white" />}
          </button>
        </div>
        <div className="px-3">
          <button
            onClick={handleNew}
            className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent"
          >
            <Plus size={18} />
            <span style={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0, transition: 'opacity 300ms' }}>New chat</span>
          </button>
        </div>
        {/* Sessions list */}
        <div className="mt-4 px-2 overflow-y-auto flex-1 min-h-0">
          {loading && <div className="text-white/80 text-sm px-2">Loading…</div>}
          {!loading && sessions.length === 0 && (
            <div className="text-white/80 text-sm px-2">No chats yet. Create one.</div>
          )}
          {!loading && sessions.map(s => (
            <div
              key={s.id}
              className={`group flex items-center justify-between gap-2 px-2 py-2 rounded-md cursor-pointer ${activeId === s.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <button
                type="button"
                onClick={() => { setActiveChatId(s.id); onSelect(s.id); }}
                className="flex items-center gap-2 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent rounded"
              >
                <MessageSquare size={18} className="text-white" />
                <span
                  className="text-sm truncate flex-1"
                  style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateX(0)' : 'translateX(-12px)',
                    transition: 'opacity 250ms, transform 250ms',
                    display: 'inline-block',
                    width: isOpen ? 'auto' : 0,
                  }}
                >{s.title}</span>
              </button>
              <div
                className={`flex items-center gap-1 transition-opacity ${isOpen ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
                style={{ transition: 'opacity 200ms' }}
              >
                <button
                  onClick={() => handleRename(s.id)}
                  className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent rounded"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-red-300 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent rounded"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom quick links */}
      <div className="flex flex-col gap-3 p-4">
        <Link to="/" className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent ${isOpen ? 'hover:bg-accentDark/80' : 'justify-center'}`}>
          <div className={!isOpen ? 'bg-accentDark/40 rounded-lg p-2' : ''}>
            <Home size={20} className="text-white" />
          </div>
          <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 250ms', width: isOpen ? 'auto' : 0 }}>
            Home
          </span>
        </Link>
        <Link to="/pulse" className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent ${isOpen ? 'hover:bg-accentDark/80' : 'justify-center'}`}>
          <div className={!isOpen ? 'bg-accentDark/40 rounded-lg p-2' : ''}>
            <Users size={20} className="text-white" />
          </div>
          <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 250ms', width: isOpen ? 'auto' : 0 }}>
            Pulse
          </span>
        </Link>
        <Link to="/mood" className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent ${isOpen ? 'hover:bg-accentDark/80' : 'justify-center'}`}>
          <div className={!isOpen ? 'bg-accentDark/40 rounded-lg p-2' : ''}>
            <Zap size={20} className="text-white" />
          </div>
          <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 250ms', width: isOpen ? 'auto' : 0 }}>
            Mood
          </span>
        </Link>
        <Link to="/notes" className={`flex items-center gap-3 py-2 px-3 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent ${isOpen ? 'hover:bg-accentDark/80' : 'justify-center'}`}>
          <div className={!isOpen ? 'bg-accentDark/40 rounded-lg p-2' : ''}>
            <BookOpen size={20} className="text-white" />
          </div>
          <span style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 250ms', width: isOpen ? 'auto' : 0 }}>
            Notes
          </span>
        </Link>
      </div>
    </div>
  );
};

export default ChatToolbar;
