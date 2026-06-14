"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { LayoutDashboard, QrCode, ClipboardCheck, MessageSquare, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const tabs = [
  { id: "ops", label: "Hub", icon: LayoutDashboard, href: "/ops/dashboard" },
  { id: "scan", label: "Scan", icon: QrCode, href: "/ops/scan" },
  { id: "tasks", label: "Tasks", icon: ClipboardCheck, href: "/ops/tasks" },
  { id: "comms", label: "Comms", icon: MessageSquare, href: "/ops/comms" },
];

export default function OpsBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50">
      <div className="bg-[#312E2D] rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-2 flex items-center justify-between relative">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={clsx(
                "relative flex flex-col items-center justify-center w-16 h-16 rounded-[1.5rem] transition-colors duration-300",
                isActive ? "text-white" : "text-[#D4C8C1]/70 hover:text-[#D4C8C1]"
              )}
            >
              <div className="relative z-10 flex flex-col items-center gap-1">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={clsx("text-[10px] font-medium tracking-wide", isActive ? "text-white" : "")}>
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
