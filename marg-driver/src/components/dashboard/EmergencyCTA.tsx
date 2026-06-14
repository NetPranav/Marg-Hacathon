"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function EmergencyCTA() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="mx-6 mb-24"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(true)}
          className="w-full bg-brand-orange text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-glow"
        >
          <AlertTriangle size={22} strokeWidth={2.5} />
          <span className="text-[17px] font-semibold tracking-wide">Report Route Delay</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Modal Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-12 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-brand-text">Report Delay</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {["Flat Tire", "Traffic Jam", "Checkpost Delay"].map((issue) => (
                  <button
                    key={issue}
                    onClick={() => {
                      setIsOpen(false);
                      // In production, fire webhook here
                    }}
                    className="w-full py-4 px-6 bg-gray-50 hover:bg-brand-orange/10 rounded-xl text-left font-medium text-brand-text transition-colors border border-gray-100 flex items-center justify-between group"
                  >
                    {issue}
                    <div className="w-2 h-2 rounded-full bg-brand-orange opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
