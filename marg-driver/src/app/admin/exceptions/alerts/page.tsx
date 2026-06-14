"use client";

import { useState } from "react";
import {
  AlertTriangle, Clock, Truck, XCircle, Warehouse, Navigation,
  CheckCircle2, ArrowUpRight, User, MessageSquare
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-blue-500",
};

type Alert = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  time: string;
  shipment: string;
  resolved: boolean;
};

const sampleAlerts: Alert[] = [
  { id: "1", type: "DELAYED_TRUCK", title: "Truck Delayed", description: "Vehicle MH12AB4582 is 2 hours behind schedule", severity: "HIGH", time: new Date(Date.now() - 3600000).toISOString(), shipment: "SH-201", resolved: false },
  { id: "2", type: "DOCK_CONFLICT", title: "Dock Conflict", description: "Dock Bay 3 double-booked for 14:00-15:00 window", severity: "MEDIUM", time: new Date(Date.now() - 7200000).toISOString(), shipment: "SH-199", resolved: false },
  { id: "3", type: "VEHICLE_BREAKDOWN", title: "Vehicle Breakdown", description: "Engine warning light triggered on KA01CD5678", severity: "CRITICAL", time: new Date(Date.now() - 1800000).toISOString(), shipment: "SH-203", resolved: false },
  { id: "4", type: "DRIVER_OFFLINE", title: "Driver Offline", description: "Driver Rajesh Kumar GPS signal lost 30 mins ago", severity: "HIGH", time: new Date(Date.now() - 5400000).toISOString(), shipment: "SH-202", resolved: false },
  { id: "5", type: "SHIPMENT_DELAY", title: "Shipment Delay", description: "Weather disruption on NH48, estimated 4h delay", severity: "MEDIUM", time: new Date(Date.now() - 10800000).toISOString(), shipment: "SH-198", resolved: true },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(sampleAlerts);
  const [filter, setFilter] = useState("ALL");

  const resolve = (id: string) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, resolved: true } : a));

  const filtered = alerts.filter((a) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return !a.resolved;
    return a.severity === filter;
  });

  const activeCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Operational Alerts</h1>
        <p className="text-sm text-brand-muted mt-1">{activeCount} active alerts requiring attention</p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "ACTIVE", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-brand-orange text-white" : "bg-white text-brand-muted border border-black/[0.06] hover:bg-black/[0.02]"}`}
          >{f}</button>
        ))}
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.map((alert) => (
          <div key={alert.id} className={`bg-white rounded-2xl p-5 border border-black/[0.04] ${alert.resolved ? "opacity-60" : ""} hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all`}>
            <div className="flex items-start gap-4">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${SEVERITY_DOT[alert.severity]}`} />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-brand-text flex items-center gap-2">
                      {alert.title}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[alert.severity]}`}>
                        {alert.severity}
                      </span>
                      {alert.resolved && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Resolved</span>}
                    </h3>
                    <p className="text-sm text-brand-muted mt-0.5">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-brand-muted flex items-center gap-1"><Navigation size={10} /> {alert.shipment}</span>
                      <span className="text-xs text-brand-muted flex items-center gap-1"><Clock size={10} /> {new Date(alert.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                </div>

                {!alert.resolved && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => resolve(alert.id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">
                      <CheckCircle2 size={12} /> Resolve
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                      <User size={12} /> Assign Owner
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                      <ArrowUpRight size={12} /> Escalate
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-black/[0.03] text-brand-muted rounded-lg text-xs font-medium hover:bg-black/[0.06] transition-colors">
                      <MessageSquare size={12} /> Comment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
