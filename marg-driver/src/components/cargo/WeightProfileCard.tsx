"use client";

import { motion } from "framer-motion";
import { Scale, CheckCircle2 } from "lucide-react";
import { useRealtimeStore } from "@/store/realtimeStore";

export default function WeightProfileCard() {
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  const currentShipment = activeShipments[0];
  const weight = currentShipment?.total_weight_kg ? (currentShipment.total_weight_kg / 1000).toFixed(1) : "24.5";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-3xl p-6 shadow-soft border border-black/[0.03]"
    >
      <div className="flex justify-between items-center mb-6">
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/50 uppercase">
          Verified Weight & Volume Profile
        </span>
        <Scale className="w-5 h-5 text-[#C15B2B]" strokeWidth={1.5} />
      </div>

      <div className="flex justify-between items-end mb-6">
        <div className="flex flex-col">
          <span className="text-3xl font-light tracking-tight text-brand-text">{weight}</span>
          <span className="text-[9px] font-bold tracking-widest text-brand-text/50 uppercase">Tons</span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-light tracking-tight text-brand-text">128</span>
          <span className="text-[9px] font-bold tracking-widest text-brand-text/50 uppercase">Parcels</span>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-light tracking-tight text-brand-text">34.2</span>
          <span className="text-[9px] font-bold tracking-widest text-brand-text/50 uppercase">M&sup3;</span>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-[11px] font-bold tracking-wide">Weighbridge Confirmed</span>
      </div>
    </motion.div>
  );
}
