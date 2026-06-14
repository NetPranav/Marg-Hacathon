"use client";

import { motion } from "framer-motion";
import Logo from "@/components/brand/Logo";

export default function MarketHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between px-6 py-5 sticky top-0 z-40 bg-brand-bg/90 backdrop-blur-md"
    >
      <Logo className="text-[#C15B2B]" />

      <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-soft border-2 border-white">
        <div className="w-full h-full bg-brand-text flex items-center justify-center text-white text-sm font-semibold">
          AV
        </div>
      </div>
    </motion.header>
  );
}
