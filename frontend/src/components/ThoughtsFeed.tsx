import { useState } from "react";
import ThoughtCard from "./ThoughtCard";
// Inline SVG icons for search, filter, and add

// Inline Heart SVG for stats section
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#E57373" strokeWidth="2" className={props.className}>
    <path d="M12.1 18.55c-.1.1-.2.1-.3 0C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.86C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
  </svg>
);

type Thought = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  category: string;
  hearts: number;
  isHearted: boolean;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    hearts: number;
  }>;
};

const initialThoughts: Thought[] = [
    {
    id: "1",
    author: "Anonymous",
    content: "Today I realized that it's okay to take things one step at a time. I've been putting so much pressure on myself to have everything figured out, but maybe the journey itself is what matters most.",
    timestamp: "2 hours ago",
    category: "Reflection",
    hearts: 12,
    isHearted: false,
    comments: [
      {
        id: "c1",
        author: "Anonymous",
        content: "Thank you for sharing this. I needed to hear exactly this today. You're so right about the journey being what matters. 💙",
        timestamp: "1 hour ago",
        hearts: 5
      },
      {
        id: "c2", 
        author: "Anonymous",
        content: "Your words brought tears to my eyes in the best way. Taking it one step at a time is such wisdom.",
        timestamp: "45 minutes ago",
        hearts: 3
      }
    ]
  },
  {
    id: "2",
    author: "Anonymous",
    content: "Struggling with anxiety today. The world feels overwhelming and I can't seem to catch my breath. Just need to remind myself that this feeling will pass.",
    timestamp: "4 hours ago", 
    category: "Anxiety",
    hearts: 18,
    isHearted: true,
    comments: [
      {
        id: "c3",
        author: "Anonymous",
        content: "You're not alone in this 💙. Your awareness of the temporary nature of these feelings shows incredible strength.",
        timestamp: "3 hours ago",
        hearts: 8
      }
    ]
  },
  {
    id: "3",
    author: "Anonymous",
    content: "Grateful for my morning coffee, the sound of rain, and the fact that I woke up today with the chance to try again. Sometimes the smallest things hold the most magic.",
    timestamp: "6 hours ago",
    category: "Gratitude", 
    hearts: 24,
    isHearted: false,
    comments: []
  }
];

const ThoughtsFeed = () => {
  const [thoughts, setThoughts] = useState<Thought[]>(initialThoughts);
  const [newThought, setNewThought] = useState({ content: "", category: "reflection" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddingThought, setIsAddingThought] = useState(false);

  // Filter thoughts by search and category
  const filteredThoughts = thoughts.filter(thought => {
    const matchesSearch =
      thought.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thought.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || thought.category.toLowerCase() === filterCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleHeartToggle = (id: string) => {
    setThoughts(prevThoughts =>
      prevThoughts.map(thought =>
        thought.id === id
          ? {
              ...thought,
              isHearted: !thought.isHearted,
              hearts: thought.isHearted ? thought.hearts - 1 : thought.hearts + 1
            }
          : thought
      )
    );
  };

  const handleAddComment = (thoughtId: string, commentContent: string) => {
    const newComment = {
      id: `c${Date.now()}`,
      author: "You",
      content: commentContent,
      timestamp: "just now",
      hearts: 0
    };

    setThoughts(prevThoughts =>
      prevThoughts.map(thought =>
        thought.id === thoughtId
          ? { ...thought, comments: [...thought.comments, newComment] }
          : thought
      )
    );
  };

  const handleAddThought = () => {
    if (!newThought.content.trim()) return;

    const thought: Thought = {
      id: Date.now().toString(),
      author: "You",
      content: newThought.content,
      timestamp: "just now",
      category: newThought.category.charAt(0).toUpperCase() + newThought.category.slice(1),
      hearts: 0,
      isHearted: false,
      comments: []
    };

    setThoughts(prev => [thought, ...prev]);
    setNewThought({ content: "", category: "reflection" });
  setIsAddingThought(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Open Thoughts</h1>
        <p className="text-muted-foreground">
          A safe space to share what's on your mind and connect with others
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center py-6">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground">
            {/* Search SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search thoughts or authors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-lg border bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {/* Category Filter */}
        <div className="relative flex items-center gap-2">
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground">
            {/* Filter SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17V13.414a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z" />
            </svg>
          </span>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="pl-8 rounded-lg border bg-gray-100 px-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="anxiety">Anxiety</option>
            <option value="gratitude">Gratitude</option>
            <option value="reflection">Reflection</option>
          </select>
        </div>
        {/* Share Thought Button */}
        <button
          className="bg-[#5E8E4A] hover:bg-[#466C36] text-white font-semibold rounded-xl px-8 py-2 flex items-center gap-2 shadow transition-colors"
          onClick={() => setIsAddingThought(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="white" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-lg font-semibold">Share Thought</span>
        </button>
      </div>

      {/* Add Thought Modal */}
      {isAddingThought && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Share Your Thoughts</h2>
              <label htmlFor="content" className="block font-medium mb-1">What's on your mind?</label>
              <textarea
                id="content"
                placeholder="Share what you're thinking or feeling..."
                value={newThought.content}
                onChange={e => setNewThought(prev => ({ ...prev, content: e.target.value }))}
                className="min-h-[80px] w-full rounded border px-3 py-2 mb-2"
              />
              <label htmlFor="category" className="block font-medium mt-2 mb-1">Category</label>
              <select
                id="category"
                value={newThought.category}
                onChange={e => setNewThought(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded border px-3 py-2 mb-2"
              >
                <option value="anxiety">Anxiety</option>
                <option value="gratitude">Gratitude</option>
                <option value="reflection">Reflection</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddThought}
                className="flex-1 bg-[#5E8E4A] hover:bg-[#466C36] text-white rounded-xl py-2 font-semibold transition-colors"
              >
                Share Thought
              </button>
              <button
                onClick={() => setIsAddingThought(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
     
      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-sm bg-muted/30 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-[#E57373]" />
          <span className="text-gray-400">{thoughts.reduce((sum, t) => sum + t.hearts, 0)} hearts given</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-300">•</span>
          <span className="text-gray-400">{thoughts.length} thoughts shared</span>
        </div>
      </div>

      {/* Thoughts Feed */}
      <div className="space-y-6">
        {filteredThoughts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No thoughts yet. Be the first to share!</p>
          </div>
        ) : (
          filteredThoughts.map((thought) => (
            <ThoughtCard
              key={thought.id}
              thought={thought}
              onHeartToggle={handleHeartToggle}
              onAddComment={handleAddComment}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ThoughtsFeed;