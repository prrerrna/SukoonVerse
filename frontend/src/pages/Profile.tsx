import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { firebaseAuth } from '../lib/firebase';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { User as FirebaseUser } from 'firebase/auth';

const Profile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // If not logged in, redirect to login page
  if (!loading && !user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={isOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title="Profile" showMenu={true} onClickMenu={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-light">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h1 className="text-2xl font-semibold text-primary mb-6">My Profile</h1>

              {loading ? (
                <div className="animate-pulse flex flex-col space-y-4">
                  <div className="h-12 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <div className="w-20 h-20 bg-accent text-white rounded-full flex items-center justify-center text-3xl font-semibold mb-4">
                      {user?.displayName ? user.displayName[0].toUpperCase() : 
                       user?.email ? user.email[0].toUpperCase() : 'U'}
                    </div>
                    <h2 className="text-xl font-semibold">
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="font-medium text-lg mb-2">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p>{user?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Account Created</p>
                          <p>{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="font-medium text-lg mb-2">Profile Settings</h3>
                      <div className="space-y-2">
                        <button className="px-4 py-2 bg-accent hover:bg-accentDark text-white rounded-md transition-colors">
                          Update Profile
                        </button>
                        <button 
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors ml-2"
                          onClick={() => firebaseAuth.signOut()}
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;