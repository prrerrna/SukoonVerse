import React from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatBubbleProps {
  role: 'user' | 'model';
  content: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ role, content }) => {
  const isUser = role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`rounded-lg px-4 py-3 max-w-xs lg:max-w-md shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white' // user message style
            : 'bg-white text-gray-800 border border-gray-100' // model message style
        }`}
        style={{ wordBreak: 'break-word' }}
      >
        <div className="text-xs mb-1 font-medium opacity-80">
          {isUser ? 'You' : 'Sukoon AI'}
        </div>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
