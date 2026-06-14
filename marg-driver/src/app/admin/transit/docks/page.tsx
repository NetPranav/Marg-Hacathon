"use client";

import { useState, useEffect } from "react";
import { CalendarClock, CheckCircle2, Clock, XCircle, RefreshCw, Warehouse } from "lucide-react";
import api from "@/lib/api";

export default function DockReservationsPage() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadWarehouses(); }, []);

  const loadWarehouses = async () => {
    try {
      const res = await api.get("/warehouses/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setWarehouses(list);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Dock Reservations</h1>
        <p className="text-sm text-brand-muted mt-1">Coordinate unloading schedules with destination warehouses</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Confirmed", value: 0, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Pending", value: 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Rescheduled", value: 0, icon: RefreshCw, color: "bg-blue-50 text-blue-600" },
          { label: "Cancelled", value: 0, icon: XCircle, color: "bg-red-50 text-red-500" },
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

      {/* Warehouse Docks */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04]">
          <h2 className="font-semibold text-brand-text">Available Warehouses</h2>
        </div>
        {warehouses.length === 0 ? (
          <div className="p-10 text-center text-brand-muted text-sm">
            <Warehouse size={32} className="mx-auto mb-2 opacity-30" />
            <p>No warehouse connections established yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {warehouses.map((w) => (
              <div key={w.id} className="px-5 py-4 flex items-center justify-between hover:bg-black/[0.01] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center"><Warehouse size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{w.name}</p>
                    <p className="text-xs text-brand-muted">{w.location || w.address || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 bg-brand-orange text-white rounded-lg text-xs font-medium hover:bg-brand-orange/90 transition-colors">Reserve Dock</button>
                  <button className="px-3 py-2 bg-black/[0.03] text-brand-muted rounded-lg text-xs font-medium hover:bg-black/[0.06] transition-colors">Request Reschedule</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
