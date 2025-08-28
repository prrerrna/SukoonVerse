// Onboard.tsx: The onboarding page component for new users.
import { Link } from 'react-router-dom';

// This component displays the initial onboarding screen.
// All logic is contained within the component, with no external functions.
const Onboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Sakhi</h1>
      <p className="text-lg mb-6">Your anonymous, culturally-sensitive AI wellness buddy.</p>
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-2">Privacy First</h2>
        <p className="mb-4">
          Your conversations are anonymous and not stored by default. You are in control.
        </p>
        <div className="flex items-center justify-center">
          <span className="mr-2 font-medium">Anonymous Mode</span>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" checked disabled />
            <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
      </div>
      <Link
        to="/chat"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full text-xl"
      >
        Start Chatting
      </Link>
    </div>
  );
};

export default Onboard;
