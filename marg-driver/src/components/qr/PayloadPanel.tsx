"use client";

import { motion } from "framer-motion";

interface PayloadData {
  manifestId: string;
  vehicleMatch: string;
  destination: string;
}

interface PayloadPanelProps {
  data: PayloadData;
}

export default function PayloadPanel({ data }: PayloadPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="mx-6 mb-6 bg-[#FDF5F1] rounded-[2rem] p-6 border border-brand-orange/10"
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center pb-4 border-b border-brand-orange/5">
          <span className="text-[11px] font-mono tracking-widest text-brand-text/60">MANIFEST ID</span>
          <span className="text-sm font-mono text-brand-text font-medium">{data.manifestId}</span>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-brand-orange/5">
          <span className="text-[11px] font-mono tracking-widest text-brand-text/60">VEHICLE MATCH</span>
          <span className="text-sm font-mono text-brand-text font-medium">{data.vehicleMatch}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[11px] font-mono tracking-widest text-brand-text/60">DESTINATION</span>
          <span className="text-sm font-mono text-brand-orange font-bold">{data.destination}</span>
        </div>
      </div>
    </motion.div>
  );
}
