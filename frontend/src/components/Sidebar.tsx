import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home, MessageCircle, Zap, BookOpen, User, Settings, Users } from 'lucide-react';
import React from 'react';

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // (no document-level scroll lock on hover — avoid scrollbar flicker)

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accentDark to-accent text-white flex flex-col justify-between z-10 overflow-hidden`}
      style={{
        width: isOpen ? '12rem' : '5rem',
        transition: 'width 400ms cubic-bezier(.22,.9,.36,1)',
        willChange: 'width',
        overflow: 'hidden',
      }}
  onWheel={handleWheel}
  onWheelCapture={handleWheel}
  onTouchMove={handleTouchMove}
    >
      {/* Top Section */}
      <div>
        {/* Logo + Toggle Button */}
        <div className="flex items-center justify-between p-4">
          <img
            src="/logo.png"
            alt="SukoonVerse"
            className="h-10 w-10 rounded-full border-2 border-accentDark"
          />
          <button onClick={onToggle} className="p-1 rounded-full transition-colors hover:bg-accentDark/80">
            {isOpen ? <ChevronLeft size={24} className="text-white" /> : <ChevronRight size={24} className="text-white" />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="mt-6 flex flex-col gap-4 select-none">
          <Link to="/" className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors hover:bg-accentDark/80">
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
          <Link to="/chat" className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors hover:bg-accentDark/80">
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
          <Link to="/mood" className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors hover:bg-accentDark/80">
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
          <Link to="/pulse" className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors hover:bg-accentDark/80">
            <Users size={22} className="text-white" />
            <span
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'opacity 300ms, transform 300ms',
                display: 'inline-block',
                width: isOpen ? 'auto' : 0,
              }}
            >Pulse</span>
          </Link>
          <Link to="/notes" className="flex items-center gap-3 px-4 py-2 rounded-md transition-colors hover:bg-accentDark/80">
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

      {/* Bottom Section */}
      <div className="flex flex-col gap-4 p-4 select-none">
        <Link to="/profile" className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors hover:bg-accentDark/80 ${isOpen ? '' : 'justify-center'}`}>
          <User size={22} className="text-white flex-none" />
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
        <Link to="/settings" className={`flex items-center gap-3 py-2 px-4 rounded-md transition-colors hover:bg-accentDark/80 ${isOpen ? '' : 'justify-center'}`}>
          <Settings size={22} className="text-white flex-none" />
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
  );
};

export default Sidebar;
