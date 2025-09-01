import { Link } from 'react-router-dom';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow border border-border max-w-lg w-full p-8 text-center">
        <h1 className="text-2xl font-semibold text-main mb-2">Profile</h1>
        <p className="text-subtle mb-6">This is a placeholder. You can add user preferences and personalization here.</p>
        <Link to="/" className="text-accentDark hover:text-accentDark/80">Back to Home</Link>
      </div>
    </div>
  );
};

export default Profile;
