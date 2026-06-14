"use client";

import { motion } from "framer-motion";
import { Map, CornerUpRight, Clock, ArrowRight } from "lucide-react";

interface PrimaryLoadCardProps {
  onCustomBid: () => void;
  onAccept: () => void;
}

export default function PrimaryLoadCard({ onCustomBid, onAccept }: PrimaryLoadCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-[2.5rem] p-6 shadow-glow border border-[#C15B2B]/40 relative overflow-hidden flex flex-col"
    >
      {/* Soft abstract background gradient for the glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 rounded-bl-[150px] -z-0" />

      {/* Top Row: Cargo Title & Payout */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-brand-text mb-3 tracking-tight">Industrial Steel Coils</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-[#FDEFE8] text-[#C15B2B] text-[10px] font-bold tracking-widest uppercase rounded-lg">
              24.5 MT
            </span>
            <span className="px-3 py-1 bg-[#FDEFE8] text-[#C15B2B]/70 text-[10px] font-bold tracking-widest uppercase rounded-lg">
              Flatbed Req.
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[34px] leading-none font-light tracking-tighter text-brand-text mb-1">$1,240</span>
          <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">Est. Payout</span>
        </div>
      </div>

      {/* Route Section */}
      <div className="relative z-10 flex flex-col gap-4 mb-6">
        {/* Origin */}
        <div className="flex items-center gap-4">
          <div className="relative flex flex-col items-center">
            <div className="w-5 h-5 rounded-full border-[3px] border-[#E8E1DE] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-brand-text/30 rounded-full" />
            </div>
            {/* Connecting line */}
            <div className="absolute top-5 bottom-[-20px] w-[1px] bg-gray-200" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">Origin</span>
            <span className="text-sm font-semibold text-brand-text">Apex Manufacturing, Chicago</span>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-4 mt-2">
          <div className="w-5 h-5 rounded-full border-[3px] border-[#C15B2B] flex items-center justify-center bg-white z-10">
            <div className="w-1.5 h-1.5 bg-[#C15B2B] rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">Destination</span>
            <span className="text-sm font-semibold text-brand-text">River Port Terminal, Detroit</span>
          </div>
        </div>
      </div>

      {/* Thin divider */}
      <div className="relative z-10 w-full border-t border-dashed border-gray-200 mb-6" />

      {/* Trip Metrics Row */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-brand-text/50" strokeWidth={1.5} />
          <span className="text-xs font-medium text-brand-text/80 leading-tight w-14">285 mi<br/>total</span>
        </div>
        
        <div className="flex items-center gap-2 text-[#C15B2B]">
          <CornerUpRight className="w-4 h-4" strokeWidth={2} />
          <span className="text-xs font-bold leading-tight w-16">12 mi off-<br/>route</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-text/50" strokeWidth={1.5} />
          <span className="text-xs font-medium text-brand-text/80 leading-tight w-14">Pickup<br/>14:00</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex gap-3">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCustomBid}
          className="flex-[0.4] bg-white border border-gray-200 rounded-2xl py-4 px-2 text-sm font-semibold text-brand-text shadow-sm hover:bg-gray-50 transition-colors"
        >
          Custom Bid
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAccept}
          className="flex-[0.6] bg-[#9C3600] text-white rounded-2xl py-4 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(156,54,0,0.3)]"
        >
          Instant Accept <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  );
}
