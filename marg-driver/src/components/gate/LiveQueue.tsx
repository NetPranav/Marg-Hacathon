"use client";

import { motion } from "framer-motion";

interface LiveQueueProps {
  trucksAhead: number;
  estWaitMin: number;
  progressPercent: number;
}

export default function LiveQueue({ trucksAhead, estWaitMin, progressPercent }: LiveQueueProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      className="mx-6 mb-28 bg-white rounded-[2rem] p-6 shadow-soft border border-black/[0.03]"
    >
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">
          Live Gate Queue
        </span>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">
            Est. Wait
          </span>
          <div className="flex items-baseline gap-1 text-brand-text">
            <span className="text-2xl font-semibold tracking-tight">{estWaitMin}</span>
            <span className="text-xs font-medium">min</span>
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-8 text-brand-text">
        <span className="text-[4rem] font-light leading-none tracking-tighter">
          {trucksAhead.toString().padStart(2, "0")}
        </span>
        <span className="text-lg font-medium text-brand-text/80">Trucks Ahead</span>
      </div>

      {/* Progress Visualization */}
      <div className="relative pt-2 pb-6">
        {/* Background Track */}
        <div className="w-full h-2.5 bg-brand-orange/10 rounded-full overflow-hidden">
          {/* Active Fill (Cyan) */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
            className="h-full bg-brand-cyan rounded-full relative shadow-[0_0_10px_rgba(0,229,255,0.5)]"
          />
        </div>
        
        {/* Slider Thumb Indicator */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `calc(${progressPercent}% - 3px)` }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
          className="absolute top-1/2 -translate-y-[calc(50%+12px)] w-2 h-4 bg-white rounded-full shadow-sm border-2 border-brand-cyan z-10"
        />

        {/* Labels below progress */}
        <div className="absolute top-6 left-0 right-0 flex justify-between text-[9px] font-bold tracking-widest uppercase">
          <span className="text-brand-text/40">Entry</span>
          <span className="text-brand-orange">You Are Here</span>
          <span className="text-brand-text/40">Dock</span>
        </div>
      </div>
    </motion.div>
  );
}
