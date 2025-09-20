import { useState } from "react";
import { CommentSection } from "../pages/CommentSection";

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  hearts: number;
}

export interface Thought {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  category: string;
  hearts: number;
  isHearted: boolean;
  comments: Comment[];
}

interface ThoughtCardProps {
  thought: Thought;
  onHeartToggle: (id: string) => void;
  onAddComment: (thoughtId: string, comment: string) => void;
}

export const ThoughtCard = ({ thought, onHeartToggle, onAddComment }: ThoughtCardProps) => {
  const [showComments, setShowComments] = useState(false);

  // Category color mapping: light bg, deep text
  const getCategoryStyle = (category: string) => {
    switch (category.toLowerCase()) {
      case 'anxiety':
        return 'bg-[#E3F2FD] text-[#42A5F5]'; // very light blue bg, lighter blue text
      case 'gratitude':
        return 'bg-[#FFF3E0] text-[#FFB74D]'; // very light orange bg, lighter orange text
      case 'reflection':
        return 'bg-[#F3E5F5] text-[#BA68C8]'; // very light purple bg, lighter purple text
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="bg-white shadow-gentle hover:shadow-warm transition-all duration-300 animate-fade-in group p-4 rounded-xl mb-4">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-medium text-primary">
            {thought.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-card-foreground">{thought.author}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {/* Calendar SVG icon */}
              <span className="text-base">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v2M8 3v2M3 9h18" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
              {thought.timestamp}
            </div>
          </div>
        </div>
  <span className={`px-3 py-1 rounded-full font-semibold text-sm shadow-sm ${getCategoryStyle(thought.category)}`}>{thought.category}</span>
      </div>
      <div className="space-y-4">
        <p className="text-card-foreground leading-relaxed">{thought.content}</p>
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => onHeartToggle(thought.id)}
            className={`flex items-center gap-2 px-2 py-1 rounded transition-all duration-300 ${thought.isHearted ? 'text-red-500' : 'text-gray-400 hover:text-destructive'}`}
            aria-label="heart"
          >
            {/* Heart SVG icon: outline by default, filled red when hearted */}
            {thought.isHearted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="1.5" className="w-5 h-5">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12.1 18.55c-.1.1-.2.1-.3 0C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.86C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
              </svg>
            )}
            <span className="text-gray-400 font-medium">{thought.hearts}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-2 py-1 rounded text-gray-400 hover:text-primary transition-colors"
            aria-label="comments"
          >
            {/* Comment SVG icon (outline, matching image) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M21 6.5A2.5 2.5 0 0018.5 4h-13A2.5 2.5 0 003 6.5v9A2.5 2.5 0 005.5 18H6v2a1 1 0 001.6.8l3.1-2.8h7.8A2.5 2.5 0 0021 15.5v-9z" />
            </svg>
            <span className="text-gray-400 font-medium">{thought.comments.length} comments</span>
          </button>
        </div>
        {showComments && (
          <CommentSection
            comments={thought.comments}
            onAddComment={(comment) => onAddComment(thought.id, comment)}
          />
        )}
      </div>
    </div>
  );
};

export default ThoughtCard;