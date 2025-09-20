import { useState, useRef } from "react";
import Lottie from "lottie-react";
import Wave from "react-wavify";

import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, MessageCircle, Zap, BookOpen, User, Shield, Heart, Users } from "lucide-react"; // page section icons
import Sidebar from "../components/Sidebar";
import yogaAnimation from "../animations/yoga.json";

const Onboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toolsRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  
  // Handle chat button click
  const handleChatClick = () => {
    navigate('/chat');
  };

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
          marginLeft: isOpen ? '12rem' : '5rem',
          transition: 'margin-left 400ms cubic-bezier(.22,.9,.36,1)',
          willChange: 'margin-left',
        }}
      >
        {/* Hero Section */}
  <section className="min-h-[100svh] sm:min-h-screen flex flex-col justify-center items-center px-4 py-20 relative overflow-hidden bg-[#e0ebd3]">
           {/* Decorative background waves */}
        <div className="absolute inset-x-0 bottom-0 h-[40vh] md:h-[45vh] pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
         <div style={{ position: 'absolute', inset: 0, opacity: 0.85, transform: 'translateY(32px)' }}>
              <Wave
                fill="#dbe9c8"
           paused={false}
           options={{ height: 36, amplitude: 22, speed: 0.32, points: 3 }}
                style={{ width: '100%', height: '100%' }}
              />
             </div>
         <div style={{ position: 'absolute', inset: 0, opacity: 0.95, transform: 'translateY(56px)' }}>
              <Wave
                fill="#cfe3b3"
           paused={false}
           options={{ height: 28, amplitude: 16, speed: 0.26, points: 5 }}
                style={{ width: '100%', height: '100%' }}
              />
             </div>
           </div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-7xl md:text-8xl font-extrabold mb-1 text-main leading-tight font-hero relative z-10">
              Welcome to SukoonVerse
            </h1>
            {/* Centered Lottie animation below the main heading */}
    <div className="flex justify-center -mt-10 md:-mt-12 mb-8 relative z-20">
      <div className="w-72 md:w-96 drop-shadow-lg">
                <Lottie animationData={yogaAnimation} loop={true} autoplay={true} />
              </div>
            </div>
            {/* Additional hero copy moved below fold */}
          </div>
        </section>

        {/* Below-the-fold intro content (appears after first scroll) */}
        <section className="py-10 px-4 bg-[#e0ebd3] relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-subtle">
              An AI-powered, confidential, and empathetic mental wellness solution that supports and guides youth in overcoming stigma and accessing help.
            </h2>
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg mb-8">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg transform transition-transform duration-300 hover:-translate-y-2 border border-border">
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
              
              <div className="bg-white p-8 rounded-3xl shadow-lg transform transition-transform duration-300 hover:-translate-y-2 border border-border">
                <div className="bg-accent text-buttontext p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-main">Angry? Try It</h3>
                <p className="text-subtle mb-4">Release your frustration with a fun and calming anger release game. Transform negative energy into positive outcomes.</p>
                <Link to="/games" className="text-accentDark font-medium hover:text-accentDark/80 inline-flex items-center">
                  <span className="text-main">Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
              
              <div className="bg-white p-8 rounded-3xl shadow-lg transform transition-transform duration-300 hover:-translate-y-2 border border-border">
                <div className="bg-accent text-buttontext p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-main">Light Them Up</h3>
                <p className="text-subtle mb-4">Share your story anonymously and connect with others who care. Find comfort in knowing you're not alone in your experiences.</p>
                <Link to="/share" className="text-accentDark font-medium hover:text-accentDark/80 inline-flex items-center">
                  <span className="text-main">Try it now</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>

              {/* Sukoon Pulse (now themed like other feature cards) */}
              <div className="bg-white p-8 rounded-3xl shadow-lg transform transition-transform duration-300 hover:-translate-y-2 border border-border">
                <div className="bg-accent text-buttontext p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                  <User size={28} />
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-main">Sukoon Pulse</h3>
                <p className="text-subtle mb-4">See your community's anonymous mood pulse and try AI-suggested care actions together.</p>
                <Link to="/pulse" className="text-accentDark font-medium hover:text-accentDark/80 inline-flex items-center">
                  <span className="text-main">Open Pulse</span>
                  <ChevronRight size={18} className="ml-1" />
                </Link>
              </div>
              {/* Quote moved to its own section below */}
            </div>
          </div>
        </section>

        {/* Values Section: Built with Care & Authenticity */}
  <section className="py-20 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-main">Built with Care & Authenticity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center">
                <Shield size={44} className="mx-auto mb-4 text-main" />
                <h3 className="text-xl font-semibold text-main mb-2">100% Confidential</h3>
                <p className="text-subtle max-w-xs mx-auto">
                  Your privacy is our priority. All interactions are secure and anonymous.
                </p>
              </div>
              <div className="text-center">
                <Heart size={44} className="mx-auto mb-4 text-main" />
                <h3 className="text-xl font-semibold text-main mb-2">Genuinely Caring</h3>
                <p className="text-subtle max-w-xs mx-auto">
                  Created by mental health advocates who understand the struggles of youth.
                </p>
              </div>
              <div className="text-center">
                <Users size={44} className="mx-auto mb-4 text-accentDark" />
                <h3 className="text-xl font-semibold text-main mb-2">Community Driven</h3>
                <p className="text-subtle max-w-xs mx-auto">
                  Built with input from young people, for young people.
                </p>
              </div>
            </div>
          </div>
        </section>

  {/* Quote Section */}
  <section className="py-8 px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center my-2">
              <div className="flex flex-row items-center bg-[#ecefe6] rounded-2xl shadow border border-border px-8 py-6 w-full max-w-4xl mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-accentDark mr-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m2-4h6a2 2 0 012 2v2a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                <div className="flex flex-col text-left">
                  <p className="text-xl md:text-2xl text-main font-medium leading-relaxed">
                    "Mental health struggles are real, but so is recovery. We're here to walk alongside you on your journey toward wellness, one step at a time."
                  </p>
                  <p className="text-sm text-subtle mt-2 font-semibold text-center">— The SukoonVerse Team</p>
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
        className="group fixed bottom-8 right-8 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform transition hover:scale-110 z-50 animate-pulse-chat ring-2 ring-accent/20"
        aria-label="Let's Talk"
        style={{
          background: 'linear-gradient(135deg, #263a1e 0%, #6ea43a 60%, #a3c167 100%)',
          boxShadow: '0 10px 24px rgba(38,58,30,0.25)'
        }}
      >
        <MessageCircle size={28} />
        <span className="absolute -top-10 right-0 bg-accentDark text-white px-3 py-1 rounded-lg shadow-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">Let's Talk</span>
      </button>
    </div>
  );
};

export default Onboard;
