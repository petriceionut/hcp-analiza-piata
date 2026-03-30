'use client';

interface DealRoomAgentDashboardProps {
  dealroom?: any;
  documente?: any[];
  cumparatori?: any[];
  oferte?: any[];
  [key: string]: any;
}

export default function DealRoomAgentDashboard(props: DealRoomAgentDashboardProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deal Room - Agent Dashboard</h1>
      <p className="text-gray-500">Dashboard încărcat cu succes.</p>
    </div>
  );
}
