"use client";

import { motion } from "framer-motion";
import { FileText, Receipt, Leaf, ShieldCheck, ChevronRight, CheckCircle2 } from "lucide-react";

interface DocumentRowProps {
  icon: React.ReactNode;
  title: string;
  status: "Verified" | "Active" | "Synced";
}

function DocumentRow({ icon, title, status }: DocumentRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors rounded-2xl cursor-pointer group mb-2 border border-transparent hover:border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#FDF5F1] flex items-center justify-center text-[#C15B2B]">
          {icon}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-brand-text">{title}</span>
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
          </div>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-brand-text/30 group-hover:text-brand-text/60 transition-colors" />
    </div>
  );
}

export default function ComplianceDocs() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-3xl p-6 shadow-soft border border-black/[0.03]"
    >
      <span className="text-[10px] font-bold tracking-[0.2em] text-brand-text/50 uppercase mb-4 block">
        Compliance Documents
      </span>

      <div className="flex flex-col -mx-2">
        <DocumentRow 
          icon={<FileText className="w-5 h-5" strokeWidth={1.5} />} 
          title="Tax Invoice PDF" 
          status="Verified" 
        />
        <DocumentRow 
          icon={<Receipt className="w-5 h-5" strokeWidth={1.5} />} 
          title="E-Way Bill Certificate" 
          status="Active" 
        />
        <DocumentRow 
          icon={<Leaf className="w-5 h-5" strokeWidth={1.5} />} 
          title="Pollution Certificate" 
          status="Verified" 
        />
        <DocumentRow 
          icon={<ShieldCheck className="w-5 h-5" strokeWidth={1.5} />} 
          title="Insurance Verification" 
          status="Active" 
        />
      </div>
    </motion.div>
  );
}
