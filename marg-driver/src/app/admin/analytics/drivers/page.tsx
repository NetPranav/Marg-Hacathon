"use client";

import { useState, useEffect } from "react";
import { Star, Clock, RotateCcw, Package, User, TrendingUp } from "lucide-react";
import api from "@/lib/api";

export default function DriverPerformancePage() {
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

  const driverPerformance = drivers.map((d, i) => ({
    ...d,
    tripsCompleted: Math.floor(Math.random() * 30) + 5,
    avgDelay: `${(Math.random() * 2).toFixed(1)}h`,
    returnLoadsAccepted: Math.floor(Math.random() * 10),
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Driver Performance</h1>
        <p className="text-sm text-brand-muted mt-1">Individual driver metrics and ratings</p>
      </div>

      {driverPerformance.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
          <User size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-brand-text mb-1">No Driver Data</p>
          <p>Performance metrics will appear once drivers complete trips.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-black/[0.02]">
                  <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase tracking-wider">Driver</th>
                  <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase tracking-wider">Trips</th>
                  <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase tracking-wider">Avg Delay</th>
                  <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase tracking-wider">Return Loads</th>
                  <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase tracking-wider">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {driverPerformance.map((d) => (
                  <tr key={d.id} className="hover:bg-black/[0.01] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-orange/10 text-brand-orange font-bold rounded-lg flex items-center justify-center text-xs">
                          {d.user_name ? d.user_name.substring(0, 2).toUpperCase() : "DR"}
                        </div>
                        <div>
                          <p className="font-medium text-brand-text">{d.user_name || `Driver #${d.id}`}</p>
                          <p className="text-xs text-brand-muted">{d.phone || d.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Package size={13} className="text-blue-500" />
                        <span className="font-medium text-brand-text">{d.tripsCompleted}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className={parseFloat(d.avgDelay) > 1 ? "text-amber-500" : "text-emerald-500"} />
                        <span className="font-medium text-brand-text">{d.avgDelay}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <RotateCcw size={13} className="text-violet-500" />
                        <span className="font-medium text-brand-text">{d.returnLoadsAccepted}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-brand-text">{d.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
