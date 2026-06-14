"use client";

import { motion } from "framer-motion";
import { Download, CheckCircle2 } from "lucide-react";

interface TripCardProps {
  dateRange: string;
  payout: string;
  origin: string;
  originSub: string;
  destination: string;
  distance: string;
  duration: string;
  detentionClaim?: string;
  titleInitials: string;
  initialsColor: string;
}

function TripCard({
  dateRange,
  payout,
  origin,
  originSub,
  distance,
  duration,
  detentionClaim,
  titleInitials,
  initialsColor
}: TripCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-3xl p-5 mb-4 shadow-soft border border-black/[0.03]"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-medium text-brand-text/60">{dateRange}</span>
        <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[9px] font-bold tracking-widest uppercase">Paid</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-2xl font-light tracking-tight text-brand-text">&#8377;{payout}</span>
        {detentionClaim && (
          <span className="px-2.5 py-1 bg-[#D1F2EB] text-[#117A65] text-[8px] font-bold tracking-widest uppercase rounded-full">
            {detentionClaim}
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* Stylized Avatar/Thumbnail using initials */}
        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-inner flex-shrink-0 bg-gradient-to-br ${initialsColor}`}>
          {titleInitials}
        </div>

        <div className="flex flex-col justify-between py-1">
          <div className="flex gap-3">
            <div className="flex flex-col items-center mt-1">
              <div className="w-2 h-2 rounded-full bg-[#C15B2B]" />
              <div className="w-px h-5 border-l border-dashed border-gray-300 my-0.5" />
              <div className="w-1.5 h-1.5 rounded-full border border-[#C15B2B]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-brand-text">{origin}</span>
              <span className="text-xs font-medium text-brand-text/60">{originSub}</span>
            </div>
          </div>

          <div className="flex gap-6 mt-3">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-brand-text/40 uppercase">Distance</span>
              <span className="text-xs font-semibold text-brand-text">{distance}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-brand-text/40 uppercase">Duration</span>
              <span className="text-xs font-semibold text-brand-text">{duration}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TripHistory() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="mx-6 pb-28"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-brand-text tracking-tight">Trip History</h3>
        <button className="flex items-center gap-1.5 text-xs font-bold text-[#C15B2B] hover:text-[#9C3600] transition-colors">
          Export Ledger <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      <TripCard 
        dateRange="12-15 Sept 2023"
        payout="42,000"
        origin="Ahmedabad Hub"
        originSub="Pune West Warehouse"
        destination=""
        distance="664 KM"
        duration="14h 22m"
        detentionClaim="Detention Claim Settled: +&#8377;2,500"
        titleInitials="AH"
        initialsColor="from-[#1e293b] to-[#0f172a]"
      />

      <TripCard 
        dateRange="08-10 Sept 2023"
        payout="38,500"
        origin="Nagpur ICD"
        originSub="Jabalpur Terminal"
        destination=""
        distance="278 KM"
        duration="6h 10m"
        titleInitials="NI"
        initialsColor="from-[#9ca3af] to-[#6b7280]"
      />
    </motion.div>
  );
}
