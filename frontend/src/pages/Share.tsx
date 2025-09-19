
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

function timeAgo(date: Date) {
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

const initialTweets = [
	{
		id: 1,
		text: "I've been feeling overwhelmed lately with work and personal life. It's hard to find a balance.",
		createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
		likes: 23,
		comments: 5,
		replies: [
			{
				text: "I understand how you feel. It's important to take breaks and prioritize self-care. Have you tried any relaxation techniques?",
				createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
			},
			{
				text: "Setting boundaries can help. Don't be afraid to say no to extra tasks or commitments.",
				createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
			}
		]
	}
];

const Share: React.FC = () => {
	const [tweets, setTweets] = useState(initialTweets);
	const [newTweet, setNewTweet] = useState("");

	const handleAddTweet = () => {
		if (newTweet.trim()) {
			setTweets([
				{
					id: Date.now(),
					text: newTweet,
					createdAt: new Date(),
					likes: 0,
					comments: 0,
					replies: []
				},
				...tweets
			]);
			setNewTweet("");
		}
	};

	return (
		<div className="bg-background-light min-h-screen font-display text-slate-800 flex flex-col">
			<Sidebar isOpen={true} onToggle={() => {}} />
			<main className="flex-1">
				<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="max-w-3xl mx-auto">
						{/* New Tweet Input */}
						<div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
							<div className="p-6 flex items-center gap-4">
								<div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center">
									<span className="material-symbols-outlined text-white text-3xl">chat_bubble</span>
								</div>
								<input
									className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="What's on your mind? Share anonymously..."
									value={newTweet}
									onChange={e => setNewTweet(e.target.value)}
									onKeyDown={e => e.key === "Enter" && handleAddTweet()}
								/>
								<button
									className="bg-primary text-white rounded-lg px-4 py-2 flex items-center gap-1 hover:bg-blue-700 transition"
									onClick={handleAddTweet}
								>
									<span className="material-symbols-outlined">send</span>
									Share
								</button>
							</div>
						</div>
						{/* Tweets Feed */}
						{tweets.map(tweet => (
							<div key={tweet.id} className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
								<div className="p-6">
									<div className="flex items-start gap-4">
										<div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center">
											<span className="material-symbols-outlined text-white text-3xl">chat_bubble</span>
										</div>
										<div className="flex-1">
											<div className="flex items-baseline justify-between">
												<div>
													<p className="font-bold text-slate-800">Anonymous</p>
													<p className="text-sm text-slate-500">{timeAgo(tweet.createdAt)}</p>
												</div>
												<button className="text-slate-400 hover:text-slate-600">
													<span className="material-symbols-outlined">more_horiz</span>
												</button>
											</div>
											<p className="mt-2 text-slate-600">{tweet.text}</p>
										</div>
									</div>
								</div>
								<div className="px-6 pb-4 flex items-center gap-6 border-b border-slate-200">
									<button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group">
										<span className="material-symbols-outlined group-hover:text-primary">favorite</span>
										<span className="text-sm font-semibold">{tweet.likes}</span>
									</button>
									<button className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group">
										<span className="material-symbols-outlined group-hover:text-primary">chat_bubble</span>
										<span className="text-sm font-semibold">{tweet.comments}</span>
									</button>
								</div>
								{/* Replies */}
								{tweet.replies && tweet.replies.length > 0 && (
									<div className="p-6 space-y-6">
										{tweet.replies.map((reply, idx) => (
											<div key={idx} className="flex items-start gap-4">
												<div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center">
													<span className="material-symbols-outlined text-white">chat_bubble</span>
												</div>
												<div className="flex-1">
													<div className="bg-slate-100 rounded-lg p-3">
														<div className="flex items-baseline gap-2">
															<p className="text-sm font-bold text-slate-800">Anonymous</p>
															<p className="text-xs text-slate-500">{timeAgo(reply.createdAt)}</p>
														</div>
														<p className="text-sm text-slate-600 mt-1">{reply.text}</p>
													</div>
												</div>
											</div>
										))}
										<div className="bg-slate-50 p-4 border-t border-slate-200">
											<div className="flex items-center gap-3">
												<div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center">
													<span className="material-symbols-outlined text-white">chat_bubble</span>
												</div>
												<div className="relative flex-1">
													<input className="form-input w-full rounded-full bg-slate-100 border-transparent focus:border-primary focus:ring-primary text-slate-800 placeholder:text-slate-400 py-2 pl-4 pr-12 text-sm" placeholder="Add a comment..." />
													<button className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-primary hover:text-primary/80">
														<span className="material-symbols-outlined">send</span>
													</button>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</main>
		</div>
	);
};

export default Share;

