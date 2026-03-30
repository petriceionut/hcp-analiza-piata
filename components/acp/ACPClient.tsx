'use client';

import { useState } from 'react';

export default function ACPClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult('Analiza în curs...');
    setTimeout(() => {
      setResult('Analiza completă.');
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analiza Pieței</h1>
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Se analizează...' : 'Pornește Analiza'}
      </button>
      {result && <p className="mt-4 text-gray-700">{result}</p>}
    </div>
  );
}
