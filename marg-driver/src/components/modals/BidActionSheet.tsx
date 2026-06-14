"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, TrendingUp } from "lucide-react";

interface BidActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BidActionSheet({ isOpen, onClose }: BidActionSheetProps) {
  const [bidValue, setBidValue] = useState(1240);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAccept = () => {
    setIsAccepting(true);
    // Simulate webhook acceptance
    setTimeout(() => {
      setIsAccepting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />

          {/* Bottom Sheet Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 pb-12 shadow-2xl"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-brand-text mb-1 tracking-tight">Cargo Trip Details</h3>
                <p className="text-sm font-medium text-brand-text/50">Industrial Steel Coils • 24.5 MT</p>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-brand-text/50 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Profitability Estimator */}
            <div className="bg-[#FDF5F1] rounded-2xl p-4 mb-6 flex items-center justify-between border border-[#C15B2B]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-[#C15B2B]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">Driver Profit Est.</span>
                  <span className="text-lg font-bold text-brand-text">+38% Margin</span>
                </div>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">Fuel Est.</span>
                <span className="text-sm font-bold text-brand-text/80">-$180</span>
              </div>
            </div>

            {/* Custom Bid Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xs font-bold text-brand-text/60">YOUR COUNTER BID</span>
                <span className="text-3xl font-light tracking-tighter text-brand-text">${bidValue}</span>
              </div>
              
              <input 
                type="range" 
                min="1100" 
                max="1400" 
                step="10"
                value={bidValue}
                onChange={(e) => setBidValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C15B2B]"
              />
              
              <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase mt-3 text-brand-text/40">
                <span>Safe Min: $1,100</span>
                <span>Market: $1,240</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAccept}
              disabled={isAccepting || isSuccess}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSuccess ? 'bg-emerald-500' : 'bg-[#9C3600] hover:bg-[#852E00]'
              }`}
            >
              {isAccepting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Trip Locked
                </>
              ) : (
                "Submit Bid & Accept"
              )}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
