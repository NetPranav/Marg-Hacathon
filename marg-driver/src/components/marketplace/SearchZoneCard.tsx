"use client";

import { motion } from "framer-motion";
import { Target, SlidersHorizontal } from "lucide-react";

export default function SearchZoneCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mx-6 mb-6 bg-white rounded-3xl p-4 shadow-soft border border-black/[0.03] flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        {/* Left Icon with Pulse */}
        <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100">
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-cyan relative">
            <div className="absolute inset-0 bg-brand-cyan rounded-full animate-ping opacity-75" />
          </div>
          <Target className="w-5 h-5 text-gray-400 absolute" />
        </div>

        {/* Center Text */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">
            Searching within 50km
          </span>
          <span className="text-base font-semibold text-brand-text tracking-tight">
            Destination Hub Area
          </span>
        </div>
      </div>

      {/* Right Filter Button */}
      <button className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-50/50 hover:bg-orange-50 transition-colors text-[#C15B2B]">
        <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
      </button>
    </motion.div>
  );
}
