import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronLeft, 
  Home, 
  MessageCircle, 
  Zap, 
  BookOpen, 
  User, 
  Settings,
  Heart,
  Shield,
  Users
} from "lucide-react"; // icons

const Onboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toolsRef = useRef<HTMLElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const navigate = useNavigate();
  
  // Handle chat button click
  const handleChatClick = () => {
    navigate('/chat');
  };

  // Handle scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to tools section
  const scrollToTools = () => {
    toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-teal-50 to-blue-50">
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-teal-700 text-white flex flex-col justify-between z-10`}
        style={{
          width: isOpen ? '16rem' : '5rem',
          transition: 'width 400ms cubic-bezier(.22,.9,.36,1)',
          willChange: 'width',
        }}
      >
        {/* Top Section */}
        <div>
          {/* Logo + Toggle Button */}
          <div className="flex items-center justify-between p-4">
            <img
              src="/logo.png" // place your logo inside public/logo.png
              alt="SukoonVerse"
              className="h-10 w-10 rounded-full"
            />
            <button onClick={() => setIsOpen(!isOpen)} className="hover:bg-teal-600 p-1 rounded-full">
              {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="mt-6 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 px-4 hover:bg-teal-600 py-2 rounded-md">
              <Home size={22} />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Home</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-3 px-4 hover:bg-teal-600 py-2 rounded-md">
              <MessageCircle size={22} />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Let's Talk</span>
            </Link>
            <Link to="/mood" className="flex items-center gap-3 px-4 hover:bg-teal-600 py-2 rounded-md">
              <Zap size={22} />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Mood</span>
            </Link>
            <Link to="/pulse" className="flex items-center gap-3 px-4 hover:bg-teal-600 py-2 rounded-md">
              <Users size={22} />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Pulse</span>
            </Link>
            <Link to="/notes" className="flex items-center gap-3 px-4 hover:bg-teal-600 py-2 rounded-md">
              <BookOpen size={22} />
              <span
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity 300ms, transform 300ms',
                  display: 'inline-block',
                  width: isOpen ? 'auto' : 0,
                }}
              >Tell me</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-4 p-4">
          <Link to="/" className="flex items-center gap-3 hover:bg-teal-600 py-2 px-4 rounded-md">
            <User size={22} />
            <span
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'opacity 300ms, transform 300ms',
                display: 'inline-block',
                width: isOpen ? 'auto' : 0,
              }}
            >Profile</span>
          </Link>
          <Link to="/" className="flex items-center gap-3 hover:bg-teal-600 py-2 px-4 rounded-md">
            <Settings size={22} />
            <span
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateX(0)' : 'translateX(-16px)',
                transition: 'opacity 300ms, transform 300ms',
                display: 'inline-block',
                width: isOpen ? 'auto' : 0,
              }}
            >Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content with left margin to accommodate sidebar */}
      <div
        className={`flex-1`}
        style={{
          marginLeft: isOpen ? '16rem' : '5rem',
          transition: 'margin-left 400ms cubic-bezier(.22,.9,.36,1)',
          willChange: 'margin-left',
        }}
      >
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center items-center px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-teal-800 leading-tight">
              SukoonVerse: Your Safe Space
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-teal-700">
              Generative AI for Youth Mental Wellness
            </h2>
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg mb-8">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                Welcome to SukoonVerse, an AI-powered, confidential, and empathetic mental wellness solution 
                designed specifically for young individuals. We provide a safe space where you can express yourself, 
                manage emotions, and connect with others who understand.
              </p>
              <p className="text-xl text-gray-700 leading-relaxed">
                Our mission is to support and guide youth in overcoming stigma and accessing help. 
                Here, you can share your thoughts, release frustrations, and find empathy and support 
                in a judgment-free environment.
              </p>
            </div>
            <button 
              onClick={scrollToTools}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full 
              shadow-lg transform transition hover:scale-105 flex items-center mx-auto"
            >
              <span>Explore Our Tools</span>
              <ChevronRight size={20} className="ml-2" />
            </button>
          </div>
          
          {/* Scroll indicator */}
          {showScrollIndicator && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-8 h-12 rounded-full border-2 border-teal-600 flex justify-center pt-1">
                <div className="w-1 h-3 bg-teal-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </section>

        {/* Tools Section */}
        <section ref={toolsRef} className="py-20 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center text-teal-800">Our Wellness Tools</h2>
            <p className="text-xl text-center text-gray-600 mb-12">Discover tools designed to support your mental wellbeing journey</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-teal-100">
                <div className="bg-teal-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <MessageCircle size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-teal-800">Share with Me</h3>
                <p className="text-gray-700 mb-4">Write down your thoughts, feelings, or frustrations in a safe private space. Our AI companion listens without judgment and offers support.</p>
                <Link to="/notes" className="text-teal-600 font-medium hover:text-teal-800 inline-flex items-center">
                  <span>Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
              
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-teal-100">
                <div className="bg-teal-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-teal-800">Angry? Try It</h3>
                <p className="text-gray-700 mb-4">Release your frustration with a fun and calming anger release game. Transform negative energy into positive outcomes.</p>
                <Link to="/mood" className="text-teal-600 font-medium hover:text-teal-800 inline-flex items-center">
                  <span>Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
              
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-teal-100">
                <div className="bg-teal-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-teal-800">Light Them Up</h3>
                <p className="text-gray-700 mb-4">Share your story anonymously and connect with others who care. Find comfort in knowing you're not alone in your experiences.</p>
                <Link to="/resources" className="text-teal-600 font-medium hover:text-teal-800 inline-flex items-center">
                  <span>Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-teal-100 md:col-span-3">
                <div className="flex items-center gap-4">
                  <div className="bg-teal-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center">
                    <Users size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-1 text-teal-800">Sukoon Pulse</h3>
                    <p className="text-gray-700 mb-2">See your community's anonymous mood pulse and get AI-powered care actions everyone can try together.</p>
                    <Link to="/pulse" className="text-teal-600 font-medium hover:text-teal-800 inline-flex items-center">
                      <span>Open Pulse</span>
                      <ChevronRight size={18} className="ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-span-1 md:col-span-3 flex items-center justify-center my-2">
                <div className="flex flex-row items-center bg-gradient-to-r from-teal-100 via-white to-blue-100 rounded-xl shadow border border-teal-200 px-8 py-6 w-full max-w-4xl mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-600 mr-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m2-4h6a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                  <div className="flex flex-col text-left">
                    <p className="text-xl md:text-2xl text-teal-800 font-medium leading-relaxed">
                      "Mental health struggles are real, but so is recovery. We're here to walk alongside you on your journey toward wellness, one step at a time."
                    </p>
                    <p className="text-sm text-teal-600 mt-2 font-semibold">— The SukoonVerse Team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="bg-teal-800 text-white py-12 px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Heart size={20} className="mr-2" /> Our Mission
                </h3>
                <p className="text-teal-100">
                  SukoonVerse is dedicated to breaking down barriers to mental health support for young people. 
                  We believe in creating accessible, stigma-free resources that empower youth to take control of their wellbeing.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Shield size={20} className="mr-2" /> Privacy Commitment
                </h3>
                <p className="text-teal-100">
                  Your privacy is our priority. All interactions on SukoonVerse are confidential and secure. 
                  We use advanced encryption and never share your personal information with third parties.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Users size={20} className="mr-2" /> Community Guidelines
                </h3>
                <p className="text-teal-100">
                  Our community is built on respect, empathy, and support. We maintain a safe environment 
                  where everyone feels welcome and valued. Zero tolerance for harmful behavior.
                </p>
              </div>
            </div>
            
            <div className="border-t border-teal-600 pt-6 flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <img src="/logo.png" alt="SukoonVerse" className="h-10 w-10 rounded-full inline-block mr-2" />
                <span className="font-semibold text-xl">SukoonVerse</span>
              </div>
              
              <div className="text-teal-200 text-sm">
                <p>© {new Date().getFullYear()} SukoonVerse. All rights reserved.</p>
                <p>A safe space for youth mental wellness powered by generative AI.</p>
                <p>Made with ❤️ by team SukoonVerse</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Floating Chat Button */}
      <button 
        onClick={handleChatClick}
        className="group fixed bottom-8 right-8 bg-teal-600 hover:bg-teal-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform transition hover:scale-110 z-50 animate-pulse-chat"
        aria-label="Let's Talk"
      >
        <MessageCircle size={28} />
        <span className="absolute -top-10 right-0 bg-white text-teal-800 px-3 py-1 rounded-lg shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Let's Talk</span>
      </button>
    </div>
  );
};

export default Onboard;
