import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { signIn as fbSignIn, signUp as fbSignUp, onAuthChange, FirebaseUser, signInWithGoogle, signOut } from '../lib/firebase';
import { registerUser, getUserProfile, updateUserProfile } from '../lib/api';
import Navbar from '../components/Navbar';

/**
 * LoginPage component provides user authentication with a clean, simple interface
 * that matches the app's design language.
 */
const LoginPage = () => {
  // Authentication states
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isNew, setIsNew] = useState(false);
  const navigate = useNavigate();
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showAlreadyLoggedIn, setShowAlreadyLoggedIn] = useState(false);
  
  // Profile states
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileSetupModal, setShowProfileSetupModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    region: '',
    language: 'en',
    bio: '',
    preferredName: ''
  });

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      
      // If user is already logged in and just navigated to this page,
      // show a top-right notification that they're already logged in
      if (currentUser) {
        setShowAlreadyLoggedIn(true);
        
        // Auto-hide the notification after 2.5s
        setTimeout(() => {
          setShowAlreadyLoggedIn(false);
        }, 2500);

        // Fetch profile data
        loadProfile();
      } else {
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user profile from backend
  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const response = await getUserProfile();
      setProfile(response.profile);
      setEditForm({
        name: response.profile?.name || '',
        mobile: response.profile?.mobile || '',
        region: response.profile?.region || '',
        language: response.profile?.language || 'en',
        bio: response.profile?.bio || '',
        preferredName: response.profile?.preferredName || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({
        name: editForm.name,
        mobile: editForm.mobile,
        region: editForm.region,
        language: editForm.language,
        bio: editForm.bio,
        preferredName: editForm.preferredName
      });
      await loadProfile(); // Reload profile data
      setShowEditModal(false);
      setShowProfileSetupModal(false);
      setModal({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error: any) {
      setModal({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const onAuthSuccess = (_user?: FirebaseUser) => {
    // Show the centered success popup on the Login page
    setShowSuccessPopup(true);
    
    // Check if we need to collect user details
    setTimeout(async () => {
      try {
        // Try to load user profile
        const response = await getUserProfile().catch(() => null);
        if (!response || !response.profile || !response.profile.name) {
          // If no profile exists, show the profile setup modal
          setShowProfileSetupModal(true);
        } else {
          // Redirect to the previous page if profile exists
          try {
            const savedData = JSON.parse(localStorage.getItem('formData') || 'null');
            const restorePath = localStorage.getItem('restorePath');
            if (savedData && restorePath) navigate(restorePath);
            else navigate('/');
          } catch {
            navigate('/');
          }
        }
      } catch {
        // If we couldn't fetch profile, still redirect
        navigate('/');
      }
    }, 1500);
  };

  // Handle form submission for email/password login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isNew) {
        await fbSignUp(email, password);
        // persist profile to backend (non-blocking)
        try {
          await registerUser({ 
            name: name || '', 
            mobile: mobile || '',
            preferredName: '', 
            region: '', 
            language: 'en' 
          });
          // Show profile setup modal after successful signup
          setShowProfileSetupModal(true);
        } catch (regErr) {
          console.warn('Failed to register profile to backend', regErr);
        }
        onAuthSuccess();
      } else {
        await fbSignIn(email, password);
        onAuthSuccess();
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed';
      setModal({ type: 'error', message: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onAuthSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Google authentication failed';
      setModal({ type: 'error', message: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If user is already logged in, show a simple account preview with sign out
  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar title="Account" showBack />
        
        {/* Top-right already logged in notification */}
        {showAlreadyLoggedIn && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-6 py-4 shadow-lg w-[22rem]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0 animate-bounce">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-base font-medium text-main">
                  You are already logged in as {user?.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
            <div className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md text-center mx-4">
              <div className={"mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full " + (modal.type === 'success' ? 'bg-green-100' : 'bg-red-100') }>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {modal.type === 'success' ? (
                    <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  ) : (
                    <path d="M6 18L18 6M6 6l12 12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">{modal.type === 'success' ? 'Success' : 'Error'}</h3>
              <p className="text-sm text-subtle mb-4">{modal.message}</p>
              <div className="flex justify-center">
                <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-100 rounded-md">Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-border/30">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left mb-8">
              <div className="relative mb-6 md:mb-0 md:mr-10">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-white flex items-center justify-center text-3xl font-bold border-4 border-emerald-200">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full hover:bg-emerald-600 transition-colors shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-main mb-1">
                  {profile?.name || 'Welcome Back!'}
                </h1>
                <p className="text-subtle text-lg mb-4">{user?.email}</p>
                <p className="text-main max-w-prose">
                  {profile?.bio || 'Passionate wellness advocate exploring mindful living, meditation, and personal growth. Let\'s continue your journey to a healthier, happier life with Sukoon.'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-8"></div>

            {/* Personal Information */}
            <div>
              <h2 className="text-2xl font-semibold text-main mb-6">Personal Information</h2>
              {profileLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-subtle">Full Name</p>
                      <p className="font-medium text-main">{profile?.name || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-subtle">Mobile Number</p>
                      <p className="font-medium text-main">{profile?.mobile || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-subtle">Location</p>
                      <p className="font-medium text-main">{profile?.region || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-600">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-subtle">Language</p>
                      <p className="font-medium text-main">{profile?.language === 'en' ? 'English' : profile?.language === 'hi' ? 'Hindi' : profile?.language || 'English'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button 
                onClick={() => setShowEditModal(true)}
                className="w-full sm:w-auto flex items-center justify-center bg-emerald-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Profile
              </button>
              <button 
                onClick={() => signOut()}
                className="w-full sm:w-auto flex items-center justify-center bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)} />
            <div className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editForm.region}
                    onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Mumbai, India"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={editForm.language}
                    onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen bg-background">
      <Navbar title="Login" showBack />
      
      {/* Centered success popup (shows for 3s after login) */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-2xl py-8 px-10 w-[74rem] mx-4 transform animate-bounce">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-3xl font-bold text-main mb-1">Login Successful!</h3>
                <p className="text-lg text-subtle">Redirecting you back to the app — thanks for signing in.</p>
                <div className="mt-4 w-full">
                  <div className="h-2 bg-green-300 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-green-500 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error modal (only for errors, not success) */}
      {modal && modal.type === 'error' && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md text-center mx-4">
            <div className="mx-auto mb-4 w-14 h-14 flex items-center justify-center rounded-full bg-red-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 18L18 6M6 6l12 12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-sm text-subtle mb-4">{modal.message}</p>
            <div className="flex justify-center">
              <button onClick={() => setModal(null)} className="px-4 py-2 bg-gray-100 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-6 border border-border/30">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold">S</div>
            <div>
              <h2 className="text-2xl font-medium text-main">Welcome to Sukoon</h2>
              <p className="text-subtle">Sign in to access your personal wellness journey</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-subtle mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-subtle mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isNew ? "Create a password" : "Enter your password"}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {isNew && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm text-subtle mb-1">Full name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label htmlFor="mobile" className="block text-sm text-subtle mb-1">Mobile number</label>
                  <input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. +1 555-555-5555"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-semibold"
              style={{ background: 'linear-gradient(90deg, #263a1e 0%, #a3c167 100%)' }}
            >
              {loading ? <span>Please wait...</span> : <span>{isNew ? 'Create Account' : 'Sign In'}</span>}
            </button>

            {!isNew ? (
              <div className="mt-3 text-center text-sm">
                <button type="button" onClick={() => setIsNew(true)} className="text-accent underline">New here? Create an account</button>
              </div>
            ) : (
              <div className="mt-3 text-center text-sm">
                <button type="button" onClick={() => setIsNew(false)} className="text-accent underline">Already have an account? Log in</button>
              </div>
            )}
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-subtle">or continue with Google</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-3 py-2.5 px-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-main">Continue with Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-subtle">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
      
      {/* Profile Setup Modal */}
      {showProfileSetupModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-xl font-semibold text-main">Complete Your Profile</h3>
              <p className="text-subtle text-sm mt-1">
                Help us personalize your experience on SukoonVerse.
              </p>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-main mb-1">Your Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="preferredName" className="block text-sm font-medium text-main mb-1">What should we call you?</label>
                <input
                  id="preferredName"
                  name="preferredName"
                  type="text"
                  value={editForm.preferredName}
                  onChange={(e) => setEditForm({...editForm, preferredName: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Preferred name or nickname"
                />
              </div>
              
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-main mb-1">Your Region/Campus</label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  value={editForm.region}
                  onChange={(e) => setEditForm({...editForm, region: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Mumbai, Delhi NCR, BITS Pilani"
                />
              </div>
              
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-main mb-1">Mobile (optional)</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={editForm.mobile}
                  onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="+91 98765 43210"
                />
              </div>
              
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-main mb-1">Preferred Language</label>
                <select
                  id="language"
                  name="language"
                  value={editForm.language}
                  onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileSetupModal(false);
                    navigate('/');
                  }}
                  className="px-4 py-2 text-subtle hover:text-main"
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;