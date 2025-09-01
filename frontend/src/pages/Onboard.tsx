import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, MessageCircle, Zap, BookOpen, User } from "lucide-react"; // page section icons
import Sidebar from "../components/Sidebar";

const Onboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toolsRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  
  // Handle chat button click
  const handleChatClick = () => {
    navigate('/chat');
  };

  // (scroll indicator removed; not used)

  // Scroll to tools section
  const scrollToTools = () => {
    toolsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
  <div className="flex flex-col min-h-screen bg-background">
  {/* Sidebar */}
  <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)} />

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
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-main leading-tight">
              SukoonVerse: Your Safe Space
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-main">
              An AI-powered, confidential, and empathetic mental wellness solution that supports and guides youth in overcoming stigma and accessing help.
            </h2>
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-main">Our Mission</h2>
               <p className="text-lg text-subtle leading-relaxed">
                Create a safe space where young individuals can share their thoughts, 
                release frustrations, and connect with others for empathy and support. 
                We believe every young person deserves access to mental wellness resources 
                without fear or judgment.
              </p>
            </div>
            <button 
              onClick={scrollToTools}
              className="font-bold py-3 px-8 rounded-2xl shadow-lg transform transition hover:scale-105 flex items-center mx-auto text-white text-xl"
              style={{
                background: 'linear-gradient(90deg, #263a1e 0%, #a3c167 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(38,58,30,0.12)',
              }}
            >
              <span className="mr-3">Explore Our Tools</span>
              <span className="animate-float-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 16V8m0 8l4-4m-4 4l-4-4"/></svg>
              </span>
            </button>
          </div>
        </section>

        {/* Tools Section */}
  <section ref={toolsRef} className="py-20 px-8 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center text-main">Your Mental Wellness Toolkit</h2>
            <p className="text-xl text-center text-subtle mb-12">Discover our carefully designed tools to support your mental health journey</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-border">
                <div className="bg-accent text-buttontext p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <MessageCircle size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-main">Share with Me</h3>
                <p className="text-subtle mb-4">Write down your thoughts, feelings, or frustrations in a safe private space. Our AI companion listens without judgment and offers support.</p>
                <Link to="/notes" className="text-accentDark font-medium hover:text-accentDark/80 inline-flex items-center">
                  <span className="text-main">Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
              
              <div className="bg-surface p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-border">
                <div className="bg-accent text-buttontext p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-main">Angry? Try It</h3>
                <p className="text-subtle mb-4">Release your frustration with a fun and calming anger release game. Transform negative energy into positive outcomes.</p>
                <Link to="/mood" className="text-accentDark font-medium hover:text-accentDark/80 inline-flex items-center">
                  <span className="text-main">Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
              
              <div className="bg-surface p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-border">
                <div className="bg-accent text-buttontext p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-main">Light Them Up</h3>
                <p className="text-subtle mb-4">Share your story anonymously and connect with others who care. Find comfort in knowing you're not alone in your experiences.</p>
                <Link to="/resources" className="text-accentDark font-medium hover:text-accentDark/80 inline-flex items-center">
                  <span className="text-main">Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-8 rounded-xl shadow-lg transform transition hover:scale-105 border border-teal-100 md:col-span-3">
                <div className="flex items-center gap-4">
                  <div className="bg-teal-600 text-white p-3 rounded-full w-14 h-14 flex items-center justify-center">
                    <User size={28} />
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
                <div className="flex flex-row items-center bg-surface rounded-2xl shadow border border-border px-8 py-6 w-full max-w-4xl mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accentDark mr-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m2-4h6a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                  <div className="flex flex-col text-left">
                    <p className="text-xl md:text-2xl text-main font-medium leading-relaxed">
                      "Mental health struggles are real, but so is recovery. We're here to walk alongside you on your journey toward wellness, one step at a time."
                    </p>
                    <p className="text-sm text-subtle mt-2 font-semibold">— The SukoonVerse Team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="py-12 px-8 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-main">SukoonVerse</h3>
            <p className="text-subtle mb-4 max-w-2xl mx-auto">
              Empowering youth through AI-driven mental wellness support. 
              Because every young mind deserves peace, understanding, and hope.
            </p>
          </div>
          
          <div className="border-t border-border pt-8">
            <p className="text-sm text-subtle">
              © {new Date().getFullYear()} SukoonVerse. All rights reserved. 
              <br />
              Made with ❤️ for mental wellness advocacy.
            </p>
            <p className="text-xs text-subtle mt-2">
              If you're in crisis, please reach out to local emergency services or mental health professionals immediately.
            </p>
          </div>
        </div>
      </footer>
      </div>
      
      {/* Floating Chat Button */}
      <button 
        onClick={handleChatClick}
        className="group fixed bottom-8 right-8 bg-accentDark hover:bg-accentDark/90 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform transition hover:scale-110 z-50 animate-pulse-chat"
        aria-label="Let's Talk"
      >
        <MessageCircle size={28} />
        <span className="absolute -top-10 right-0 bg-white text-accentDark px-3 py-1 rounded-lg shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Let's Talk</span>
      </button>
    </div>
  );
};

export default Onboard;
