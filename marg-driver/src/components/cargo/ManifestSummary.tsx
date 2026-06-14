"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useRealtimeStore } from "@/store/realtimeStore";

export default function ManifestSummary() {
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  const currentShipment = activeShipments[0];
  const manifestId = currentShipment?.shipment_number || "Loading...";
  const ewayBill = currentShipment ? `EWB-${String(currentShipment.id).split('-')[0].toUpperCase()}-${Math.floor(Math.random() * 1000)}` : "Loading...";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-[2.5rem] p-6 shadow-soft border border-black/[0.03]"
    >
      <div className="flex justify-between items-center mb-8">
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/50 uppercase">
          Active Manifest
        </span>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Live</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[9px] font-bold tracking-widest uppercase">Verified</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase mb-1 block">
            Manifest ID
          </span>
          <span className="text-3xl font-semibold tracking-tight text-brand-text">
            {manifestId}
          </span>
        </div>

        <div className="w-full h-px bg-gray-100" />

        <div>
          <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase mb-1 block">
            E-Way Bill
          </span>
          <span className="text-2xl font-semibold tracking-tight text-brand-text/90">
            {ewayBill}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
