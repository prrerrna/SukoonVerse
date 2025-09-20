// React 17+ JSX transform does not require React default import here.
import { motion } from 'framer-motion'; // Add animation library

// Define mood options with expanded properties including colors and emojis
const options = [
  { label: 'very sad', score: 1, emoji: '😞', color: 'hsl(0, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(0, 70%, 65%), hsl(0, 60%, 75%))' },
  { label: 'sad', score: 2, emoji: '😔', color: 'hsl(15, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(15, 70%, 65%), hsl(15, 60%, 75%))' },
  { label: 'anxious', score: 3, emoji: '😟', color: 'hsl(30, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(30, 70%, 65%), hsl(30, 60%, 75%))' },
  { label: 'frustrated', score: 4, emoji: '😠', color: 'hsl(45, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(45, 70%, 65%), hsl(45, 60%, 75%))' },
  { label: 'neutral', score: 5, emoji: '😐', color: 'hsl(60, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(60, 70%, 65%), hsl(60, 60%, 75%))' },
  { label: 'calm', score: 6, emoji: '😌', color: 'hsl(120, 40%, 65%)', gradient: 'linear-gradient(135deg, hsl(120, 40%, 65%), hsl(120, 50%, 75%))' },
  { label: 'content', score: 7, emoji: '🙂', color: 'hsl(150, 50%, 65%)', gradient: 'linear-gradient(135deg, hsl(150, 50%, 65%), hsl(150, 60%, 75%))' },
  { label: 'happy', score: 8, emoji: '😊', color: 'hsl(180, 60%, 65%)', gradient: 'linear-gradient(135deg, hsl(180, 60%, 65%), hsl(180, 70%, 75%))' },
  { label: 'joyful', score: 9, emoji: '😄', color: 'hsl(210, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(210, 70%, 65%), hsl(210, 80%, 75%))' },
  { label: 'elated', score: 10, emoji: '🤩', color: 'hsl(270, 70%, 65%)', gradient: 'linear-gradient(135deg, hsl(270, 70%, 65%), hsl(270, 80%, 75%))' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function MoodPicker({ 
  value, 
  onChange 
}: { 
  value: { label: string; score: number }; 
  onChange: (v: { label: string; score: number }) => void 
}) {
  // Find the selected mood option
  const selectedOption = options.find(opt => opt.label === value.label) || options[4]; // Default to neutral

  return (
    <div className="mb-3 relative">
      {/* Current mood display */}
      <motion.div 
        className="mb-4 p-4 rounded-xl shadow-sm"
        style={{
          background: selectedOption.gradient,
          boxShadow: `0 4px 20px ${selectedOption.color}40`
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{selectedOption.emoji}</span>
            <div>
              <h3 className="text-xl font-bold text-white capitalize">{selectedOption.label}</h3>
              <p className="text-white/80 text-sm">Intensity: {selectedOption.score}/10</p>
            </div>
          </div>
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white text-xl font-bold">
            {selectedOption.score}
          </div>
        </div>
      </motion.div>

      {/* Mood options grid */}
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-5 gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {options.map((opt) => (
          <motion.button
            key={opt.label}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange({ label: opt.label, score: opt.score })}
            className={`px-3 py-2 rounded-lg border min-w-0 text-center leading-tight break-words transition-all duration-200 flex flex-col items-center gap-1 ${
              value.label === opt.label
                ? 'bg-white shadow-lg border-transparent ring-2 ring-accent/60'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}
            style={{
              boxShadow: value.label === opt.label ? `0 4px 12px ${opt.color}40` : '',
            }}
            title={`Mood score: ${opt.score}/10`}
          >
            <span className="text-xl mb-1">{opt.emoji}</span>
            <span className={`text-xs sm:text-sm font-medium ${value.label === opt.label ? 'text-gray-800' : 'text-gray-600'}`}>
              {opt.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
      
      {/* Instructions */}
      <motion.div 
        className="mt-2 text-sm text-gray-600"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Select a mood that best represents how you feel (1–10 scale)
      </motion.div>
    </div>
  );
}
