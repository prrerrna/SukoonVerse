// TrendChart.tsx: A component for displaying a 7-day mood trend chart.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

// Define the type for the data points for type safety.
type ChartData = {
  day: string;
  score: number | null;
  manualScore?: number | null;
  chatScore?: number | null;
};

// Helper function to convert score to mood label
const getMoodLabel = (score: number): string => {
  if (score <= 1) return 'Very Sad';
  else if (score <= 2) return 'Sad';
  else if (score <= 3) return 'Anxious';
  else if (score <= 4) return 'Frustrated';
  else if (score <= 5) return 'Neutral';
  else if (score <= 6) return 'Calm';
  else if (score <= 7) return 'Content';
  else if (score <= 8) return 'Happy';
  else if (score <= 9) return 'Joyful';
  else return 'Elated';
};

// Type definition for tooltip payload
interface TooltipPayload {
  dataKey: string;
  value: number | null;
  name: string;
  color: string;
}

// Custom tooltip to show more descriptive mood labels
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
  if (active && payload && payload.length) {
    const hasManual = payload.some((p: TooltipPayload) => p.dataKey === 'manualScore' && p.value !== undefined && p.value !== null);
    const hasChat = payload.some((p: TooltipPayload) => p.dataKey === 'chatScore' && p.value !== undefined && p.value !== null);
    const avgScore = payload.find((p: TooltipPayload) => p.dataKey === 'score')?.value || 0;
    
    return (
      <div className="bg-white p-3 border rounded shadow-sm">
        <p className="font-bold border-b pb-1 mb-1">{label}</p>
        
        <p className="font-medium">Average: {typeof avgScore === 'number' ? avgScore.toFixed(1) : '0'}/10</p>
        <p className="text-sm mb-2">Mood: {getMoodLabel(Number(avgScore))}</p>
        
        {hasManual && (
          <div className="flex items-center mb-1">
            <span className="w-3 h-3 bg-green-500 inline-block mr-2 rounded-full"></span>
            <span>Manual: {payload.find((p: TooltipPayload) => p.dataKey === 'manualScore')?.value || 'N/A'}</span>
          </div>
        )}
        
        {hasChat && (
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 inline-block mr-2 rounded-full"></span>
            <span>AI Detected: {payload.find((p: TooltipPayload) => p.dataKey === 'chatScore')?.value || 'N/A'}</span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

// This component renders a line chart using the Recharts library.
// It is a presentational component that receives data as a prop.
const TrendChart = ({ data }: { data: ChartData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" />
        <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 9]} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceArea y1={1} y2={4} fill="#f3f4f6" opacity={0.6} />
          <ReferenceLine
            y={5}
            stroke="#666"
            strokeDasharray="3 3"
            label={{
              value: 'Neutral',
              position: 'top',
              offset: 10,
              style: {
                fill: 'var(--accent, #6ea43a)', // theme accent color
                fontWeight: 600,
                fontSize: 14,
                background: 'white',
                padding: '2px 6px',
                borderRadius: '6px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }
            }}
          />
        <ReferenceArea y1={8} y2={10} fill="#ecfdf5" opacity={0.7} />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="var(--accent, #6ea43a)" // Use theme accent color, fallback to #6ea43a
          strokeWidth={2}
          activeDot={{ r: 8 }} 
          dot={{ r: 4 }}
          name="Average Mood" 
          connectNulls
        />
        <Line 
          type="monotone" 
          dataKey="manualScore" 
          stroke="var(--accentDark, #263a1e)" // theme dark accent for manual
          strokeWidth={1.5}
          connectNulls
          activeDot={{ r: 6 }} 
          dot={{ r: 3 }}
          name="Manual Entries" 
        />
        <Line 
          type="monotone" 
          dataKey="chatScore" 
          stroke="var(--accentLight, #a3c167)" // theme light accent for AI
          strokeWidth={1.5}
          connectNulls
          activeDot={{ r: 6 }} 
          dot={{ r: 3 }}
          name="AI Detected" 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
