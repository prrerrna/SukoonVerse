import Sidebar from "../components/Sidebar";
import { useState } from "react";
import ThoughtsFeed from '../components/ThoughtsFeed';

const Share = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const handleSidebarToggle = () => setSidebarOpen((open) => !open);

  return (
    <div className="min-h-screen bg-wellness flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="container mx-auto px-4 py-8">
          <ThoughtsFeed />
        </main>
        {/* Partition Line */}
        <div className="w-full h-0.5 bg-[#D6EAD8] mt-12 mb-0" />
        {/* Footer */}
        <footer className="bg-card/50 border-t border-border/50 mt-0">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Remember: You're not alone. Every thought shared here comes from courage, every comment from compassion.
            </p>
            <div className="mt-4 flex justify-center gap-6 text-xs text-muted-foreground">
              <span>💙 Mental Health Matters</span>
              <span>🌱 Growth Through Connection</span>
              <span>✨ Healing Together</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Share;
