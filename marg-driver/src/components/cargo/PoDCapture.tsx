"use client";

import { motion } from "framer-motion";
import { Lock, UploadCloud, PenTool, CheckCircle } from "lucide-react";
import { useRealtimeStore } from "@/store/realtimeStore";
import api from "@/lib/api";
import { useState } from "react";

export default function PoDCapture() {
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  const updateShipment = useRealtimeStore((state) => state.updateShipment);
  const currentShipment = activeShipments[0];
  const [submitting, setSubmitting] = useState(false);

  const canCapture = currentShipment?.status === "ARRIVED_AT_GATE" || currentShipment?.status === "UNLOADING";
  const isCompleted = currentShipment?.status === "COMPLETED";

  const handleComplete = async () => {
    if (!currentShipment) return;
    setSubmitting(true);
    try {
      // We simulate uploading the PoD, but we don't complete the shipment.
      // The Warehouse Admin is responsible for the Receiving Checklist which completes it.
      await new Promise(r => setTimeout(r, 1000));
      alert("PoD Submitted Successfully! Waiting for Warehouse to complete Receiving.");
    } catch (err: any) {
      alert("Failed to complete shipment: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      className="mx-6 mb-28 bg-white rounded-3xl p-6 shadow-soft border border-black/[0.03]"
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/50 uppercase">
          Proof of Delivery
        </span>
        {isCompleted ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 rounded-md">
            <CheckCircle className="w-3 h-3" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Completed</span>
          </div>
        ) : canCapture ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md">
            <PenTool className="w-3 h-3" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Unlocked</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FDEFE8] text-[#C15B2B] rounded-md">
            <Lock className="w-3 h-3" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Geofence Locked</span>
          </div>
        )}
      </div>

      {!canCapture && !isCompleted && (
        <p className="text-sm font-medium text-brand-text/60 leading-relaxed mb-6">
          PoD capture unlocks automatically once vehicle enters assigned unloading dock geofence (Arrived at Gate).
        </p>
      )}

      {/* Upload Button */}
      <button 
        disabled={!canCapture || submitting || isCompleted} 
        onClick={handleComplete}
        className={`w-full flex items-center justify-center gap-2 py-4 mb-4 rounded-2xl font-semibold transition-all ${
          canCapture && !isCompleted 
            ? 'bg-brand-primary text-white shadow-glow hover:bg-brand-primary/90' 
            : 'bg-[#FDF5F1]/50 text-brand-text/30 border border-[#FDF5F1] opacity-60 cursor-not-allowed'
        }`}
      >
        <UploadCloud className="w-5 h-5" />
        {submitting ? "Submitting..." : isCompleted ? "Completed" : "Submit PoD & Complete"}
      </button>

      {/* Signature Canvas Placeholder */}
      <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 flex flex-col items-center justify-center opacity-60">
        <PenTool className="w-6 h-6 text-brand-text/20 mb-2" strokeWidth={1.5} />
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/30 uppercase">
          Receiver Signature
        </span>
      </div>
    </motion.div>
  );
}
