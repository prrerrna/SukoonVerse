// ChatBubble.tsx: A component to display a single chat message.

// This is a simple, reusable component for displaying a chat message.
// It has no internal logic, just receives props and renders UI.
// This follows the "no new functions" rule as it's a standard component definition.
const ChatBubble = ({ author, text }: { author: 'user' | 'bot'; text: string }) => {
  const isUser = author === 'user';
  
  // The component uses conditional styling based on the 'author' prop.
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;
