import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { getPulseSummary, sendPulseFeedback } from '../lib/api';
import useSession from '../hooks/useSession';
import BreathTimer from '../components/BreathTimer';

type Action = { id: string; title: string; description: string; time_estimate: string; type: string };

const Pulse = () => {
  const { sessionId } = useSession();
  const [region, setRegion] = useState('MyCampus');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showBreath, setShowBreath] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getPulseSummary(region);
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [region]);

  const pulse = Number(data?.pulse_score || 0);
  const hue = useMemo(() => {
    const s = Math.max(0, Math.min(10, pulse));
    return Math.round(((s - 1) / 9) * 120);
  }, [pulse]);

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const handleSidebarToggle = () => setSidebarOpen((open) => !open);

  return (
    <div className="min-h-screen bg-[#D6EAD8] flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={handleSidebarToggle} />
      {/* Main Content */}
      <div className="flex-1">
        <div className="p-6 md:p-10">
          <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-main">Sukoon Pulse</h1>
          <div className="flex items-center gap-2">
            <input value={region} onChange={(e)=>setRegion(e.target.value)} className="border rounded px-3 py-1" aria-label="region" />
            <button
              onClick={load}
              className="px-4 py-2 rounded-2xl shadow-lg transform transition hover:scale-105 flex items-center text-white text-base font-semibold"
              style={{
                background: 'linear-gradient(90deg, #263a1e 0%, #a3c167 100%)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(38,58,30,0.12)',
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Gauge */}
        <div className="bg-white rounded-2xl p-5 shadow mb-6">
          <div className="flex items-center gap-5">
            <svg viewBox="0 0 160 160" className="w-32 h-32">
              <defs>
                <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={`hsl(${hue}, 90%, 60%)`} />
                  <stop offset="100%" stopColor={`hsl(${hue+30}, 90%, 55%)`} />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r={60} stroke="#e5e7eb" strokeWidth={12} fill="none" />
              <circle cx="80" cy="80" r={60} stroke="url(#pg)" strokeWidth={12} fill="none" strokeLinecap="round"
                strokeDasharray={2*Math.PI*60} strokeDashoffset={(2*Math.PI*60)*(1-(pulse/10||0))} transform="rotate(-90 80 80)" />
              <text x="80" y="78" textAnchor="middle" className="fill-gray-900" style={{ fontSize: 24, fontWeight: 700 }}>{pulse.toFixed(1)}</text>
              <text x="80" y="100" textAnchor="middle" className="fill-gray-500" style={{ fontSize: 12 }}>{data?.trend || 'flat'}</text>
            </svg>
            <div>
              <div className="text-gray-600 text-sm">Region</div>
              <div className="text-2xl font-semibold">{data?.region || region}</div>
              <div className="text-sm text-gray-500">Reports: {data?.counts || 0} {data?.cached ? '(cached)' : ''}</div>
            </div>
          </div>
        </div>

        {/* Themes */}
        <div className="bg-white rounded-2xl p-5 shadow mb-6">
          <h2 className="text-xl font-semibold mb-3">Top Themes</h2>
          <div className="flex flex-wrap gap-2">
            {(data?.top_themes || []).map((t:any)=> (
              <span key={t.name} className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-sm">{t.name} · {t.count}</span>
            ))}
            {(!data?.top_themes || data.top_themes.length===0) && <span className="text-[#8CA88A] text-sm">No data yet</span>}
          </div>
        </div>

        {/* AI Summary and Actions */}
        <div className="bg-white rounded-2xl p-5 shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Community Care Feed</h2>
            <p className={`mb-4 ${!data?.ai_summary && !loading ? 'text-[#8CA88A]' : 'text-[#466C36]'}`}>{data?.ai_summary || (loading ? 'Loading…' : 'Care ideas will appear here.')}</p>
          <div className="space-y-3">
            {(data?.ai_actions || []).map((a: Action) => (
              <div key={a.id} className="border rounded-lg p-3 flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-gray-600">{a.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{a.type} · ~{a.time_estimate} min</div>
                </div>
                <div className="flex items-center gap-2">
                  {a.type === 'breathing' && (
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>setShowBreath(true)}>Do now</button>
                  )}
                  <button className="px-3 py-1 bg-gray-100 rounded" onClick={async()=>{
                    if (!sessionId) return;
                    await sendPulseFeedback({ session_id: sessionId, region, suggestion_id: a.id, value: 1 });
                  }}>👍</button>
                  <button className="px-3 py-1 bg-gray-100 rounded" onClick={async()=>{
                    if (!sessionId) return;
                    await sendPulseFeedback({ session_id: sessionId, region, suggestion_id: a.id, value: -1 });
                  }}>👎</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety note */}
        {data?.safety === 'high' && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            Community trend suggests extra care. If you or someone is in danger, please use helplines on the Resources page.
          </div>
        )}
      </div>

          {showBreath && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setShowBreath(false)}>
              <div className="bg-white p-4 rounded-xl shadow" onClick={(e)=>e.stopPropagation()}>
                <BreathTimer />
                <div className="text-right mt-3">
                  <button className="px-3 py-1 bg-teal-600 text-white rounded" onClick={()=>setShowBreath(false)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pulse;
