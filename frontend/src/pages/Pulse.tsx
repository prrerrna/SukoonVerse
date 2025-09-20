// Pulse.tsx: A page for checking in with your emotional well-being.
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { Heart, Clock, Edit3, AlertCircle, Check, Frown, Meh, Smile, SmilePlus, AlertTriangle } from 'lucide-react';

// Define types for our Pulse entry
interface PulseEntry {
  id: string;
  mood: number; // 1-5 scale
  note?: string;
  timestamp: number;
}

// Component for the pulse mood picker
const MoodSelector = ({ selectedMood, onSelectMood }: { 
  selectedMood: number | null;
  onSelectMood: (mood: number) => void;
}) => {
  // Define the moods with their emojis and labels
  const moods = [
    { value: 1, emoji: <Frown size={32} />, label: "Awful" },
    { value: 2, emoji: <AlertTriangle size={32} />, label: "Bad" },
    { value: 3, emoji: <Meh size={32} />, label: "Okay" },
    { value: 4, emoji: <Smile size={32} />, label: "Good" },
    { value: 5, emoji: <SmilePlus size={32} />, label: "Great" },
  ];

  return (
    <div className="flex justify-center my-8">
      <div className="flex space-x-4 md:space-x-8">
        {moods.map((mood) => (
          <motion.button
            key={mood.value}
            className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
              selectedMood === mood.value 
                ? 'bg-accent text-white shadow-lg' 
                : 'bg-white hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectMood(mood.value)}
          >
            <div className="mb-2">
              {mood.emoji}
            </div>
            <span className="text-sm font-medium">{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Format a timestamp into a readable date
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Get mood emoji based on the mood value
const getMoodEmoji = (mood: number) => {
  switch (mood) {
    case 1: return <Frown size={20} />;
    case 2: return <AlertTriangle size={20} />;
    case 3: return <Meh size={20} />;
    case 4: return <Smile size={20} />;
    case 5: return <SmilePlus size={20} />;
    default: return <Meh size={20} />;
  }
};

const Pulse = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [pulseEntries, setPulseEntries] = useState<PulseEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load pulse entries from IndexedDB on component mount
  useEffect(() => {
    const loadPulseEntries = async () => {
      try {
        const db = await openDB('sakhi-journal', 2);
        
        // Check if 'pulse-entries' store exists
        if (!db.objectStoreNames.contains('pulse-entries')) {
          // Close current connection
          db.close();
          // Upgrade database to include pulse-entries store
          const updatedDb = await openDB('sakhi-journal', 3, {
            upgrade(db, oldVersion, newVersion) {
              if (oldVersion < 3) {
                const store = db.createObjectStore('pulse-entries', {
                  keyPath: 'id'
                });
                store.createIndex('timestamp', 'timestamp');
              }
            }
          });
          updatedDb.close();
        }
        
        const newDb = await openDB('sakhi-journal', 3);
        // Get all entries and sort by timestamp (newest first)
        const entries = await newDb.getAll('pulse-entries');
        setPulseEntries(entries.sort((a, b) => b.timestamp - a.timestamp));
        newDb.close();
      } catch (error) {
        console.error('Error loading pulse entries:', error);
      }
    };

    loadPulseEntries();
  }, []);

  // Handle mood selection
  const handleMoodSelect = (mood: number) => {
    setSelectedMood(mood);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedMood === null) return;
    
    setIsSubmitting(true);
    
    try {
      const newEntry: PulseEntry = {
        id: uuidv4(),
        mood: selectedMood,
        note: note.trim() || undefined,
        timestamp: Date.now()
      };
      
      const db = await openDB('sakhi-journal', 3);
      await db.add('pulse-entries', newEntry);
      db.close();
      
      // Update UI with the new entry
      setPulseEntries(prev => [newEntry, ...prev]);
      
      // Reset form
      setSelectedMood(null);
      setNote('');
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving pulse entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
      
      {/* Main Content */}
      <motion.div 
        className="flex-1 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
          {/* Header */}
          <header className="mb-6">
            <motion.h1 
              className="text-3xl font-bold mb-2"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
            >
              How is your pulse today?
            </motion.h1>
            <motion.p 
              className="text-gray-600"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Take a moment to check in with yourself. It's a simple step towards understanding your emotional well-being.
            </motion.p>
          </header>

          {/* Pulse Check-in Card */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Heart className="mr-2 text-accent" size={20} />
              Pulse Check-in
            </h2>
            
            {/* Mood Selector */}
            <MoodSelector selectedMood={selectedMood} onSelectMood={handleMoodSelect} />
            
            {/* Note Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Edit3 className="mr-2" size={16} /> 
                Add a note (optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-lg focus:ring focus:ring-accent/20 focus:outline-none"
                rows={4}
                placeholder="What's on your mind?..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              ></textarea>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                className={`py-2 px-6 rounded-lg flex items-center ${
                  selectedMood === null
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-accent text-white hover:bg-accentDark'
                }`}
                whileHover={selectedMood !== null ? { scale: 1.02 } : {}}
                whileTap={selectedMood !== null ? { scale: 0.98 } : {}}
                disabled={selectedMood === null || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  <span>Log Your Pulse</span>
                )}
              </motion.button>
            </div>
            
            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Check className="mr-2" size={18} />
                  Your pulse has been logged successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Check-ins */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2 text-accent" size={20} />
              Recent Check-ins
            </h2>
            
            {pulseEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto mb-3" size={32} />
                <p>No recent check-ins. Log your pulse to see your history here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pulseEntries.slice(0, 10).map((entry) => (
                  <motion.div 
                    key={entry.id} 
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getMoodEmoji(entry.mood)}
                        </div>
                        <div className="font-medium">
                          {entry.mood === 1 ? 'Awful' : 
                           entry.mood === 2 ? 'Bad' : 
                           entry.mood === 3 ? 'Okay' : 
                           entry.mood === 4 ? 'Good' : 'Great'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                    {entry.note && (
                      <div className="mt-2 text-gray-600">
                        {entry.note}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Pulse;
