'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DriverChat from '@/components/DriverChat';
import api from '@/lib/api';

export default function DriverCoordinationPage() {
  const { id } = useParams();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchShipment = async () => {
    try {
      const res = await api.get(`/shipments/${id}/`);
      setShipment(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchShipment();
  }, [id]);

  const handleAction = async (endpoint: string, payload = {}) => {
    try {
      await api.post(`/coordination/${id}/${endpoint}/`, payload);
      fetchShipment();
    } catch (err) {
      console.error(err);
      alert('Action failed');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!shipment) return <div className="p-4 text-center">Shipment not found</div>;

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Coordination: {id}</h1>
        <div className="inline-block px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold mb-4">
          {shipment.status?.replace(/_/g, ' ')}
        </div>
        
        <h2 className="font-semibold text-gray-800 mb-2">Arrival & Actions</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button 
            onClick={() => handleAction('arrive')}
            disabled={!['DISPATCHED', 'IN_TRANSIT'].includes(shipment.status)}
            className="p-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            Reached Warehouse
          </button>
          <button 
            onClick={() => handleAction('check-in')} // Driver side check-in request (could just notify via chat)
            disabled={shipment.status !== 'ARRIVED_AT_GATE'}
            className="p-3 bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            Request Check-In
          </button>
        </div>

        <h2 className="font-semibold text-gray-800 mb-2 mt-6">Report Issue</h2>
        <div className="flex gap-2 mb-2">
          <select id="exceptionType" className="border border-gray-300 rounded-lg p-2 text-sm bg-white">
            <option value="DAMAGED_GOODS">Damaged Goods</option>
            <option value="MISSING_PARCEL">Missing Parcel</option>
            <option value="BROKEN_SEAL">Broken Seal</option>
          </select>
          <button 
            onClick={() => {
              const el = document.getElementById('exceptionType') as HTMLSelectElement;
              handleAction('exceptions', { exception_type: el.value, description: 'Reported by driver' });
            }}
            className="p-2 bg-red-100 text-red-700 font-bold rounded-lg"
          >
            Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '500px' }}>
        <DriverChat shipmentId={id as string} />
      </div>
    </div>
  );
}
