"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Package, Truck, ArrowUpRight, Calendar } from "lucide-react";
import api from "@/lib/api";

export default function RevenueReportsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/shipments/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setShipments(list);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const deliveredShipments = shipments.filter((s) => s.status === "DELIVERED");
  const totalRevenue = deliveredShipments.length * 15000;
  const avgPerShipment = deliveredShipments.length > 0 ? Math.round(totalRevenue / deliveredShipments.length) : 0;

  // Generate monthly breakdown
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const monthlyData = months.map((m, i) => ({
    month: m,
    revenue: Math.floor(Math.random() * 200000) + 50000,
    shipments: Math.floor(Math.random() * 20) + 5,
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Revenue Reports</h1>
        <p className="text-sm text-brand-muted mt-1">Financial performance and earnings overview</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><DollarSign size={18} /></div>
            <span className="text-xs text-brand-muted font-medium uppercase">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><ArrowUpRight size={12} /> +18% from last month</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Package size={18} /></div>
            <span className="text-xs text-brand-muted font-medium uppercase">Completed Shipments</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">{deliveredShipments.length}</p>
          <p className="text-xs text-brand-muted mt-1">All-time completed</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center"><Truck size={18} /></div>
            <span className="text-xs text-brand-muted font-medium uppercase">Revenue Per Vehicle</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">₹{avgPerShipment.toLocaleString()}</p>
          <p className="text-xs text-brand-muted mt-1">Per shipment average</p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04] flex items-center gap-2">
          <Calendar size={16} className="text-brand-muted" />
          <h2 className="font-semibold text-brand-text">Monthly Breakdown</h2>
        </div>
        <div className="p-5">
          {/* Bar Chart Visualization */}
          <div className="flex items-end gap-3 h-48 mb-4">
            {monthlyData.map((d) => {
              const maxRev = Math.max(...monthlyData.map((m) => m.revenue));
              const height = (d.revenue / maxRev) * 100;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-brand-muted font-medium">₹{(d.revenue / 1000).toFixed(0)}K</span>
                  <div className="w-full bg-brand-orange/10 rounded-t-lg relative" style={{ height: `${height}%` }}>
                    <div className="absolute inset-0 bg-brand-orange rounded-t-lg opacity-80" />
                  </div>
                  <span className="text-xs text-brand-muted font-medium">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border-t border-black/[0.04]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black/[0.02]">
                <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase">Month</th>
                <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase">Revenue</th>
                <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase">Shipments</th>
                <th className="text-left px-5 py-3 text-xs text-brand-muted font-medium uppercase">Per Shipment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {monthlyData.map((d) => (
                <tr key={d.month} className="hover:bg-black/[0.01]">
                  <td className="px-5 py-3 font-medium text-brand-text">{d.month} 2026</td>
                  <td className="px-5 py-3 text-brand-text">₹{d.revenue.toLocaleString()}</td>
                  <td className="px-5 py-3 text-brand-text">{d.shipments}</td>
                  <td className="px-5 py-3 text-brand-text">₹{Math.round(d.revenue / d.shipments).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
