"use client";

import { motion } from "framer-motion";
import { Gauge, Clock } from "lucide-react";

export default function MetricsGrid() {
  return (
    <div className="flex gap-4 mx-6 mb-4">
      {/* Current Speed Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="flex-1 bg-white rounded-[2rem] p-5 shadow-soft border border-black/[0.03] relative overflow-hidden flex flex-col justify-between aspect-square max-h-[140px]"
      >
        {/* Soft abstract background shape */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 rounded-bl-[100px] -z-0" />
        
        <div className="relative z-10 text-brand-text/80 mb-2">
          <Gauge size={20} strokeWidth={2} />
        </div>
        
        <div className="relative z-10 flex items-baseline gap-1">
          <span className="text-4xl font-light tracking-tighter text-brand-text">72</span>
          <span className="text-[10px] font-bold text-brand-text/60 tracking-wider">KM/H</span>
        </div>
      </motion.div>

      {/* Duty Hours Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="flex-1 bg-white rounded-[2rem] p-5 shadow-soft border border-black/[0.03] relative overflow-hidden flex flex-col justify-between aspect-square max-h-[140px]"
      >
        {/* Soft abstract background shape */}
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-brand-orange/5 rounded-tr-[80px] -z-0" />
        
        <div className="relative z-10 text-brand-text/80 mb-2">
          <Clock size={20} strokeWidth={2} />
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-baseline text-brand-text gap-0.5">
            <span className="text-4xl font-light tracking-tighter text-brand-text/40">05</span>
            <span className="text-2xl font-light tracking-tighter mb-1">:</span>
            <span className="text-4xl font-light tracking-tighter">12</span>
          </div>
          <div className="text-[10px] font-bold text-brand-text/60 tracking-wider leading-tight text-right w-8">
            Duty<br/>Hrs
          </div>
        </div>
      </motion.div>
    </div>
  );
}
