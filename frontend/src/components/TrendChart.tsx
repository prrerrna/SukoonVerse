// TrendChart.tsx: A skeleton component for displaying a mood trend chart.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define the type for the data points for type safety.
type ChartData = {
  day: string;
  score: number;
};

// This component renders a line chart using the Recharts library.
// It is a presentational component that receives data as a prop.
const TrendChart = ({ data }: { data: ChartData[] }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis domain={[0, 10]} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} name="Mood Score (0-10)" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
