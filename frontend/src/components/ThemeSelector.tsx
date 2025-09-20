import { useState } from 'react';
import { motion } from 'framer-motion';

type ThemeProps = {
  value: string[];
  onChange: (themes: string[]) => void;
  maxSelections?: number;
  themes: string[];
};

const ThemeSelector: React.FC<ThemeProps> = ({ value, onChange, maxSelections = 3, themes }) => {
  // State for displaying messages
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');

  // Get color based on theme name
  const getThemeColor = (theme: string) => {
    const themeMap: Record<string, string> = {
      'exam': '#f97316',        // Orange
      'sleep': '#8b5cf6',       // Purple
      'family': '#ec4899',      // Pink
      'peer pressure': '#0ea5e9', // Blue
      'loneliness': '#6366f1',  // Indigo
      'friends': '#22c55e',     // Green
      'relationships': '#f43f5e', // Rose
      'stress': '#ef4444',      // Red
      'social': '#3b82f6',      // Blue
      'money': '#65a30d',       // Lime
      'health': '#14b8a6',      // Teal
      'career': '#f59e0b',      // Amber
    };

    return themeMap[theme.toLowerCase()] || '#6b7280'; // Gray default
  };

  // Get emoji based on theme name
  const getThemeEmoji = (theme: string) => {
    const emojiMap: Record<string, string> = {
      'exam': '📝',
      'sleep': '😴',
      'family': '👨‍👩‍👧‍👦',
      'peer pressure': '👥',
      'loneliness': '🧍',
      'friends': '🤝',
      'relationships': '💞',
      'stress': '😰',
      'social': '🎭',
      'money': '💰',
      'health': '🏥',
      'career': '💼',
    };

    return emojiMap[theme.toLowerCase()] || '🏷️'; // Tag default
  };

  // Toggle theme selection
  const toggleTheme = (theme: string) => {
    if (value.includes(theme)) {
      // Remove theme if already selected
      onChange(value.filter(t => t !== theme));
    } else {
      // Add theme if not at max selections
      if (value.length >= maxSelections) {
        setMessage(`You can only select up to ${maxSelections} themes`);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
        return;
      }
      onChange([...value, theme]);
    }
  };

  // Sort themes alphabetically
  const sortedThemes = [...themes].sort();

  return (
    <div className="relative w-full">
      <motion.div 
        className="flex flex-wrap gap-1 sm:gap-2 mt-2 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {sortedThemes.map((theme) => (
          <motion.button
            key={theme}
            onClick={() => toggleTheme(theme)}
            className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg flex items-center gap-1 sm:gap-2 transition-all duration-200 text-xs sm:text-sm whitespace-nowrap ${
              value.includes(theme)
                ? 'text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: value.includes(theme) ? getThemeColor(theme) : '',
              boxShadow: value.includes(theme) ? `0 2px 8px ${getThemeColor(theme)}40` : '',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{getThemeEmoji(theme)}</span>
            <span className="text-sm font-medium capitalize">{theme}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Selection limit message */}
      <AnimatedMessage show={showMessage} message={message} />
    </div>
  );
};

// Animated message component
const AnimatedMessage = ({ show, message }: { show: boolean; message: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={show ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: -10, height: 0 }}
      className="absolute top-full left-0 w-full mt-2"
    >
      <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm">
        {message}
      </div>
    </motion.div>
  );
};

export default ThemeSelector;