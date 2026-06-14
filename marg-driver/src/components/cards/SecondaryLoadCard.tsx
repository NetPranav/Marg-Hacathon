"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function SecondaryLoadCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-3xl p-5 shadow-soft border border-black/[0.03]"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-brand-text tracking-tight mb-2">Palletized Electronics</h3>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-[#FDEFE8] text-[#C15B2B] text-[9px] font-bold tracking-widest uppercase rounded">
              8.2 MT
            </span>
            <span className="px-2 py-1 bg-[#FDEFE8] text-[#C15B2B]/70 text-[9px] font-bold tracking-widest uppercase rounded">
              Box Cargo
            </span>
          </div>
        </div>
        <span className="text-2xl font-light tracking-tighter text-brand-text/80">$850</span>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />
          <span className="text-sm font-medium text-brand-text/80">Tech Hub Logistics, IL</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-2.5 h-2.5 text-[#C15B2B]" strokeWidth={3} />
          <span className="text-sm font-medium text-brand-text/80">Central Warehouse, MI</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <span className="text-xs font-medium text-brand-text/60">4 mi off-route</span>
        <button className="text-xs font-bold text-[#C15B2B] hover:text-[#9C3600] transition-colors">
          View Details
        </button>
      </div>
    </motion.div>
  );
}
