import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Home, MessageCircle, Zap, BookOpen, User, Settings, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import logo from '../images/logo.png';
import { firebaseAuth } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  
  // Handle scroll events to prevent body scrolling when hovering over sidebar
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Location is used directly in the components
  
  // Check for user authentication status
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);
  
  // We're using location.pathname directly in NavItem components

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accentDark to-accent text-white flex flex-col justify-between z-10 overflow-hidden shadow-xl`}
      style={{
        width: isOpen ? '12rem' : '5rem',
        transition: 'width 400ms cubic-bezier(.22,.9,.36,1), box-shadow 300ms ease',
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
        <div className="flex items-center justify-between p-4 border-b border-white/10 backdrop-blur-sm">
          {isOpen ? (
            <>
              <div className="flex items-center">
                <img 
                  src={logo}
                  alt="SukoonVerse" 
                  className="h-10 w-10 mr-2 transition-transform duration-300 hover:scale-110"
                />
                <span className="font-medium">SukoonVerse</span>
              </div>
              <button 
                onClick={onToggle} 
                className="p-1 rounded-full transition-all duration-300 hover:bg-accentDark/50 hover:scale-110"
                title="Collapse sidebar"
              >
                <ChevronLeft size={20} />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-between items-center">
              <div className="w-10 h-10 flex-shrink-0">
                <img 
                  src={logo}
                  alt="SukoonVerse" 
                  className="w-full h-full object-contain transition-all duration-300 hover:scale-110"
                />
              </div>
              <button 
                onClick={onToggle} 
                className="p-1 rounded-full transition-all duration-300 hover:bg-accentDark/50 hover:scale-110"
                title="Expand sidebar"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="mt-4 flex flex-col gap-2 select-none">
          {/* Navigation Items */}
          <NavItem 
            to="/" 
            icon={<Home size={22} />} 
            text="Home" 
            isOpen={isOpen} 
            isActive={location.pathname === '/'}
            setHoveredItem={setHoveredItem}
            tooltip="Home"
          />
          
          <NavItem 
            to="/chat" 
            icon={<MessageCircle size={22} />} 
            text="Let's Talk" 
            isOpen={isOpen} 
            isActive={location.pathname === '/chat'}
            setHoveredItem={setHoveredItem}
            tooltip="Chat"
          />
          
          <NavItem 
            to="/mood" 
            icon={<Zap size={22} />} 
            text="Mood" 
            isOpen={isOpen} 
            isActive={location.pathname === '/mood'}
            setHoveredItem={setHoveredItem}
            tooltip="Track Mood"
          />
          
          <NavItem 
            to="/pulse" 
            icon={<Users size={22} />} 
            text="Pulse" 
            isOpen={isOpen} 
            isActive={location.pathname === '/pulse'}
            setHoveredItem={setHoveredItem}
            tooltip="Community Pulse"
          />
          
          <NavItem 
            to="/notes" 
            icon={<BookOpen size={22} />} 
            text="Tell me" 
            isOpen={isOpen} 
            isActive={location.pathname === '/notes'}
            setHoveredItem={setHoveredItem}
            tooltip="Your Notes"
          />
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10 backdrop-blur-sm select-none">
        <NavItem 
          to={currentUser ? "/profile" : "/login"}
          icon={<User size={22} />} 
          text={currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0] || "Profile") : "Login"} 
          isOpen={isOpen} 
          isActive={location.pathname === '/login' || location.pathname === '/profile'}
          setHoveredItem={setHoveredItem}
          tooltip={currentUser ? "Profile" : "Login"}
        />
        
        <NavItem 
          to="/settings" 
          icon={<Settings size={22} />} 
          text="Settings" 
          isOpen={isOpen} 
          isActive={location.pathname === '/settings'}
          setHoveredItem={setHoveredItem}
          tooltip="Settings"
        />
      </div>
    </div>
  );
};

// Custom NavItem component with creative hover/active effects
interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isOpen: boolean;
  isActive: boolean;
  setHoveredItem: (path: string | null) => void;
  tooltip: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, text, isOpen, isActive, setHoveredItem, tooltip }) => {
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 py-2 px-4 rounded-md transition-all duration-300 ${
        isActive 
          ? 'bg-accentDark/30 font-medium' 
          : 'hover:bg-accentDark/20'
      }`}
      onMouseEnter={() => setHoveredItem(to)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      {/* Active indicator - pill that slides in */}
      {isActive && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-3/4 bg-white rounded-r-full animate-fadeInLeft" />
      )}
      
      {/* Icon with glow effect on hover/active */}
      <div className={`relative ${!isOpen && 'mx-auto'}`}>
        <div className={`transition-all duration-300 ${
          isActive ? 'text-white scale-110' : 'text-white/90 group-hover:text-white group-hover:scale-105'
        }`}>
          {icon}
        </div>
        
        {/* Subtle glow effect */}
        <div className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${
          isActive ? 'bg-white/20 opacity-100' : 'bg-white/0 opacity-0 group-hover:opacity-50 group-hover:bg-white/10'
        }`} />
      </div>
      
      {/* Text that fades/slides in and out */}
      {isOpen && (
        <span className={`whitespace-nowrap transition-all duration-300 ${
          isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
        }`}>
          {text}
        </span>
      )}
      
      {/* Tooltip for collapsed state */}
      {!isOpen && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-accentDark/90 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </Link>
  );
};

export default Sidebar;
