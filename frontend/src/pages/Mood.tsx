// Mood.tsx: A page for displaying mood history and trends.
import { useEffect, useMemo, useRef, useState } from 'react';
// import { motion } from 'framer-motion';
import useSession from '../hooks/useSession';
import { reportPulse, saveMoodToCloud, getCloudMoodHistory, getMoodStats, deleteMoodEntry } from '../lib/api';
import TrendChart from '../components/TrendChart';
import MoodPicker from '../components/MoodPicker';
import JournalEntry from '../components/JournalEntry';
import { getLast7Days, addSnapshot, clearAll, isPersistenceEnabled, enablePersistence, disablePersistence } from '../utils/indexeddb';
import { getMoodHistory } from '../lib/api';
import BreathTimer from '../components/BreathTimer';
import Sidebar from '../components/Sidebar';
import ThemeSelector from '../components/ThemeSelector';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';

type DayPoint = { 
  day: string; 
  score: number | null;
  manualScore?: number | null;
  chatScore?: number | null;
};

interface MoodSnapshot {
  id?: number;
  timestamp: number;
  label: string;
  score: number;
  journal?: string;
  source?: 'manual' | 'chat';
}

const weekdayShort = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' });

const formatISO = (d: Date) => d.toISOString().slice(0, 10);

const Mood = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { sessionId } = useSession();
  const [data, setData] = useState<DayPoint[]>([]);
  const [recent, setRecent] = useState<MoodSnapshot[]>([]);
  const [selected, setSelected] = useState<{ label: string; score: number }>({ label: 'neutral', score: 5 });
  const [isPersistent, setIsPersistent] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'manual' | 'chat'>('all');
  const [useServerData, setUseServerData] = useState<boolean>(false);
  const [useCloudStorage, setUseCloudStorage] = useState<boolean>(false);
  const [loadingServer, setLoadingServer] = useState<boolean>(false);
  const [loadingCloud, setLoadingCloud] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showBreath, setShowBreath] = useState<boolean>(false);

  // Pulse opt-in and theme selection
  const [pulseOptIn, setPulseOptIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('pulseOptIn') === 'true';
  });
  const [region, setRegion] = useState<string>(() => {
    if (typeof window === 'undefined') return 'MyCampus';
    return window.localStorage.getItem('pulseRegion') || 'MyCampus';
  });
  const ALLOWED_THEMES = [
    'exam','sleep','family','peer pressure','loneliness','friends','relationships','stress','social','money','health','career'
  ];
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const [todayAvg, setTodayAvg] = useState<number | null>(null);
  const [weeklyAvg, setWeeklyAvg] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [entryCount, setEntryCount] = useState<number>(0);
  const [bestDay, setBestDay] = useState<{ day: string; score: number } | null>(null);
  const [worstDay, setWorstDay] = useState<{ day: string; score: number } | null>(null);
  const confettiRef = useRef<HTMLDivElement | null>(null);
  const prevStreakRef = useRef<number>(0);

  const load = async () => {
    let entries = [];
    
    // Get mood data based on selected source
    if (useCloudStorage && isAuthenticated) {
      // Use cloud storage (Firestore) if authenticated
      setLoadingCloud(true);
      try {
        const cloudData = await getCloudMoodHistory(7);
        entries = cloudData.history.map((entry: any) => ({
          id: entry.id,
          timestamp: new Date(entry.timestamp).getTime(),
          label: entry.label,
          score: entry.score,
          source: entry.source || 'manual',
          journal: entry.journal,
          themes: entry.themes || []
        }));
        
        // Also try to get stats directly from the cloud
        try {
          const stats = await getMoodStats(7);
          if (stats) {
            setStreak(stats.streak || 0);
            setWeeklyAvg(stats.weekly_avg || null);
            setEntryCount(stats.entry_count || 0);
            
            if (stats.best_day) {
              setBestDay({
                day: weekdayShort(new Date(stats.best_day.date)),
                score: stats.best_day.score
              });
            }
            
            if (stats.worst_day) {
              setWorstDay({
                day: weekdayShort(new Date(stats.worst_day.date)),
                score: stats.worst_day.score
              });
            }
          }
        } catch (statsError) {
          console.error('Failed to load mood stats from cloud:', statsError);
          // We'll calculate stats locally as fallback
        }
      } catch (error) {
        console.error('Failed to load mood data from cloud:', error);
        // Fall back to local data
        entries = await getLast7Days();
      } finally {
        setLoadingCloud(false);
      }
    } else if (useServerData) {
      // Try to get data from server (session-based)
      setLoadingServer(true);
      try {
        const serverData = await getMoodHistory(7);
        entries = serverData.history.map((entry: any) => ({
          timestamp: new Date(entry.timestamp).getTime(),
          label: entry.label,
          score: entry.score,
          source: entry.source || 'api',
          journal: entry.message || undefined
        }));
      } catch (error) {
        console.error('Failed to load mood data from server:', error);
        // Fall back to local data
        entries = await getLast7Days();
      } finally {
        setLoadingServer(false);
      }
    } else {
      // Just use local data
      entries = await getLast7Days();
    }
    
    // Build last 7 days keys
    const days: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push(formatISO(d));
    }
    
    // Process all entries for chart data regardless of filter
    // We'll always show all data types in the chart

    // Separate maps for all entries, manual entries, and chat entries
    const map: Record<string, number[]> = {};
    const manualMap: Record<string, number[]> = {};
    const chatMap: Record<string, number[]> = {};
    
    days.forEach((d) => {
      map[d] = [];
      manualMap[d] = [];
      chatMap[d] = [];
    });

    // Process all entries for the chart regardless of filter
    // (we'll always show all data types in the chart, just highlight different ones)
    entries.forEach((e: MoodSnapshot) => {
      const day = new Date(e.timestamp).toISOString().slice(0, 10);
      if (map[day]) {
        // Add to overall scores
        map[day].push(Number(e.score) || 0);
        
        // Also add to the appropriate source-specific map
        if (e.source === 'manual' && manualMap[day]) {
          manualMap[day].push(Number(e.score) || 0);
        } else if (e.source === 'chat' && chatMap[day]) {
          chatMap[day].push(Number(e.score) || 0);
        }
      }
    });

    const chart: DayPoint[] = days.map((iso) => {
      const arr = map[iso];
      const manualArr = manualMap[iso];
      const chatArr = chatMap[iso];
      // Calculate averages for each category
      const avg = arr.length ? Math.round((arr.reduce((a: number, b: number) => a + b, 0) / arr.length) * 10) / 10 : null;
      const manualAvg = manualArr.length ? Math.round((manualArr.reduce((a: number, b: number) => a + b, 0) / manualArr.length) * 10) / 10 : null;
      const chatAvg = chatArr.length ? Math.round((chatArr.reduce((a: number, b: number) => a + b, 0) / chatArr.length) * 10) / 10 : null;
      return { 
        day: weekdayShort(new Date(iso)), 
        score: avg || 0,
        manualScore: manualAvg,
        chatScore: chatAvg,
      };
    });
    setData(chart);
    
    // Fix: define todayScores before using
    const todayIso = days[days.length - 1];
    const todayScores: number[] = map[todayIso] || [];
    const todayAvgCalc = todayScores.length ? Math.round((todayScores.reduce((a: number, b: number) => a + b, 0) / todayScores.length) * 10) / 10 : null;
    setTodayAvg(todayAvgCalc);

    // Only calculate these if we didn't get them from cloud stats
    if (!(useCloudStorage && isAuthenticated)) {
      // Weekly average over non-empty days
      const nonEmptyAverages = days
        .map((iso) => {
          const arr = map[iso];
          return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        })
        .filter((v): v is number => v !== null && !Number.isNaN(v));
      const weeklyAvgCalc = nonEmptyAverages.length
        ? Math.round((nonEmptyAverages.reduce((a, b) => a + b, 0) / nonEmptyAverages.length) * 10) / 10
        : null;
      setWeeklyAvg(weeklyAvgCalc);
  
      // Streak: consecutive days with at least one entry, ending today
      let s = 0;
      for (let i = days.length - 1; i >= 0; i--) {
        const iso = days[i];
        if ((map[iso] || []).length > 0) s++;
        else break;
      }
      setStreak(s);
  
      // Entry count (last 7 days)
      let count = 0;
      days.forEach((iso) => (count += (map[iso] || []).length));
      setEntryCount(count);
  
      // Best / worst day (by avg) among non-empty days
      const dailyAverages: { iso: string; score: number }[] = [];
      days.forEach((iso) => {
        const arr = map[iso];
        if (!arr.length) return;
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        dailyAverages.push({ iso, score: Math.round(avg * 10) / 10 });
      });
      if (dailyAverages.length >= 2) {
        const bestEntry = dailyAverages.reduce((acc, cur) => (cur.score > acc.score ? cur : acc), dailyAverages[0]);
        const worstEntry = dailyAverages.reduce((acc, cur) => (cur.score < acc.score ? cur : acc), dailyAverages[0]);
        setBestDay({ day: weekdayShort(new Date(bestEntry.iso)), score: bestEntry.score });
        setWorstDay({ day: weekdayShort(new Date(worstEntry.iso)), score: worstEntry.score });
      } else {
        setBestDay(null);
        setWorstDay(null);
      }
    }

    // Filter recent entries based on the selected filter
    const filteredRecent = filter === 'all' 
      ? entries 
      : entries.filter((e: MoodSnapshot) => e.source === filter);

    // recent entries: sort by timestamp desc
    const recentSorted = filteredRecent
      .slice()
      .sort((a: MoodSnapshot, b: MoodSnapshot) => b.timestamp - a.timestamp)
      .slice(0, 10);
    setRecent(recentSorted);
  };

  // Check authentication status
  useEffect(() => {
    if (!firebaseAuth) {
      setIsAuthenticated(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        setUseCloudStorage(true); // Enable cloud storage by default for logged-in users
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Check persistence status on component mount
  useEffect(() => {
    load();
    setIsPersistent(isPersistenceEnabled());
  }, []);
  
  // Reload data when filter changes or cloud storage setting changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, useCloudStorage]);
  
  // Toggle persistence setting
  const togglePersistence = () => {
    const newState = !isPersistent;
    if (newState) {
      enablePersistence();
    } else {
      disablePersistence();
    }
    setIsPersistent(newState);
  };

  const handleSave = async (journal: string) => {
    // Save to local database
    await addSnapshot({ 
      label: selected.label, 
      score: selected.score,
      journal: journal.trim() ? journal : undefined,
      source: 'manual'
    });
    
    // Also save to cloud if the user is authenticated and has cloud storage enabled
    if (isAuthenticated && useCloudStorage) {
      try {
        await saveMoodToCloud({
          label: selected.label,
          score: selected.score,
          journal: journal.trim() || undefined,
          source: 'manual',
          themes: selectedThemes.length > 0 ? selectedThemes : undefined
        });
      } catch (error) {
        console.error('Error saving mood to cloud:', error);
      }
    }
    // Report to Pulse if opted in (no raw text, only score + themes)
    try {
      if (pulseOptIn && sessionId) {
        await reportPulse({
          session_id: sessionId,
          region: region || 'MyCampus',
          mood_score: selected.score,
          themes: selectedThemes,
        });
      }
    } catch (e) {
      // Non-blocking; ignore errors in UI
      console.warn('Pulse report failed', e);
    }
    await load();
  };

  const handleClear = async () => {
    if (isAuthenticated && useCloudStorage) {
      if (!confirm('This will clear all your mood entries from cloud storage. Continue?')) {
        return;
      }
      try {
        const history = await getCloudMoodHistory(100);
        if (history && history.history) {
          // Delete each mood entry from the cloud
          for (const entry of history.history) {
            if (entry.id) {
              await deleteMoodEntry(entry.id);
            }
          }
        }
      } catch (error) {
        console.error('Error clearing cloud mood entries:', error);
      }
    }
    
    await clearAll(); // Clear local storage entries
    await load();  // Reload entries
  };

  // Confetti on streak increase
  useEffect(() => {
    const prev = prevStreakRef.current;
    if (streak > prev && confettiRef.current) {
      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
      for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.left = Math.random() * 100 + '%';
        const size = 6 + Math.random() * 6;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.background = colors[i % colors.length];
        el.style.animation = `fall ${1.2 + Math.random()}s linear forwards`;
        confettiRef.current.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      }
    }
    prevStreakRef.current = streak;
  }, [streak]);

  // Helpers for UI polish
  const moodLabelFromScore = (score?: number | null) => {
    if (score == null) return 'No data';
    if (score <= 2) return 'Very Sad';
    if (score <= 4) return 'Low';
    if (score === 5) return 'Neutral';
    if (score <= 7) return 'Calm';
    if (score <= 8) return 'Happy';
    if (score <= 9) return 'Joyful';
    return 'Elated';
  };

  const scoreHue = (score?: number | null) => {
    if (score == null) return 220; // grayish
    // Map 1..10 to red(0) -> green(120)
    const clamped = Math.max(1, Math.min(10, score));
    return Math.round(((clamped - 1) / 9) * 120);
  };

  const gauge = useMemo(() => {
    const s = todayAvg ?? 0;
    const pct = Math.max(0, Math.min(1, s / 10));
    const C = 60; // radius
    const STROKE = 12;
    const circumference = 2 * Math.PI * C;
    const offset = circumference * (1 - pct);
    const hue = scoreHue(todayAvg);
    return (
      <svg viewBox="0 0 160 160" className="w-40 h-40">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`hsl(${hue}, 90%, 60%)`} />
            <stop offset="100%" stopColor={`hsl(${hue + 30}, 90%, 55%)`} />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={C} stroke="#e5e7eb" strokeWidth={STROKE} fill="none" />
        <circle
          cx="80" cy="80" r={C}
          stroke="url(#g)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
          transform="rotate(-90 80 80)"
        />
        <text x="80" y="78" textAnchor="middle" className="fill-white" style={{ fontSize: 28, fontWeight: 700 }}>{todayAvg ?? 0}</text>
        <text x="80" y="100" textAnchor="middle" className="fill-white/80" style={{ fontSize: 12 }}>{moodLabelFromScore(todayAvg) === 'No data' ? <tspan className="fill-white">No data</tspan> : moodLabelFromScore(todayAvg)}</text>
      </svg>
    );
  }, [todayAvg]);

  // Map mood to an emoji for richer UI cues
  const moodEmoji = (label?: string, score?: number | null) => {
    const l = (label || '').toLowerCase();
    if (l.includes('sad') || l.includes('down')) return '😞';
    if (l.includes('anx') || l.includes('worry')) return '😟';
    if (l.includes('ang') || l.includes('frustrat')) return '😠';
    if (l.includes('neutral') || score === 5) return '😐';
    if (l.includes('calm') || (score && score >= 6 && score <= 7)) return '🙂';
    if (l.includes('happy') || (score && score >= 8 && score <= 9)) return '😄';
    if (l.includes('joy') || (score && score >= 9)) return '🤩';
    if (l.includes('tired')) return '🥱';
    return score && score <= 3 ? '😟' : '😐';
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'yesterday';
    return `${day}d ago`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#e0ebd3] overflow-hidden w-full">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((o) => !o)} />

      {/* Main Content with left margin to accommodate sidebar */}
      <div
        className="flex-1 overflow-hidden px-1 sm:px-2 md:px-4 lg:px-6 xl:px-10 pt-4"
        style={{
          marginLeft: isOpen ? '12rem' : '5rem',
          minHeight: '100vh',
          maxWidth: `calc(100vw - ${isOpen ? '12rem' : '5rem'})`,
          width: '100%',
          transition: 'margin-left 400ms cubic-bezier(.22,.9,.36,1), max-width 400ms cubic-bezier(.22,.9,.36,1)',
          willChange: 'margin-left, max-width',
        }}
      >
      <div ref={confettiRef} className="confetti-container pointer-events-none select-none"></div>
      {/* Hero header with dynamic gradient by todayAvg */}
      <div
        className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 shadow-lg text-white animate-fade-in w-full max-w-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #263a1e 0%, #6ea43a 60%, #a3c167 100%)',
        }}
      >
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 w-full md:w-auto">
            <div className="hidden sm:block">{gauge}</div>
            <div className="w-full">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">Your Mood Dashboard</h1>
              <p className="text-white/90 mt-1 text-sm sm:text-base">Hello, welcome back! Here's your mood summary.</p>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/80">
                <span className="mr-3">Today: <strong>{todayAvg ?? '—'}</strong> / 10</span>
                <span>Weekly: <strong>{weeklyAvg ?? '—'}</strong> / 10</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 mt-2 w-full md:w-auto">
            <button 
              onClick={() => setShowBreath(true)} 
              className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow transition-colors duration-200 transform hover:scale-105 text-xs sm:text-sm md:text-base flex-1 md:flex-none text-center"
            >
              60s Breathe
            </button>
            <a 
              href="#journal" 
              className="px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow transition-colors duration-200 transform hover:scale-105 text-xs sm:text-sm md:text-base flex-1 md:flex-none text-center"
            >
              Add Journal
            </a>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 overflow-x-hidden w-full max-w-full">
        <div className="bg-white/90 rounded-2xl p-2 sm:p-4 shadow flex items-center gap-2 sm:gap-3 animate-fade-in transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg">
          <div className="bg-teal-100 p-2 sm:p-3 rounded-full text-xl sm:text-2xl">🔥</div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-gray-500">Streak</div>
            <div className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{streak} Days</div>
          </div>
        </div>
        <div className="bg-white/90 rounded-2xl p-2 sm:p-4 shadow flex items-center gap-2 sm:gap-3 animate-fade-in transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg" style={{animationDelay:'60ms'}}>
          <div className="bg-purple-100 p-2 sm:p-3 rounded-full text-xl sm:text-2xl">🗓️</div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-gray-500">Entries</div>
            <div className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{entryCount}</div>
          </div>
        </div>
        <div className="bg-white/90 rounded-2xl p-2 sm:p-4 shadow flex items-center gap-2 sm:gap-3 animate-fade-in transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg" style={{animationDelay:'120ms'}}>
          <div className="bg-green-100 p-2 sm:p-3 rounded-full text-xl sm:text-2xl">😊</div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-gray-500">Best Day</div>
            <div className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{bestDay ? `${bestDay.day}` : '—'}</div>
          </div>
        </div>
        <div className="bg-white/90 rounded-2xl p-2 sm:p-4 shadow flex items-center gap-2 sm:gap-3 animate-fade-in transition-all duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg" style={{animationDelay:'180ms'}}>
          <div className="bg-red-100 p-2 sm:p-3 rounded-full text-xl sm:text-2xl">😞</div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-gray-500">Toughest</div>
            <div className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{worstDay ? `${worstDay.day}` : '—'}</div>
          </div>
        </div>
      </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mx-auto w-full overflow-x-hidden px-2 sm:px-4 max-w-full">
        {/* Left: Check-in & Journal */}
  <div id="journal" className="lg:col-span-1 bg-white/90 p-4 sm:p-6 rounded-3xl shadow-lg lg:sticky lg:top-4">
          <h2 className="text-xl font-semibold mb-3">How are you feeling?</h2>
          <MoodPicker value={selected} onChange={setSelected} />
          {/* Fine-tune slider inspired by sample */}
          <div className="mt-4">
            <label htmlFor="mood-scale" className="text-sm font-medium text-gray-700">Fine‑tune your mood (1–10)</label>
            <input
              id="mood-scale"
              type="range"
              min={1}
              max={10}
              value={selected.score}
              onChange={(e) => setSelected({ ...selected, score: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-accent/90"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
          {/* Pulse opt-in */}
          <div className="mt-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Contribute to Sukoon Pulse (anonymous)</label>
              <input
                type="checkbox"
                checked={pulseOptIn}
                onChange={(e)=>{
                  const v = e.target.checked;
                  setPulseOptIn(v);
                  if (typeof window !== 'undefined') window.localStorage.setItem('pulseOptIn', v ? 'true' : 'false');
                }}
                className="h-4 w-4 accent-accent"
              />
            </div>
            {pulseOptIn && (
              <div className="mt-3">
                <label className="text-xs text-gray-600">Region</label>
                <input
                  value={region}
                  onChange={(e)=>{
                    setRegion(e.target.value);
                    if (typeof window !== 'undefined') window.localStorage.setItem('pulseRegion', e.target.value);
                  }}
                  className="mt-1 w-full border rounded px-3 py-2 text-sm"
                  placeholder="MyCampus"
                />
                <div className="mt-3 text-xs text-gray-600">Pick up to 3 themes:</div>
                <ThemeSelector 
                  value={selectedThemes} 
                  onChange={setSelectedThemes} 
                  maxSelections={3} 
                  themes={ALLOWED_THEMES}
                />
              </div>
            )}
          </div>
          <div className="mt-3">
            <JournalEntry onSave={handleSave} />
          </div>
          <div className="mt-4 flex flex-col space-y-2">
            <div className="flex items-center mb-1">
              <input
                id="persistence-toggle"
                type="checkbox"
                checked={isPersistent}
                onChange={togglePersistence}
                className="mr-2 h-4 w-4 accent-accent"
              />
              <label htmlFor="persistence-toggle" className="text-sm">
                Remember entries between sessions
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="server-data-toggle"
                type="checkbox"
                checked={useServerData}
                onChange={() => {
                  setUseServerData(!useServerData);
                  setTimeout(load, 10);
                }}
                className="mr-2 h-4 w-4 accent-accent"
              />
              <label htmlFor="server-data-toggle" className="text-sm">
                Include server-stored mood data {loadingServer && '(Loading...)'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="cloud-storage-toggle"
                type="checkbox"
                checked={useCloudStorage}
                onChange={() => {
                  if (!isAuthenticated) {
                    alert("You need to be signed in to use cloud storage.");
                    return;
                  }
                  setUseCloudStorage(!useCloudStorage);
                  setTimeout(load, 10);
                }}
                className="mr-2 h-4 w-4 accent-accent"
              />
              <label htmlFor="cloud-storage-toggle" className="text-sm">
                Use cloud storage {loadingCloud && '(Loading...)'}
              </label>
            </div>
            <div className="flex gap-2 mt-1">
              
              <button className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow transition-colors duration-200 transform hover:scale-105 transition-transform" onClick={() => setShowBreath(true)}>
                Quick Breathe
              </button>
                <button className="px-3 py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow transition-colors duration-200 transform hover:scale-105 transition-transform" onClick={handleClear}>
                  Clear all entries
                </button>
              
            </div>
          </div>
        </div>

        {/* Middle & Right: Trend + Recent */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 overflow-x-hidden">
          <div className="bg-white/90 p-3 sm:p-4 md:p-6 rounded-3xl shadow-lg transition-transform duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden">
            <div className="overflow-x-hidden w-full">
              <TrendChart data={data.map(d => ({ day: d.day, score: d.score ?? null, manualScore: (d as any).manualScore ?? undefined, chatScore: (d as any).chatScore ?? undefined }))} />
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3">
              <p>The chart shows your average mood score for each day (scale of 1–10).</p>
              <p>Higher scores (8–10) represent more positive moods, while lower scores (1–3) represent more challenging emotions.</p>
              <p>Days without entries are omitted from the line.</p>
            </div>
          </div>

          <div className="bg-white/90 p-3 sm:p-4 md:p-6 rounded-3xl shadow-lg transition-transform duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2 sm:gap-0">
              <h3 className="text-base sm:text-lg font-medium">Recent entries</h3>
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg font-semibold shadow transition-colors duration-200 transform hover:scale-105 transition-transform ${filter === 'all' ? 'bg-accent text-white' : 'bg-accent/20 text-main hover:bg-accent/40'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('manual')}
                  className={`px-3 py-1 text-sm rounded-lg font-semibold shadow transition-colors duration-200 transform hover:scale-105 transition-transform ${filter === 'manual' ? 'bg-accent text-white' : 'bg-accent/20 text-main hover:bg-accent/40'}`}
                >
                  Manual
                </button>
                <button
                  onClick={() => setFilter('chat')}
                  className={`px-3 py-1 text-sm rounded-lg font-semibold shadow transition-colors duration-200 transform hover:scale-105 transition-transform ${filter === 'chat' ? 'bg-accent text-white' : 'bg-accent/20 text-main hover:bg-accent/40'}`}
                >
                  AI Detected
                </button>
              </div>
            </div>
            <ul className="max-h-80 overflow-y-auto pr-1 scroll-smooth">
              {recent.map((r: MoodSnapshot, idx: number) => (
                <li key={r.id || r.timestamp} className="p-3 border rounded-xl bg-white/70 hover:bg-white transition-all duration-200" style={{animation: `fadeIn 0.3s ease ${idx * 30}ms both`}}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `hsl(${scoreHue(r.score)}, 80%, 90%)` }}
                    >
                      <span>{moodEmoji(r.label, r.score)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800 truncate">{r.label} <span className="text-gray-400 font-normal">— {r.score}/10</span></p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">{timeAgo(r.timestamp)}</span>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${r.source === 'chat' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {r.source === 'chat' ? 'AI' : 'Manual'}
                          </span>
                        </div>
                      </div>
                      {r.journal && <p className="text-sm text-gray-600 mt-1">{r.journal}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Simple modal for breathing exercise */}
      {showBreath && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md">
            <div className="bg-white/90 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 w-full relative">
              <button
                onClick={() => setShowBreath(false)}
                className="absolute right-2 sm:right-3 top-2 sm:top-3 text-gray-500 hover:text-gray-700 z-10"
                aria-label="Close"
              >
                ✕
              </button>
              <BreathTimer />
            </div>
            {/* Empty state for first-time users */}
            {entryCount === 0 && (
              <div className="mt-4 sm:mt-6 bg-white p-4 sm:p-6 rounded-xl shadow border border-dashed border-gray-200 text-center animate-fade-in w-full">
                <h3 className="text-base sm:text-lg font-semibold mb-1">Add your first check‑in</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Pick how you feel and jot a few words. Your trend starts building from today.</p>
                <a href="#journal" onClick={() => setShowBreath(false)} className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-accent text-white hover:bg-accentDark font-semibold shadow transition-colors duration-200 transform hover:scale-105 transition-transform text-xs sm:text-sm">Start now</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default Mood;
