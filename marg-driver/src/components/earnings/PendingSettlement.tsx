"use client";

import { motion } from "framer-motion";
import { Activity, Clock, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

interface SettlementRowProps {
  id: string;
  route: string;
  amount: string;
  status: "Processing" | "Escrow Cleared";
}

function SettlementRow({ id, route, amount, status }: SettlementRowProps) {
  const isProcessing = status === "Processing";
  
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-4">
      <div className="flex items-center gap-4">
        <div className={clsx(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isProcessing ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {isProcessing ? <Clock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div>
          <span className="text-[10px] font-bold text-brand-text/80 block mb-0.5">ID: {id}</span>
          <span className="text-sm font-medium text-brand-text/60">{route}</span>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-lg font-light tracking-tight text-brand-text">&#8377;{amount}</span>
        <div className={clsx(
          "px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase",
          isProcessing ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {status}
        </div>
      </div>
    </div>
  );
}

export default function PendingSettlement() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="mx-6 mb-8"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-text tracking-tight mb-0.5">Pending Settlement</h3>
          <span className="text-[10px] font-medium text-brand-text/60">Upcoming Freight Payouts</span>
        </div>
        <Activity className="w-5 h-5 text-brand-text/50" />
      </div>

      <SettlementRow id="TX-9042" route="Indore &rarr; Mumbai" amount="24,800" status="Processing" />
      <SettlementRow id="TX-8821" route="Surat &rarr; Chennai" amount="41,200" status="Escrow Cleared" />

      {/* Progress Visualization */}
      <div className="mt-8 px-2 flex justify-between items-center relative">
        <div className="absolute top-2 left-4 right-4 h-px bg-gray-200 -z-10" />
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#C15B2B] ring-4 ring-[#FDF5F1]" />
          <span className="text-[8px] font-bold tracking-widest text-[#C15B2B] uppercase">Escrow</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#C15B2B] ring-4 ring-[#FDF5F1]" />
          <span className="text-[8px] font-bold tracking-widest text-[#C15B2B] uppercase">Verification</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 ring-4 ring-white" />
          <span className="text-[8px] font-bold tracking-widest text-brand-text/50 uppercase">Transfer</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-200 ring-4 ring-white" />
          <span className="text-[8px] font-bold tracking-widest text-brand-text/50 uppercase">Settled</span>
        </div>
      </div>
    </motion.div>
  );
}
