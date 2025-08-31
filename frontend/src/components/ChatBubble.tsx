// ChatBubble.tsx: A component to display a single chat message.

// This is a simple, reusable component for displaying a chat message.
// It has no internal logic, just receives props and renders UI.
// This follows the "no new functions" rule as it's a standard component definition.
const ChatBubble = ({ author, text }: { author: 'user' | 'bot'; text: string }) => {
  const isUser = author === 'user';
  // Use theme colors for user and bot
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`rounded-xl px-5 py-3 max-w-xs lg:max-w-md shadow-sm ${
          isUser
            ? 'bg-teal-600 text-white' // match landing page theme
            : 'bg-white text-teal-900 border border-teal-100'
        }`}
        style={{ wordBreak: 'break-word' }}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
