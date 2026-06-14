"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Navigation, AlertCircle } from "lucide-react";

export type GeofenceState = "outside" | "approaching" | "allocated";

interface GeofenceStatusProps {
  state?: GeofenceState;
}

export default function GeofenceStatus({ state = "allocated" }: GeofenceStatusProps) {
  const getStatusConfig = () => {
    switch (state) {
      case "allocated":
        return {
          title: "DOCK PRE-ALLOCATED",
          subtitle: "Inside 1km Gate Radius",
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
          colorClass: "bg-emerald-50 border-emerald-100",
          iconBg: "bg-emerald-100",
          pulseColor: "bg-emerald-400",
        };
      case "approaching":
        return {
          title: "APPROACHING GATE",
          subtitle: "Inside 20km Radius",
          icon: <Navigation className="w-6 h-6 text-amber-500" />,
          colorClass: "bg-amber-50 border-amber-100",
          iconBg: "bg-amber-100",
          pulseColor: "bg-amber-400",
        };
      case "outside":
      default:
        return {
          title: "OUTSIDE ZONE",
          subtitle: "More than 20km away",
          icon: <AlertCircle className="w-6 h-6 text-gray-400" />,
          colorClass: "bg-gray-50 border-gray-100",
          iconBg: "bg-gray-100",
          pulseColor: "bg-transparent",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mx-6 mb-4 bg-white rounded-3xl p-4 shadow-soft border border-black/[0.03] flex items-center gap-4"
    >
      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center ${config.iconBg}`}>
        {state !== "outside" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-full h-full rounded-full animate-ping opacity-30 ${config.pulseColor}`} />
          </div>
        )}
        <div className="relative z-10">{config.icon}</div>
      </div>
      
      <div className="flex flex-col">
        <span className="text-[10px] font-bold tracking-widest text-brand-text/50 uppercase">
          {config.title}
        </span>
        <span className="text-base font-semibold text-brand-text tracking-tight">
          {config.subtitle}
        </span>
      </div>
    </motion.div>
  );
}
