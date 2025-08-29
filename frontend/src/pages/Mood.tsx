// Mood.tsx: A page for displaying mood history and trends.
import { useEffect, useState } from 'react';
import TrendChart from '../components/TrendChart';
import MoodPicker from '../components/MoodPicker';
import JournalEntry from '../components/JournalEntry';
import { getLast7Days, addSnapshot, clearAll, isPersistenceEnabled, enablePersistence, disablePersistence } from '../utils/indexeddb';
import { getMoodHistory } from '../lib/api';

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
  const [data, setData] = useState<DayPoint[]>([]);
  const [recent, setRecent] = useState<MoodSnapshot[]>([]);
  const [selected, setSelected] = useState<{ label: string; score: number }>({ label: 'neutral', score: 5 });
  const [isPersistent, setIsPersistent] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'manual' | 'chat'>('all');
  const [useServerData, setUseServerData] = useState<boolean>(false);
  const [loadingServer, setLoadingServer] = useState<boolean>(false);

  const load = async () => {
    let entries = [];
    
    // Get mood data
    if (useServerData) {
      // Try to get data from server
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
      const avg = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;
      const manualAvg = manualArr.length ? Math.round((manualArr.reduce((a, b) => a + b, 0) / manualArr.length) * 10) / 10 : null;
      const chatAvg = chatArr.length ? Math.round((chatArr.reduce((a, b) => a + b, 0) / chatArr.length) * 10) / 10 : null;
      
      return { 
        day: weekdayShort(new Date(iso)), 
        score: avg || 0,  // For main trend line, use 0 instead of null for empty days
        manualScore: manualAvg,  // For manual entries, use null if no entries
        chatScore: chatAvg,      // For chat entries, use null if no entries
      };
    });

    setData(chart);

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

  // Check persistence status on component mount
  useEffect(() => {
    load();
    setIsPersistent(isPersistenceEnabled());
  }, []);
  
  // Reload data when filter changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  
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
    await addSnapshot({ 
      label: selected.label, 
      score: selected.score,
      journal: journal.trim() ? journal : undefined,
      source: 'manual'
    });
    await load();
  };

  const handleClear = async () => {
    await clearAll();
    await load();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-3 text-center">Mood Check-in & 7-Day Trend</h1>
      <p className="text-gray-600 mb-6 text-center">Track your mood and write journal entries to monitor your emotional wellbeing over time</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">How are you feeling?</h2>
          <MoodPicker value={selected} onChange={setSelected} />
          <JournalEntry onSave={handleSave} />
          <div className="mt-4 flex flex-col space-y-2">
            <div className="flex items-center mb-2">
              <input
                id="persistence-toggle"
                type="checkbox"
                checked={isPersistent}
                onChange={togglePersistence}
                className="mr-2 h-4 w-4"
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
                  // Reload data when toggling this option
                  setTimeout(load, 10);
                }}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="server-data-toggle" className="text-sm">
                Include server-stored mood data {loadingServer && "(Loading...)"}
              </label>
            </div>
            <button className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600" onClick={handleClear}>
              Clear all entries
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Your 7-Day Mood Trend</h2>
          <TrendChart data={data.map(d => ({ day: d.day, score: d.score ?? 0, manualScore: (d as any).manualScore ?? undefined, chatScore: (d as any).chatScore ?? undefined }))} />
          <div className="text-sm text-gray-600 mt-3">
            <p>The chart shows your average mood score for each day (scale of 1-10).</p>
            <p>Higher scores (8-10) represent more positive moods, while lower scores (1-3) represent more challenging emotions.</p>
            <p>Days without entries appear as 0 on the chart.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Recent entries</h3>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1 text-sm rounded ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('manual')} 
              className={`px-3 py-1 text-sm rounded ${filter === 'manual' ? 'bg-green-600 text-white' : 'bg-green-100'}`}
            >
              Manual
            </button>
            <button 
              onClick={() => setFilter('chat')} 
              className={`px-3 py-1 text-sm rounded ${filter === 'chat' ? 'bg-blue-600 text-white' : 'bg-blue-100'}`}
            >
              AI Detected
            </button>
          </div>
        </div>
        <ul>
          {recent.map((r: MoodSnapshot) => (
            <li key={r.id || r.timestamp} className="py-2 border-b last:border-b-0">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">{new Date(r.timestamp).toLocaleString()}</div>
                <span className={`text-xs px-2 py-1 rounded ${r.source === 'chat' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {r.source === 'chat' ? 'AI Detected' : 'Manual Entry'}
                </span>
              </div>
              <div className="font-medium">{r.label} — {r.score}</div>
              {r.journal && <div className="mt-1 text-gray-700">{r.journal}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Mood;
