"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import the admin map to prevent SSR issues with Leaflet
const AdminMapComponent = dynamic(() => import("./AdminMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#E5E0DA]/30 animate-pulse rounded-[2rem] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin opacity-50" />
    </div>
  ),
});

export default function AdminMap() {
  return (
    <div className="w-full h-[400px] rounded-[2rem] overflow-hidden shadow-soft border border-black/[0.03] relative z-0">
      <Suspense fallback={null}>
        <AdminMapComponent />
      </Suspense>
    </div>
  );
}
