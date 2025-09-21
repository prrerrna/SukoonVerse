// Pulse.tsx: A page for checking in with your emotional well-being.
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { Heart, Clock, Edit3, Frown, Meh, Smile, SmilePlus, AlertTriangle } from 'lucide-react';
import { getPulseSummary } from '../lib/api';
// Will re-enable for authenticated features
// import useSession from '../hooks/useSession';
import BreathTimer from '../components/BreathTimer';

// Define types for our Pulse entry
interface PulseEntry {
  id: string;
  mood: number; // 1-5 scale
  timestamp: number;
  notes: string;
  tags: string[];
}

interface PulseSummary {
  averageMood: number;
  moodCounts: Record<string, number>;
  moodTrend: string;
  recentTags: string[];
  userCount: number;
}

const Pulse = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pulseEntries, setPulseEntries] = useState<PulseEntry[]>([]);
  const [pulseSummary, setPulseSummary] = useState<PulseSummary | null>(null);
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
  const [customTag, setCustomTag] = useState('');
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  // We don't need showMoodSelector state as we use showAddEntry instead
  // We'll keep the session reference for future authenticated features
  // For now commenting out to avoid unused variable warnings
  // const { sessionId } = useSession();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Suggested tags
  const suggestedTags = [
    'Stress', 'Anxiety', 'Relief', 'Happy', 'Calm', 
    'Worried', 'Excited', 'Tired', 'Focused', 'Distracted',
    'Hopeful', 'Grateful', 'Frustrated', 'Overwhelmed', 'Proud'
  ];

  // Fetch community pulse data
  useEffect(() => {
    const fetchCommunityPulse = async () => {
      try {
        setIsLoadingCommunity(true);
        const data = await getPulseSummary('default');
        setPulseSummary(data);
      } catch (error) {
        console.error('Error fetching community pulse:', error);
      } finally {
        setIsLoadingCommunity(false);
      }
    };

    fetchCommunityPulse();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchCommunityPulse, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize IndexedDB for storing pulse entries
  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await openDB('pulse-db', 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains('entries')) {
              db.createObjectStore('entries', { keyPath: 'id' });
            }
          },
        });
        
        // Load entries
        const entries = await db.getAll('entries');
        setPulseEntries(entries.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };
    
    initDB();
  }, []);

  // Save a new pulse entry
  const saveEntry = async () => {
    if (currentMood === null) return;
    
    try {
      const newEntry: PulseEntry = {
        id: uuidv4(),
        mood: currentMood,
        timestamp: Date.now(),
        notes,
        tags: selectedTags,
      };
      
      const db = await openDB('pulse-db', 1);
      await db.add('entries', newEntry);
      
      // Update the state with the new entry
      setPulseEntries([newEntry, ...pulseEntries]);
      
      // Reset form
      setCurrentMood(null);
      setNotes('');
      setSelectedTags([]);
      setShowAddEntry(false);

      // If we wanted to send to backend, we could implement that here
      // Implementation would depend on your API
      // For now, we'll just use local storage
    } catch (error) {
      console.error('Error saving entry:', error);
    }
  };

  // Delete a pulse entry
  const deleteEntry = async (id: string) => {
    try {
      const db = await openDB('pulse-db', 1);
      await db.delete('entries', id);
      
      // Update state
      setPulseEntries(pulseEntries.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  // Add or remove a tag
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Add a custom tag
  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag]);
      setCustomTag('');
    }
  };

  // Get appropriate emoji for mood
  const getMoodEmoji = (mood: number) => {
    switch(mood) {
      case 1: return <Frown className="text-red-500" />;
      case 2: return <Meh className="text-orange-500" />;
      case 3: return <Smile className="text-yellow-500" />;
      case 4: return <SmilePlus className="text-green-500" />;
      case 5: return <Heart className="text-pink-500" />;
      default: return <Meh className="text-gray-500" />;
    }
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Submit community feedback
  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    
    try {
      // For now, we'll just log the feedback and close the form
      // In a real implementation, you would send this to your backend
      console.log('User feedback:', feedback);
      setFeedback('');
      setShowFeedbackForm(false);
      
      // Commented out as it requires proper payload structure
      // await sendPulseFeedback({ 
      //   session_id: 'anonymous', // Would use sessionId from useSession() when authenticated
      //   region: 'default', 
      //   suggestion_id: 'manual_feedback',
      //   value: 1 // Positive feedback
      // });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  // Calculate current user's mood average
  const userMoodAverage = useMemo(() => {
    if (pulseEntries.length === 0) return 0;
    const sum = pulseEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / pulseEntries.length).toFixed(1);
  }, [pulseEntries]);

  // Format mood trend text
  const formatMoodTrend = (trend: string) => {
    if (trend === "improving") return "Improving ↗️";
    if (trend === "declining") return "Declining ↘️";
    return "Stable →";
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={isOpen} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <div className="max-w-4xl mx-auto">
            {/* Header section */}
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-primary">Community Pulse</h1>
              <p className="text-secondary mt-2">
                Track your emotional well-being and see how the community is feeling.
              </p>
            </header>
            
            {showBreathingExercise ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="bg-white rounded-xl shadow-md p-6 relative">
                  <button 
                    onClick={() => setShowBreathingExercise(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-primary transition-colors"
                  >
                    Close
                  </button>
                  <h2 className="text-2xl font-semibold text-primary mb-4">Take a Breathing Break</h2>
                  <BreathTimer cycles={3} />
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-wrap gap-4 mb-8">
                <button 
                  onClick={() => setShowBreathingExercise(true)}
                  className="px-5 py-3 bg-accent text-white rounded-xl shadow-md hover:bg-accentDark transition-colors flex items-center gap-2"
                >
                  <Clock size={18} />
                  <span>Breathing Exercise</span>
                </button>
                
                <button 
                  onClick={() => setShowAddEntry(true)}
                  className="px-5 py-3 bg-primary text-white rounded-xl shadow-md hover:bg-primaryDark transition-colors flex items-center gap-2"
                >
                  <Edit3 size={18} />
                  <span>Record Your Mood</span>
                </button>
              </div>
            )}

            {/* Community pulse section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4">Community Pulse</h2>
              
              {isLoadingCommunity ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-12 bg-gray-200 rounded w-full"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : pulseSummary ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-background p-4 rounded-lg">
                      <h3 className="text-sm text-secondary mb-1">Community Mood</h3>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-primary">
                          {pulseSummary.averageMood.toFixed(1)}
                        </span>
                        <span className="text-sm text-secondary mb-1">/ 5.0</span>
                      </div>
                    </div>
                    
                    <div className="bg-background p-4 rounded-lg">
                      <h3 className="text-sm text-secondary mb-1">Mood Trend</h3>
                      <div className="text-xl font-medium text-primary">
                        {formatMoodTrend(pulseSummary.moodTrend)}
                      </div>
                    </div>
                    
                    <div className="bg-background p-4 rounded-lg">
                      <h3 className="text-sm text-secondary mb-1">Community Size</h3>
                      <div className="text-xl font-medium text-primary">
                        {pulseSummary.userCount} members
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-2">Common Feelings</h3>
                    <div className="flex flex-wrap gap-2">
                      {pulseSummary.recentTags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-3 py-1 bg-background rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                      className="text-sm text-accent hover:underline"
                    >
                      Share feedback about community pulse
                    </button>
                  </div>
                  
                  {showFeedbackForm && (
                    <div className="mt-4 bg-background p-4 rounded-lg">
                      <h3 className="text-md font-medium mb-2">Share Your Thoughts</h3>
                      <textarea 
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        className="w-full p-2 border rounded-lg resize-none h-24"
                        placeholder="What would you like to see in Community Pulse?"
                      ></textarea>
                      <div className="mt-2 flex justify-end">
                        <button 
                          onClick={submitFeedback}
                          className="px-4 py-2 bg-accent text-white rounded-lg"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertTriangle className="text-orange-500 mb-2" size={32} />
                  <p className="text-secondary">Could not load community data</p>
                </div>
              )}
            </div>
            
            {/* Your pulse history section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-primary">Your Mood History</h2>
                <div className="text-2xl font-semibold text-primary">
                  Average: {userMoodAverage}
                  <span className="text-sm text-gray-500 ml-1">/ 5.0</span>
                </div>
              </div>
              
              {pulseEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary mb-4">You haven't recorded any moods yet.</p>
                  <button 
                    onClick={() => setShowAddEntry(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
                  >
                    Record Your First Mood
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pulseEntries.map(entry => (
                    <div key={entry.id} className="bg-background p-4 rounded-lg">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">{getMoodEmoji(entry.mood)}</div>
                          <span className="font-medium">{entry.mood}/5</span>
                        </div>
                        <button 
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-400 hover:text-red-500 transition-colors"
                          title="Delete entry"
                        >
                          &times;
                        </button>
                      </div>
                      
                      <div className="text-sm text-secondary mt-1">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                      
                      {entry.notes && (
                        <p className="mt-2 text-primary">{entry.notes}</p>
                      )}
                      
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Add entry modal */}
      <AnimatePresence>
        {showAddEntry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddEntry(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-semibold text-primary mb-6">How are you feeling?</h2>
              
              {/* Mood selector */}
              <div className="mb-6">
                <label className="block text-secondary mb-2">Select your mood:</label>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setCurrentMood(mood)}
                      className={`flex-1 p-3 rounded-lg flex flex-col items-center transition-all ${
                        currentMood === mood 
                          ? 'bg-accent text-white scale-105' 
                          : 'bg-background hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">{getMoodEmoji(mood)}</div>
                      <div className="text-xs font-medium">
                        {mood === 1 ? 'Very Bad' : 
                         mood === 2 ? 'Bad' : 
                         mood === 3 ? 'Okay' : 
                         mood === 4 ? 'Good' : 'Excellent'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Notes input */}
              <div className="mb-6">
                <label className="block text-secondary mb-2">Notes (optional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none h-24"
                  placeholder="How are you feeling today?"
                ></textarea>
              </div>
              
              {/* Tags selector */}
              <div className="mb-6">
                <label className="block text-secondary mb-2">Tags (optional):</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                {/* Custom tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    className="flex-1 p-2 border rounded-lg"
                    placeholder="Add custom tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-3 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
                    disabled={!customTag}
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddEntry(false)}
                  className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntry}
                  disabled={currentMood === null}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors disabled:opacity-50"
                >
                  Save Entry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pulse;