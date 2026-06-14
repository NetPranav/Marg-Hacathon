"use client";

import { motion } from "framer-motion";
import { Building2, Warehouse } from "lucide-react";

export default function LedgerCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-3xl p-6 shadow-soft border border-black/[0.03] flex items-stretch"
    >
      {/* Consignor (Left Column) */}
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-3.5 h-3.5 text-[#C15B2B]" strokeWidth={2} />
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#C15B2B] uppercase">
            Consignor
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-brand-text leading-snug">
            Apex<br/>Manufacturing
          </span>
          <span className="text-xs font-medium text-brand-text/60 mt-1">
            Chicago, IL<br/>(Zone A)
          </span>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-gray-100 my-2 mx-2" />

      {/* Consignee (Right Column) */}
      <div className="flex-1 pl-4">
        <div className="flex items-center gap-2 mb-3">
          <Warehouse className="w-3.5 h-3.5 text-brand-text/60" strokeWidth={2} />
          <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/60 uppercase">
            Consignee
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-brand-text leading-snug">
            Global Hub 4<br/>&nbsp;
          </span>
          <span className="text-xs font-medium text-brand-text/60 mt-1">
            Detroit, MI<br/>(Dock 12)
          </span>
        </div>
      </div>
    </motion.div>
  );
}
