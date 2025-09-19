import { useState } from "react";
// Removed unused Heart import
import { Comment } from "../components/ThoughtCard";

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (comment: string) => void;
}

export const CommentSection = ({ comments, onAddComment }: CommentSectionProps) => {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    onAddComment(newComment.trim());
    setNewComment("");
    setIsSubmitting(false);
  };

  const supportivePrompts = [
    "You're not alone in this 💙",
    "Your feelings are completely valid",
    "Thank you for sharing your courage",
    "Sending you gentle strength",
    "This too shall pass 🌅",
  ];

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {comments.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 animate-fade-in">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs">
                {comment.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-card-foreground">
                      {comment.author}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-card-foreground leading-relaxed">
                    {comment.content}
                  </p>
                </div>
                <button
                  className="mt-1 h-6 px-2 text-xs text-muted-foreground hover:text-destructive transition-colors rounded flex items-center gap-1"
                  aria-label="like comment"
                >
                  {/* Heart outline SVG icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.1 18.55c-.1.1-.2.1-.3 0C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.86C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
                  </svg>
                  {comment.hearts}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-1 mb-2">
          {supportivePrompts.map((prompt, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setNewComment(prompt)}
              className="h-7 px-2 text-xs bg-accent/30 border-accent/50 hover:bg-accent/50 transition-colors rounded"
            >
              {prompt}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share some encouragement or support..."
              className="min-h-[60px] w-full resize-none bg-[#f8fafc] border-2 border-[#D9EDC6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D9EDC6] rounded-2xl px-4 py-3 text-base"
            />
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="flex items-center justify-center bg-primary/20 text-primary rounded-xl w-12 h-12 hover:bg-primary/40 transition-colors"
            style={{ marginBottom: 0 }}
          >
            {/* Send SVG icon (matching image style) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M3 12l18-7-7 18-2.5-7L3 12z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};