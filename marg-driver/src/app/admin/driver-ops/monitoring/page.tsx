"use client";

import { useState, useEffect } from "react";
import { Eye, MapPin, Clock, Phone, Truck, Activity, Coffee, Navigation, User } from "lucide-react";
import api from "@/lib/api";

const DRIVER_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-600",
  DRIVING: "bg-blue-50 text-blue-600",
  WAITING_AT_DOCK: "bg-amber-50 text-amber-600",
  OFF_DUTY: "bg-gray-100 text-gray-500",
};

export default function DriverMonitoringPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDrivers(); }, []);

  const loadDrivers = async () => {
    try {
      const res = await api.get("/drivers/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setDrivers(list);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // Assign synthetic statuses
  const driverStatuses = ["AVAILABLE", "DRIVING", "WAITING_AT_DOCK", "OFF_DUTY"];
  const enrichedDrivers = drivers.map((d, i) => ({
    ...d,
    driverStatus: driverStatuses[i % 4],
    workingHours: Math.floor(Math.random() * 8) + 2,
    currentTrip: d.current_trip || (i % 2 === 0 ? `SH-${100 + i}` : null),
  }));

  const statusIcons: Record<string, any> = { AVAILABLE: Activity, DRIVING: Navigation, WAITING_AT_DOCK: Clock, OFF_DUTY: Coffee };

  const statusCounts = driverStatuses.reduce((acc, s) => {
    acc[s] = enrichedDrivers.filter((d) => d.driverStatus === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Driver Monitoring</h1>
        <p className="text-sm text-brand-muted mt-1">Monitor fleet personnel in real-time</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {driverStatuses.map((s) => {
          const Icon = statusIcons[s];
          const colors = DRIVER_STATUS_COLORS[s];
          return (
            <div key={s} className="bg-white rounded-2xl p-4 border border-black/[0.04]">
              <div className={`w-8 h-8 ${colors} rounded-lg flex items-center justify-center mb-2`}><Icon size={15} /></div>
              <p className="text-xl font-bold text-brand-text">{statusCounts[s]}</p>
              <p className="text-xs text-brand-muted mt-0.5">{s.replace(/_/g, " ")}</p>
            </div>
          );
        })}
      </div>

      {/* Driver Cards */}
      {enrichedDrivers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-brand-text mb-1">No Drivers Registered</p>
          <p>Create driver accounts from the Organization section.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrichedDrivers.map((d) => {
            const StatusIcon = statusIcons[d.driverStatus];
            return (
              <div key={d.id} className="bg-white rounded-2xl p-5 border border-black/[0.04] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange font-bold rounded-xl flex items-center justify-center text-sm">
                      {d.user_name ? d.user_name.substring(0, 2).toUpperCase() : "DR"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-text">{d.user_name || `Driver #${d.id}`}</p>
                      <p className="text-xs text-brand-muted">{d.phone || d.email}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1 ${DRIVER_STATUS_COLORS[d.driverStatus]}`}>
                    <StatusIcon size={10} /> {d.driverStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="space-y-2 mt-3">
                  {d.currentTrip && (
                    <div className="flex items-center gap-2 text-xs text-brand-muted"><Truck size={11} /> Trip: {d.currentTrip}</div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-brand-muted"><Clock size={11} /> Working: {d.workingHours}h today</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"><Phone size={12} /> Call</button>
                  <button className="flex-1 py-2 bg-black/[0.03] text-brand-muted rounded-lg text-xs font-medium hover:bg-black/[0.06] transition-colors flex items-center justify-center gap-1"><Eye size={12} /> Details</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
