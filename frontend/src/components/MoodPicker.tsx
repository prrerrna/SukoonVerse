// React 17+ JSX transform does not require React default import here.

const options = [
  { label: 'very sad', score: 1 },
  { label: 'sad', score: 2 },
  { label: 'anxious', score: 3 },
  { label: 'frustrated', score: 4 },
  { label: 'neutral', score: 5 },
  { label: 'calm', score: 6 },
  { label: 'content', score: 7 },
  { label: 'happy', score: 8 },
  { label: 'joyful', score: 9 },
  { label: 'elated', score: 10 },
];

export default function MoodPicker({ value, onChange }: { value: { label: string; score: number }; onChange: (v: { label: string; score: number }) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onChange({ label: opt.label, score: opt.score })}
          className={`px-3 py-2 rounded border ${
            value.label === opt.label 
              ? 'bg-blue-500 text-white' 
              : 'bg-white hover:bg-gray-100'
          }`}
          title={`Mood score: ${opt.score}/10`}
        >
          {opt.label}
        </button>
      ))}
      <div className="col-span-2 sm:col-span-5 mt-2 text-sm text-gray-600">
        Select a mood that best represents how you feel (1-10 scale)
      </div>
    </div>
  );
}
