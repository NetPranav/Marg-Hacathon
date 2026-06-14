"use client";

import { motion } from "framer-motion";
import Logo from "@/components/brand/Logo";

export default function EarningsHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between px-6 py-5 sticky top-0 z-40 bg-brand-bg/90 backdrop-blur-md"
    >
      <div className="flex-1">
        <Logo className="text-[#C15B2B]" />
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-black/5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 relative">
          <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
        </div>
        <span className="text-[10px] font-semibold text-brand-text/70 uppercase tracking-widest">
          Finance Synced
        </span>
      </div>

      <div className="flex-1 flex justify-end">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-soft border-2 border-white">
          <div className="w-full h-full bg-brand-text flex items-center justify-center text-white text-sm font-semibold">
            AV
          </div>
        </div>
      </div>
    </motion.header>
  );
}
