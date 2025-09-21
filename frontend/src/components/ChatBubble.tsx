import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
  timestamp?: Date;
  isCrisis?: boolean;
}

// Format timestamp to readable time
const formatTime = (date?: Date) => {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  role, 
  content, 
  timestamp = new Date(),
  isCrisis = false
}) => {
  const isUser = role === 'user';
  const [animationComplete, setAnimationComplete] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  // Simple animation duration values
  const animationDuration = 0.3;
  const animationDelay = 0.1;
  
  // Effect for animation completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 transition-all duration-300 ease-in-out`}
      style={{
        opacity: animationComplete ? 1 : 0,
        transform: `translateY(${animationComplete ? '0' : '10px'})`,
        transition: `opacity ${animationDuration}s ease, transform ${animationDuration}s ease`,
        transitionDelay: `${animationDelay}s`
      }}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white">
            S
          </div>
        </div>
      )}
      
      <div
        ref={bubbleRef}
        className={`
          relative rounded-2xl px-5 py-4 max-w-xs lg:max-w-md 
          ${isUser 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30' 
            : content.includes('CRISIS ALERT') 
              ? 'bg-gradient-to-br from-red-50 to-red-100 text-gray-800 border border-red-200 shadow-lg' 
              : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 border border-gray-100 shadow-lg'
          } 
          shadow-md hover:shadow-xl transition-all duration-300 ease-in-out
        `}
        style={{ 
          wordBreak: 'break-word',
          transform: `scale(${animationComplete ? 1 : 0.95})`,
        }}
      >
        {/* Chat bubble content start */}
        
        <div className={`flex justify-between items-center mb-2`}>
          <div className={`text-xs font-medium ${
            isUser 
              ? 'text-blue-100' 
              : content.includes('CRISIS ALERT') 
                ? 'text-red-600' 
                : 'text-purple-600'
            } flex items-center`}>
            {isUser ? (
              <>
                <span>You</span>
              </>
            ) : (
              <>
                <span>{content.includes('CRISIS ALERT') ? '⚠️ ' : ''}Sukoon AI</span>
              </>
            )}
          </div>
          <div className={`text-[10px] ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
            {formatTime(timestamp)}
          </div>
        </div>
        
        <div className={`prose prose-sm max-w-none ${
          isUser 
            ? 'text-gray-100' 
            : content.includes('CRISIS ALERT') 
              ? 'text-gray-900 prose-strong:text-red-600'
              : 'text-gray-800'
        }`}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {/* Chat bubble content end */}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg border-2 border-white">
            U
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
