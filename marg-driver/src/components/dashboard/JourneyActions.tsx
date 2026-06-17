"use client";

import { motion } from "framer-motion";
import { useRealtimeStore } from "@/store/realtimeStore";
import api from "@/lib/api";
import { useState } from "react";
import { Play, CheckCircle2 } from "lucide-react";

export default function JourneyActions() {
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  const updateShipment = useRealtimeStore((state) => state.updateShipment);
  
  const currentShipment = activeShipments[0];

  const [showCargoModal, setShowCargoModal] = useState(false);
  const [cargoChecked, setCargoChecked] = useState({ seal: false, parcels: false, vehicle: false });

  // We'll disable it if the status isn't exactly READY_FOR_TRANSIT so the driver can see the UI but not click it prematurely.
  const isReadyForTransit = currentShipment?.status === "READY_FOR_TRANSIT";
  
  const isInTransit = currentShipment?.status === "IN_TRANSIT" || currentShipment?.status === "APPROACHING_DESTINATION";

  const handleAcceptAndStart = async () => {
    try {
      await api.post(`/shipments/${currentShipment.id}/accept-cargo/`);
      await api.post(`/shipments/${currentShipment.id}/start-transit/`);
      updateShipment({ ...currentShipment, status: "IN_TRANSIT" });
      setShowCargoModal(false);
    } catch (e) {
      console.error(e);
      alert("Failed to start journey");
    }
  };

  const handleArrived = async () => {
    try {
      await api.post(`/shipments/${currentShipment.id}/mark-arrived/`);
      updateShipment({ ...currentShipment, status: "ARRIVED_AT_GATE" });
    } catch (e) {
      console.error(e);
      alert("Failed to mark arrival");
    }
  };

  if (isInTransit) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mb-4"
      >
        <button
          onClick={handleArrived}
          className="w-full bg-[#22C55E] text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-glow hover:bg-[#16A34A] transition-colors"
        >
          <CheckCircle2 size={22} strokeWidth={2.5} />
          <span className="text-[17px] font-semibold tracking-wide">End Journey</span>
        </button>
      </motion.div>
    );
  }

  // Default to showing the Start Journey button (disabled if not ready)
  const allChecked = cargoChecked.seal && cargoChecked.parcels && cargoChecked.vehicle;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 mb-4"
      >
        <button
          onClick={() => isReadyForTransit && setShowCargoModal(true)}
          disabled={!isReadyForTransit}
          className={`w-full text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-glow transition-colors ${
            isReadyForTransit ? 'bg-[#0F172A] hover:bg-[#1E293B]' : 'bg-gray-400 cursor-not-allowed opacity-70'
          }`}
        >
          <Play size={22} strokeWidth={2.5} fill="currentColor" />
          <span className="text-[17px] font-semibold tracking-wide">Start Journey</span>
        </button>
      </motion.div>

      {showCargoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4 text-[#1E293B]">Start Journey Verification</h2>
            <p className="text-sm text-gray-500 mb-6">Verify the following details to confirm departure.</p>
            
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={cargoChecked.seal} onChange={(e) => setCargoChecked(p => ({...p, seal: e.target.checked}))} className="w-5 h-5 accent-brand-primary" />
                <span className="font-medium text-sm text-gray-700">Seal Intact & Matched</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={cargoChecked.parcels} onChange={(e) => setCargoChecked(p => ({...p, parcels: e.target.checked}))} className="w-5 h-5 accent-brand-primary" />
                <span className="font-medium text-sm text-gray-700">Parcel Count Verified</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={cargoChecked.vehicle} onChange={(e) => setCargoChecked(p => ({...p, vehicle: e.target.checked}))} className="w-5 h-5 accent-brand-primary" />
                <span className="font-medium text-sm text-gray-700">Vehicle Assigned matches App</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCargoModal(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-700">Cancel</button>
              <button 
                onClick={handleAcceptAndStart} 
                disabled={!allChecked}
                className={`flex-[2] py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${allChecked ? 'bg-green-600 shadow-lg shadow-green-600/30' : 'bg-gray-300'}`}
              >
                <Play size={18} fill="currentColor" />
                Start Journey
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
