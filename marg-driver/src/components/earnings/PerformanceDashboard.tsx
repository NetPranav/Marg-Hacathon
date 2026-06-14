"use client";

import { motion } from "framer-motion";
import { TrendingUp, CopyCheck } from "lucide-react";

export default function PerformanceDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      className="mx-6 mb-8 bg-white rounded-[2.5rem] p-6 shadow-soft border border-black/[0.03] relative overflow-hidden"
    >
      {/* Subtle abstract sine wave background */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-32 text-[#C15B2B]/5 opacity-30 pointer-events-none" 
        viewBox="0 0 400 100" 
        preserveAspectRatio="none"
      >
        <path 
          d="M0,50 Q100,0 200,50 T400,50 L400,100 L0,100 Z" 
          fill="currentColor" 
        />
        <path 
          d="M0,70 Q100,20 200,70 T400,70 L400,100 L0,100 Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        />
      </svg>

      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/50 uppercase mb-2 block">
            Monthly Performance
          </span>
          <h2 className="text-[2.75rem] leading-none font-bold text-[#C15B2B] tracking-tighter">
            &#8377;1,84,500
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#FDF5F1] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#C15B2B]" strokeWidth={2} />
        </div>
      </div>

      <div className="relative z-10 flex justify-between items-start mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-brand-text/60 mb-1">
            Completed Trips
          </span>
          <span className="text-xl font-semibold text-brand-text">42</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-brand-text/60 mb-1">
            Backhaul Efficiency
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-brand-text">1,280</span>
            <span className="text-[10px] font-bold text-brand-text/80 uppercase">KM</span>
          </div>
        </div>
        <div className="w-8" /> {/* Spacer to align roughly with the sparkline */}
      </div>

      <div className="relative z-10 flex items-center gap-2 text-emerald-600">
        <CopyCheck className="w-4 h-4" />
        <span className="text-xs font-semibold">
          +&#8377;18,400 earned from optimized returns
        </span>
      </div>
    </motion.div>
  );
}
