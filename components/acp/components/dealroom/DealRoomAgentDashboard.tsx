'use client';

import { useState } from 'react';

export default function DealRoomAgentDashboard() {
  const [deals, setDeals] = useState([
    { id: 1, property: 'Apartament 3 camere Floreasca', status: 'Activ', offers: 2 },
    { id: 2, property: 'Vila Pipera', status: 'Pending', offers: 1 },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deal Room - Agent Dashboard</h1>
      <div className="space-y-4">
        {deals.map((deal) => (
          <div key={deal.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">{deal.property}</h2>
                <p className="text-sm text-gray-500">{deal.offers} oferte primite</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                deal.status === 'Activ' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {deal.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
