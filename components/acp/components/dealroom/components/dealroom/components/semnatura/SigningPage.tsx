'use client';

import { useState } from 'react';

export default function SigningPage() {
  const [signed, setSigned] = useState(false);
  const [name, setName] = useState('');

  const handleSign = () => {
    if (name) {
      setSigned(true);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Semnează Contractul</h1>
      {signed ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-medium">✓ Contract semnat cu succes!</p>
          <p className="text-green-600 text-sm mt-1">Semnat de: {name}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nume complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Ion Popescu"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-sm text-gray-500">
            Prin semnarea acestui document confirmi că ai citit și ești de acord cu termenii contractului.
          </p>
          <button
            onClick={handleSign}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Semnează
          </button>
        </div>
      )}
    </div>
  );
}
