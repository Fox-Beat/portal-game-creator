
import React from 'react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="apiKey" className="block text-sm font-medium text-slate-300 mb-2">
        Google Gemini API Key
      </label>
      <input
        id="apiKey"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your API key"
        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-100 placeholder-slate-400 transition-colors"
        aria-label="Gemini API Key Input"
        autoComplete="off"
      />
       <p className="text-xs text-slate-500 mt-2">
        Required for the 'Enrich with AI' feature. Get a key from{' '}
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sky-400 hover:underline"
        >
          Google AI Studio
        </a>.
      </p>
    </div>
  );
};
