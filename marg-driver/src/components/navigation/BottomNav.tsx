"use client";

import { motion } from "framer-motion";
import { Home, Navigation, MessageSquare, QrCode, RotateCcw } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "trip", label: "Trip", icon: Navigation, href: "/cargo" },
  { id: "messages", label: "Messages", icon: MessageSquare, href: "/messages" },
  { id: "dock", label: "Dock", icon: QrCode, href: "/gate" },
  { id: "return", label: "Returns", icon: RotateCcw, href: "/earnings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
      <div className="bg-[#312E2D] rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 flex items-center justify-between relative">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (pathname === "/" && tab.id === "home");
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={clsx(
                "relative flex flex-col items-center justify-center w-14 h-14 rounded-[1.5rem] transition-colors duration-300",
                isActive ? "text-white" : "text-[#D4C8C1]/70 hover:text-[#D4C8C1]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-[#C15B2B] rounded-[1.5rem]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={clsx("text-[9px] font-medium tracking-wide", isActive ? "text-white" : "")}>
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
