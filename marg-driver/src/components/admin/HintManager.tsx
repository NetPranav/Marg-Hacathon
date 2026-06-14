"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HintManager() {
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchPendingShipments = async () => {
      try {
        const res = await api.get("/shipments/");
        const shipments = Array.isArray(res.data) ? res.data : res.data.results || [];
        // Count shipments that are waiting for driver assignment
        const pending = shipments.filter((s: any) => s.status === "LOGISTICS_SELECTED").length;
        
        setUnassignedCount(pending);
        if (pending > 0) {
          setShowHint(true);
        }
      } catch (err) {}
    };

    fetchPendingShipments();
    const int = setInterval(fetchPendingShipments, 300000); // Check every 5 minutes
    return () => clearInterval(int);
  }, []);

  // Set up the recurring popup if dismissed
  useEffect(() => {
    if (!showHint && unassignedCount > 0) {
      const int = setTimeout(() => setShowHint(true), 300000); // Re-show after 5 mins if dismissed
      return () => clearTimeout(int);
    }
  }, [showHint, unassignedCount]);

  if (!showHint || unassignedCount === 0) return null;

  // Don't show hint if already on the page
  if (pathname === "/admin/shipments") return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border-2 border-brand-orange shadow-2xl rounded-2xl p-4 pr-10 relative">
        <button 
          onClick={() => setShowHint(false)}
          className="absolute top-3 right-3 text-brand-muted hover:text-brand-text p-1 rounded-lg hover:bg-black/5"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-brand-text text-sm mb-1">Next Step Required</h3>
            <p className="text-xs text-brand-muted leading-relaxed mb-3">
              You have {unassignedCount} {unassignedCount === 1 ? 'shipment' : 'shipments'} waiting for driver and vehicle assignment. Assign them to proceed with the delivery.
            </p>
            <Link 
              href="/admin/shipments"
              onClick={() => setShowHint(false)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-orange px-3 py-2 rounded-lg hover:bg-brand-orange/90 transition-colors"
            >
              Go to Tie-Up Requests <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
