import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// Define common emoji categories for quick access
const emojiCategories = [
  { 
    name: 'Emotions',
    emojis: ['😊', '😄', '🙂', '😌', '😍', '🥰', '😭', '😢', '😞', '😔', '😟', '😠', '😡', '😤']
  },
  {
    name: 'Activities',
    emojis: ['🏃', '🚶', '🧘', '🛌', '🍽️', '📚', '💻', '🎮', '🎧', '🎬', '🎨', '✍️', '📱', '💤'] 
  },
  {
    name: 'Nature',
    emojis: ['🌞', '🌧️', '⛈️', '❄️', '🌈', '🌊', '🌲', '🌸', '🌺', '🌷', '🍃', '🍂', '🌙', '⭐'] 
  },
  {
    name: 'Objects',
    emojis: ['☕', '🍵', '🥤', '🍷', '🧸', '💊', '💉', '🏠', '🚗', '✈️', '⏰', '📝', '📅', '🎁']
  }
];

export default function JournalEntry({ onSave }: { onSave: (journal: string) => Promise<void> | void }) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize text area as content grows
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [text]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) && 
        (event.target as HTMLElement).id !== 'emoji-button'
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Insert emoji at cursor position or at the end
  const insertEmoji = (emoji: string) => {
    if (textAreaRef.current) {
      const cursorPos = textAreaRef.current.selectionStart;
      const textBeforeCursor = text.substring(0, cursorPos);
      const textAfterCursor = text.substring(cursorPos);
      
      setText(textBeforeCursor + emoji + textAfterCursor);
      
      // Set cursor position after the inserted emoji
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          const newCursorPos = cursorPos + emoji.length;
          textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    } else {
      setText(text + emoji);
    }
  };

  return (
    <div className="mt-3 w-full overflow-hidden">
      <label htmlFor="journal-entry" className="block text-sm font-medium text-gray-700 mb-1">
        Journal Entry (optional)
      </label>
      
      <motion.div 
        className={`relative border rounded-lg overflow-hidden transition-all w-full ${isFocused ? 'shadow-md ring-1 ring-accent/30' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <textarea 
          ref={textAreaRef}
          id="journal-entry"
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="How are you feeling today? What's on your mind?" 
          className="w-full p-4 min-h-[120px] resize-none focus:outline-none" 
          style={{ 
            background: 'linear-gradient(to bottom, white, rgba(250, 250, 250, 0.8))',
            fontSize: '0.95rem',
            lineHeight: 1.6
          }}
        />
        
        {/* Emoji picker button */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          <motion.button
            id="emoji-button"
            type="button"
            className="p-2 rounded-full text-gray-500 hover:text-accent hover:bg-accent/10 transition-colors"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">😊</span>
          </motion.button>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <motion.div 
            ref={emojiPickerRef}
            className="absolute bottom-12 left-2 bg-white rounded-lg shadow-lg border p-2 sm:p-3 w-52 sm:w-64 z-10 max-w-[calc(100%-1rem)]"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 mb-2 border-b pb-2">
              {emojiCategories.map((category, idx) => (
                <button 
                  key={category.name}
                  onClick={() => setActiveCategory(idx)}
                  className={`px-1 sm:px-2 py-0.5 sm:py-1 text-xs rounded-md ${activeCategory === idx 
                    ? 'bg-accent/15 text-accent font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* Emoji grid */}
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
              {emojiCategories[activeCategory].emojis.map((emoji, idx) => (
                <motion.button 
                  key={idx}
                  className="p-1 text-lg hover:bg-gray-100 rounded"
                  onClick={() => insertEmoji(emoji)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 w-full">
        <div className="text-xs text-gray-500">
          {text.length > 0 ? `${text.length} characters` : 'Express yourself freely'}
        </div>
        
        <motion.button
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow transition-colors text-sm sm:text-base w-full sm:w-auto"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            if (text.trim()) {
              await onSave(text);
              setText('');
              if (textAreaRef.current) {
                textAreaRef.current.style.height = 'auto';
              }
            }
          }}
          disabled={!text.trim()}
        >
          <div className="flex items-center justify-center gap-2">
            <span>Save Entry</span>
            {text.trim() && <span>✓</span>}
          </div>
        </motion.button>
      </div>
    </div>
  );
}
