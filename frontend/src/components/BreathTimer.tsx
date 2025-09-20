// BreathTimer.tsx: A component for a guided breathing exercise with animations
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types for props
interface BreathTimerProps {
  onClose?: () => void;
  cycles?: number;
}

const BreathTimer: React.FC<BreathTimerProps> = ({ onClose, cycles = 3 }) => {
  // States for the breathing exercise
  const [phase, setPhase] = useState<'ready' | 'inhale' | 'hold' | 'exhale' | 'complete'>('ready');
  const [timer, setTimer] = useState<number>(3);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Configuration for the breathing exercise
  const inhaleTime = 4;
  const holdTime = 7;
  const exhaleTime = 8;
  
  // Start the breathing exercise
  const startExercise = useCallback(() => {
    setIsRunning(true);
    setPhase('inhale');
    setTimer(inhaleTime);
    setCurrentCycle(1);
  }, []);
  
  // Reset the breathing exercise
  const resetExercise = useCallback(() => {
    setIsRunning(false);
    setPhase('ready');
    setTimer(3);
    setCurrentCycle(1);
  }, []);
  
  // Main timer effect
  useEffect(() => {
    if (!isRunning) return;
    
    const timerInterval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          // Move to the next phase when timer hits 0
          if (phase === 'inhale') {
            setPhase('hold');
            return holdTime;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return exhaleTime;
          } else if (phase === 'exhale') {
            // Move to next cycle or complete the exercise
            if (currentCycle >= cycles) {
              setPhase('complete');
              setIsRunning(false);
              clearInterval(timerInterval);
              return 0;
            } else {
              setCurrentCycle((prev) => prev + 1);
              setPhase('inhale');
              return inhaleTime;
            }
          }
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [phase, isRunning, currentCycle, cycles]);
  
  // Animation variants
  const circleVariants = {
    inhale: {
      scale: 1.5,
      opacity: 1,
      transition: { duration: inhaleTime, ease: "easeInOut" as const }
    },
    hold: {
      scale: 1.5,
      opacity: 1,
      borderColor: "#4CAF50",
      transition: { duration: holdTime, ease: "linear" as const }
    },
    exhale: {
      scale: 1,
      opacity: 0.7,
      transition: { duration: exhaleTime, ease: "easeInOut" as const }
    }
  };
  
  // Get instruction text based on current phase
  const getInstructionText = () => {
    switch (phase) {
      case 'ready': return 'Get Ready...';
      case 'inhale': return 'Breathe In...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe Out...';
      case 'complete': return 'Breathing Exercise Completed';
      default: return '';
    }
  };
  
  // Get colors based on current phase
  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale': return '#3B82F6'; // Blue
      case 'hold': return '#10B981';  // Green
      case 'exhale': return '#8B5CF6'; // Purple
      default: return '#6EA43A'; // Default accent color
    }
  };

  return (
    <div className="w-full">
      <motion.div 
        className="bg-white rounded-xl sm:rounded-2xl w-full flex flex-col items-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-6 text-center">
          {phase === 'complete' ? 'Well Done!' : '4-7-8 Breathing Exercise'}
        </h3>
        
        <div className="w-full flex justify-center items-center relative mb-4 sm:mb-6">
          {phase !== 'ready' && phase !== 'complete' && (
            <>
              {/* Background circles */}
              <motion.div 
                className="absolute w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full opacity-10"
                style={{ backgroundColor: getPhaseColor() }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 6,
                  ease: "easeInOut" 
                }}
              />
              
              {/* Animated breathing circle */}
              <motion.div 
                className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full flex items-center justify-center border-4"
                style={{ 
                  borderColor: getPhaseColor(),
                  backgroundColor: `${getPhaseColor()}15`
                }}
                variants={circleVariants}
                animate={phase}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${phase}-${timer}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-5xl font-bold" style={{ color: getPhaseColor() }}>
                      {timer}
                    </span>
                    <span className="text-sm font-medium" style={{ color: getPhaseColor() }}>
                      {getInstructionText()}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </>
          )}
          
          {/* Ready state content */}
          {phase === 'ready' && (
            <motion.div 
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-lg mb-4">This exercise helps reduce stress and anxiety using the 4-7-8 breathing technique:</p>
              <ul className="text-left list-disc pl-6 mb-6 space-y-2">
                <li>Inhale through your nose for 4 seconds</li>
                <li>Hold your breath for 7 seconds</li>
                <li>Exhale through your mouth for 8 seconds</li>
              </ul>
              <p className="text-sm text-gray-500 mb-4">Find a comfortable position and click start when ready.</p>
            </motion.div>
          )}
          
          {/* Completed state content */}
          {phase === 'complete' && (
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-6xl mb-4">🌿</div>
              <p className="text-lg mb-4">
                You've completed {cycles} cycles of deep breathing.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Taking short breaks for mindful breathing can help manage stress throughout your day.
              </p>
            </motion.div>
          )}
        </div>
        
        {/* Progress indicators for cycles */}
        {isRunning && (
          <div className="flex gap-2 mb-6">
            {Array.from({ length: cycles }).map((_, i) => (
              <motion.div 
                key={i} 
                className="h-2 w-8 rounded-full"
                initial={{ opacity: 0.3 }}
                animate={{ 
                  opacity: i + 1 <= currentCycle ? 1 : 0.3,
                  backgroundColor: i + 1 <= currentCycle ? getPhaseColor() : "#e5e7eb"
                }}
              />
            ))}
          </div>
        )}
        
        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {phase === 'ready' && (
            <motion.button
              className="px-6 py-2 rounded-lg bg-accent text-white font-medium shadow-md hover:bg-accentDark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startExercise}
            >
              Start Breathing
            </motion.button>
          )}
          
          {(phase === 'inhale' || phase === 'hold' || phase === 'exhale') && (
            <motion.button
              className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetExercise}
            >
              Reset
            </motion.button>
          )}
          
          {phase === 'complete' && (
            <motion.button
              className="px-6 py-2 rounded-lg bg-accent text-white font-medium shadow-md hover:bg-accentDark"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startExercise}
            >
              Start Again
            </motion.button>
          )}
          
          <motion.button
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default BreathTimer;
