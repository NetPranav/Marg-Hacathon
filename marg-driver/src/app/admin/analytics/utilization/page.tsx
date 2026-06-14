"use client";

import { BarChart3, Truck, Clock, RotateCcw, Activity, ArrowUpRight } from "lucide-react";

export default function UtilizationReportsPage() {
  const metrics = [
    { label: "Fleet Utilization", value: "78%", trend: "+5%", icon: BarChart3, color: "bg-blue-50 text-blue-600" },
    { label: "Vehicle Idle Time", value: "4.2h", trend: "-12%", icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Empty Trips Prevented", value: "12", trend: "+8", icon: RotateCcw, color: "bg-emerald-50 text-emerald-600" },
    { label: "Avg Load Factor", value: "82%", trend: "+3%", icon: Activity, color: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Utilization Reports</h1>
        <p className="text-sm text-brand-muted mt-1">Fleet efficiency and utilization metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl p-5 border border-black/[0.04]">
              <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-3xl font-bold text-brand-text">{m.value}</p>
              <p className="text-xs text-brand-muted mt-0.5">{m.label}</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                <ArrowUpRight size={11} /> {m.trend}
              </p>
            </div>
          );
        })}
      </div>

      {/* Utilization Gauge */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04]">
        <h3 className="font-semibold text-brand-text mb-4">Vehicle-wise Utilization</h3>
        <div className="space-y-4">
          {["MH12AB4582", "KA01CD5678", "TN09EF3456", "GJ05GH7890"].map((v, i) => {
            const pct = [85, 72, 91, 64][i];
            return (
              <div key={v}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Truck size={13} className="text-brand-muted" />
                    <span className="text-sm font-medium text-brand-text">{v}</span>
                  </div>
                  <span className="text-sm font-semibold text-brand-text">{pct}%</span>
                </div>
                <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? "bg-emerald-500" : pct > 60 ? "bg-amber-500" : "bg-red-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
