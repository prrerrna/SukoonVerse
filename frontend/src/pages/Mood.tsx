// Mood.tsx: A page for displaying mood history and trends.
import TrendChart from '../components/TrendChart';

// This component displays the user's mood trends.
// It's a simple presentational component with no complex logic.
const Mood = () => {
  // In a real app, this data would be fetched from IndexedDB or an API.
  const moodData = [
    { day: 'Mon', score: 5 },
    { day: 'Tue', score: 7 },
    { day: 'Wed', score: 4 },
    { day: 'Thu', score: 6 },
    { day: 'Fri', score: 8 },
    { day: 'Sat', score: 5 },
    { day: 'Sun', score: 7 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Your 7-Day Mood Trend</h1>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <TrendChart data={moodData} />
      </div>
      <p className="text-center mt-4 text-gray-700">
        This chart shows the intensity of your logged moods over the past week.
      </p>
    </div>
  );
};

export default Mood;
