'use client';

import { useState } from 'react';

export default function BuyerDealRoomView() {
  const [offer, setOffer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (offer) {
      setSubmitted(true);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Trimite Ofertă</h1>
      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700 font-medium">Oferta ta a fost trimisă cu succes!</p>
          <p className="text-green-600 text-sm mt-1">Agentul te va contacta în curând.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Oferta ta (EUR)
            </label>
            <input
              type="number"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="ex: 120000"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Trimite Oferta
          </button>
        </div>
      )}
    </div>
  );
}
