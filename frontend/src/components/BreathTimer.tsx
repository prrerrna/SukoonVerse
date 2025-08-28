// BreathTimer.tsx: A component for a simple breathing exercise timer.
import { useState, useEffect } from 'react';

// This component provides a guided 4-7-8 breathing exercise.
// All logic is self-contained using React hooks.
const BreathTimer = () => {
  const [instruction, setInstruction] = useState('Get Ready...');
  const [timer, setTimer] = useState(4);

  // This effect manages the breathing cycle timing.
  // It uses inline arrow functions for the timeouts.
  useEffect(() => {
    setInstruction('Breathe In...');
    const inhale = setTimeout(() => {
      setInstruction('Hold...');
      setTimer(7);
      const hold = setTimeout(() => {
        setInstruction('Breathe Out...');
        setTimer(8);
        const exhale = setTimeout(() => {
          setInstruction('Finished. You can start again.');
        }, 8000);
        return () => clearTimeout(exhale);
      }, 7000);
      return () => clearTimeout(hold);
    }, 4000);
    return () => clearTimeout(inhale);
  }, []); // This runs once when the component mounts.

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">60-Second Breathing Exercise</h3>
      <p className="text-xl mb-2">{instruction}</p>
      <div className="text-6xl font-bold text-blue-500">{timer}</div>
      <p className="text-sm text-gray-500 mt-4">Follow the 4-7-8 pattern.</p>
    </div>
  );
};

export default BreathTimer;
