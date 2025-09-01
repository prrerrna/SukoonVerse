// App.tsx: The root component that sets up application routing.
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Onboard from './pages/Onboard';
import Chat from './pages/Chat';
import Mood from './pages/Mood';
import Resources from './pages/Resources';
import Notes from './pages/Notes';
import Pulse from './pages/Pulse';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// This is the root App component.
// It uses React Router to define the different pages of the application.
// No new functions are defined here; it just composes other components.
const App = () => {
  return (
    <Router>
      <div className="bg-pastel-blue min-h-screen font-sans">
        <Routes>
          <Route path="/" element={<Onboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
