// Notes.tsx: Component for the "Share with Me" feature where users can write and destroy their thoughts
import { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { Link } from 'react-router-dom';

const Notes = () => {
  // Handle note destruction/crushing
  const handleCrushNote = (index: number) => {
    setCrushingNote(index);
    // After animation completes, remove the note and show confetti
    setTimeout(() => {
      setNotes(notes.filter((_, i) => i !== index));
      setCrushingNote(null);
      setShowConfetti(true);
      // Hide confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
    }, 1000);
  };
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [crushingNote, setCrushingNote] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Sidebar toggle state
  const [isOpen, setIsOpen] = useState(false);

  // Handle note submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      setNotes([...notes, note]);
      setNote('');
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-pastel-blue relative">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)} />
      {/* Main Content with left margin to accommodate sidebar */}
      <div className="max-w-3xl mx-auto">
        {/* Header */}
  <div className="mb-8 text-center mt-12">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#466C36' }}>Share Your Thoughts</h1>
          <p className="text-gray-600">
            Write down your thoughts, feelings, or frustrations in a safe private space.
            When you're ready, you can crush them away and feel lighter.
          </p>
        </div>

        {/* Note input form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-4 border border-[#a3c167] rounded-lg shadow-sm min-h-[150px] focus:ring-2 focus:ring-[#a3c167] focus:border-[#a3c167] outline-none"
            placeholder="Write your thoughts here..."
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 text-white rounded-lg transition-colors"
              style={{ background: '#466C36' }}
            >
              Save Thought
            </button>
          </div>
        </form>

        {/* Notes list */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-center text-gray-500 italic">Your thoughts will appear here...</p>
          ) : (
            notes.map((noteText, index) => (
              <div 
                key={index} 
                className={`bg-white p-4 rounded-lg shadow relative ${crushingNote === index ? 'animate-crush' : ''}`}
              >
                <p className="whitespace-pre-wrap">{noteText}</p>
                <button
                  onClick={() => handleCrushNote(index)}
                  className="mt-2 px-4 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Crush This Thought
                </button>
              </div>
            ))
          )}
        </div>

        {/* Confetti effect when a note is crushed */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            <div className="confetti-container">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i} 
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
                    animationDelay: `${Math.random() * 0.5}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;