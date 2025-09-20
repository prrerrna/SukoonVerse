// TrendChart.tsx: A component for displaying a 7-day mood trend chart.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ReferenceArea, AreaChart, Area,
  PieChart, Pie, Cell, BarChart, Bar, LabelList
} from 'recharts';

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

// Get emoji based on score
const getMoodEmoji = (score: number): string => {
  if (score <= 1) return '😞';
  else if (score <= 2) return '😔';
  else if (score <= 3) return '😟';
  else if (score <= 4) return '😠';
  else if (score <= 5) return '😐';
  else if (score <= 6) return '😌';
  else if (score <= 7) return '🙂';
  else if (score <= 8) return '😊';
  else if (score <= 9) return '😄';
  else return '🤩';
};

// Get color based on score
const getMoodColor = (score: number): string => {
  if (score <= 2) return '#ef4444'; // Red
  else if (score <= 4) return '#f59e0b'; // Amber
  else if (score <= 6) return '#a3c167'; // Green (matching the app accent)
  else if (score <= 8) return '#22c55e'; // Green
  else return '#3b82f6'; // Blue
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
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-bold border-b pb-2 mb-2 flex items-center justify-between">
          {label}
          <span className="text-xl ml-2">{getMoodEmoji(Number(avgScore))}</span>
        </p>
        
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: getMoodColor(Number(avgScore)) }}
          ></div>
          <div>
            <p className="font-medium">Average: {typeof avgScore === 'number' ? avgScore.toFixed(1) : '0'}/10</p>
            <p className="text-sm">Mood: {getMoodLabel(Number(avgScore))}</p>
          </div>
        </div>
        
        <div className="space-y-2 mt-3 pt-2 border-t">
          {hasManual && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-600 inline-block mr-2 rounded-full"></span>
              <span>Manual: {payload.find((p: TooltipPayload) => p.dataKey === 'manualScore')?.value?.toFixed(1) || 'N/A'}</span>
            </div>
          )}
          
          {hasChat && (
            <div className="flex items-center">
              <span className="w-3 h-3 bg-blue-500 inline-block mr-2 rounded-full"></span>
              <span>AI Detected: {payload.find((p: TooltipPayload) => p.dataKey === 'chatScore')?.value?.toFixed(1) || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

// Process data for distribution chart
const processDistributionData = (data: ChartData[]) => {
  // Count occurrences of each score
  const distribution: { [key: number]: number } = {};
  let totalEntries = 0;
  
  data.forEach(day => {
    // Process all scores
    if (day.score !== null) {
      const roundedScore = Math.round(day.score);
      distribution[roundedScore] = (distribution[roundedScore] || 0) + 1;
      totalEntries++;
    }
    
    // We could also process manual and chat scores separately if needed
  });
  
  // Convert to array format for charts
  return Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    return {
      score: score,
      count: distribution[score] || 0,
      percentage: totalEntries ? Math.round((distribution[score] || 0) / totalEntries * 100) : 0,
      label: getMoodLabel(score),
      emoji: getMoodEmoji(score)
    };
  });
};

// Chart types
type ChartType = 'line' | 'area' | 'distribution';

// This component renders a line chart using the Recharts library.
// It is a presentational component that receives data as a prop.
const TrendChart = ({ data }: { data: ChartData[] }) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  
  // Process data for distribution chart
  const distributionData = processDistributionData(data);
  
  // Define chart animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  const buttonVariants = {
    active: { 
      backgroundColor: 'var(--accent, #6ea43a)', 
      color: 'white',
      scale: 1.05
    },
    inactive: { 
      backgroundColor: 'rgba(110, 164, 58, 0.1)',
      color: '#333',
      scale: 1
    }
  };

  // Render different chart types
  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="99%" height={300}>
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent, #6ea43a)" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="var(--accent, #6ea43a)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accentDark, #263a1e)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="var(--accentDark, #263a1e)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorChat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accentLight, #a3c167)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="var(--accentLight, #a3c167)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
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
                      fill: 'var(--accent, #6ea43a)',
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
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent, #6ea43a)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Average Mood"
                  activeDot={{ r: 8 }}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="manualScore"
                  stroke="var(--accentDark, #263a1e)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorManual)"
                  name="Manual Entries"
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="chatScore"
                  stroke="var(--accentLight, #a3c167)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorChat)"
                  name="AI Detected"
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'distribution':
        return (
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <ResponsiveContainer width="99%" height={300}>
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="score" 
                    tickFormatter={(value) => `${value}`}
                    label={{ 
                      value: 'Mood Score', 
                      position: 'insideBottom', 
                      offset: -20, 
                      style: { fontWeight: 500 } 
                    }}
                  />
                  <YAxis 
                    allowDecimals={false}
                    label={{ 
                      value: 'Number of Entries', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontWeight: 500 }
                    }}
                  />
                  <Tooltip 
                    formatter={(value, _name, props) => {
                      const { payload } = props;
                      return [
                        `${value} entries`,
                        `${payload.label} (${payload.score}/10) ${payload.emoji}`
                      ];
                    }}
                  />
                  <Bar dataKey="count" name="Entries">
                    {distributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getMoodColor(entry.score)} 
                      />
                    ))}
                    <LabelList 
                      dataKey="emoji" 
                      position="top" 
                      style={{ fontSize: '16px' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Pie Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent, score }) => 
                      `${getMoodEmoji(Number(score))} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="label"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMoodColor(entry.score)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, _name, props) => {
                      const { payload } = props;
                      return [
                        `${value} entries (${payload.percentage}%)`,
                        `${payload.label} (${payload.score}/10)`
                      ];
                    }}
                  />
                  <Legend formatter={(_value, entry) => {
                    if (entry && entry.payload) {
                      // Cast to any to bypass TypeScript error
                      const payload = entry.payload as any;
                      if (payload && payload.label && payload.score) {
                        return `${payload.label} (${payload.score}/10)`;
                      }
                    }
                    return '';
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
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
                    fill: 'var(--accent, #6ea43a)',
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
                stroke="var(--accent, #6ea43a)"
                strokeWidth={2}
                activeDot={{ r: 8 }} 
                dot={{ r: 4 }}
                name="Average Mood" 
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="manualScore" 
                stroke="var(--accentDark, #263a1e)"
                strokeWidth={1.5}
                connectNulls
                activeDot={{ r: 6 }} 
                dot={{ r: 3 }}
                name="Manual Entries" 
              />
              <Line 
                type="monotone" 
                dataKey="chatScore" 
                stroke="var(--accentLight, #a3c167)"
                strokeWidth={1.5}
                connectNulls
                activeDot={{ r: 6 }} 
                dot={{ r: 3 }}
                name="AI Detected" 
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Chart Type Selector */}
      <div className="flex justify-end mb-4">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <motion.button
            className="px-3 py-1 rounded-lg text-sm font-medium"
            animate={chartType === 'line' ? 'active' : 'inactive'}
            variants={buttonVariants}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChartType('line')}
          >
            Line
          </motion.button>
          <motion.button
            className="px-3 py-1 rounded-lg text-sm font-medium"
            animate={chartType === 'area' ? 'active' : 'inactive'}
            variants={buttonVariants}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChartType('area')}
          >
            Area
          </motion.button>
          <motion.button
            className="px-3 py-1 rounded-lg text-sm font-medium"
            animate={chartType === 'distribution' ? 'active' : 'inactive'}
            variants={buttonVariants}
            whileTap={{ scale: 0.95 }}
            onClick={() => setChartType('distribution')}
          >
            Distribution
          </motion.button>
        </div>
      </div>
      
      {/* Render the appropriate chart */}
      <motion.div
        key={chartType}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {renderChart()}
      </motion.div>
    </motion.div>
  );
};

export default TrendChart;
