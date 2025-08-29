import { useState } from 'react';

export default function JournalEntry({ onSave }: { onSave: (journal: string) => Promise<void> | void }) {
  const [text, setText] = useState('');

  return (
    <div className="mt-3">
      <label htmlFor="journal-entry" className="block text-sm font-medium text-gray-700 mb-1">
        Journal Entry (optional)
      </label>
      <textarea 
        id="journal-entry"
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="How are you feeling today? What's on your mind?" 
        className="w-full border rounded p-3 min-h-[100px]" 
      />
      <div className="mt-3 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {text.length > 0 ? `${text.length} characters` : 'Express yourself freely'}
        </div>
        <button
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          onClick={async () => {
            await onSave(text);
            setText('');
          }}
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}
