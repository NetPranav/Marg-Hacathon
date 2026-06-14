"use client";

import { motion } from "framer-motion";
import { CornerUpRight, ArrowRight } from "lucide-react";

export default function DockAllocation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="mx-6 mb-4 bg-[#B84000] rounded-[1.5rem] p-6 shadow-glow relative overflow-hidden"
    >
      {/* Background soft glow / abstract shapes */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full" />
      <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full blur-xl translate-y-1/2" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col flex-1 pr-4">
          <div className="flex items-center gap-2 text-white/70 mb-3">
            <CornerUpRight size={14} />
            <span className="text-[9px] font-bold tracking-widest uppercase">
              Directional Instruction
            </span>
          </div>
          
          <h2 className="text-[26px] leading-[1.1] font-bold text-white mb-3 tracking-tight">
            PROCEED TO DOCK<br/>BAY #14
          </h2>
          
          <p className="text-white/80 text-sm font-medium leading-relaxed max-w-[200px]">
            Take the second left after the weighbridge
          </p>
        </div>

        <button className="w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-sm border border-white/10">
          <ArrowRight size={24} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}
