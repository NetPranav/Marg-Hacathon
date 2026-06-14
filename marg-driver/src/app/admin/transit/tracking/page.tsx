"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { MapPin, Truck, Navigation, Signal } from "lucide-react";
import api from "@/lib/api";

const TrackingMap = dynamic(() => import("@/components/admin/AdminMapComponent"), { ssr: false });

export default function LiveTrackingPage() {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTrucks(); }, []);

  const loadTrucks = async () => {
    try {
      const res = await api.get("/trucks/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setTrucks(list);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Live Fleet Tracking</h1>
        <p className="text-sm text-brand-muted mt-1">Real-time GPS tracking of all fleet vehicles</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Vehicles", value: trucks.length, icon: Truck, color: "bg-blue-50 text-blue-600" },
          { label: "In Transit", value: trucks.filter((t) => t.status === "IN_TRANSIT").length, icon: Navigation, color: "bg-emerald-50 text-emerald-600" },
          { label: "At Location", value: trucks.filter((t) => t.status === "AVAILABLE").length, icon: MapPin, color: "bg-amber-50 text-amber-600" },
          { label: "GPS Active", value: trucks.length, icon: Signal, color: "bg-violet-50 text-violet-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-black/[0.04]">
              <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-2`}><Icon size={15} /></div>
              <p className="text-xl font-bold text-brand-text">{s.value}</p>
              <p className="text-xs text-brand-muted mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden" style={{ height: 500 }}>
        <TrackingMap />
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04]">
          <h2 className="font-semibold text-brand-text">Fleet Vehicles</h2>
        </div>
        {trucks.length === 0 ? (
          <div className="p-8 text-center text-brand-muted text-sm">No vehicles tracked.</div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {trucks.map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-black/[0.01] transition-colors">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Truck size={14} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text">{t.registration_number || t.vehicle_number || `Vehicle #${t.id}`}</p>
                  <p className="text-xs text-brand-muted">{t.driver_name || "Unassigned"}</p>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${t.status === "IN_TRANSIT" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"}`}>
                  {(t.status || "IDLE").replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
