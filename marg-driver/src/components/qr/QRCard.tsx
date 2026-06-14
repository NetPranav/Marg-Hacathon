"use client";

import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

interface QRCardProps {
  payload: string;
}

export default function QRCard({ payload }: QRCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="mx-6 mb-4 bg-white rounded-[2.5rem] p-8 shadow-soft border border-black/[0.03] relative flex flex-col items-center"
    >
      <span className="text-[11px] font-bold tracking-[0.2em] text-brand-text/40 uppercase mb-8">
        Automated Gate Pass
      </span>

      {/* QR Code Container with scanner aesthetic */}
      <div className="relative p-6 bg-white rounded-3xl shadow-[inset_0_4px_20px_rgba(0,0,0,0.03)] border border-gray-50 group hover:shadow-[inset_0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
        
        {/* Scanner Accents (corners) */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-orange/40 rounded-tl-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brand-orange/40 rounded-tr-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brand-orange/40 rounded-bl-3xl opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-orange/40 rounded-br-3xl opacity-60 group-hover:opacity-100 transition-opacity" />

        {/* The QR Code */}
        <div className="relative z-10">
          <QRCodeSVG 
            value={payload} 
            size={200}
            bgColor="#ffffff"
            fgColor="#211E1D"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Scanning laser animation line */}
        <motion.div 
          className="absolute left-0 right-0 h-0.5 bg-brand-orange/30 shadow-[0_0_8px_rgba(255,123,71,0.5)] z-20"
          animate={{ top: ["10%", "90%", "10%"] }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
