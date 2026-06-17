"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Truck, Package, Users, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  Navigation, RotateCcw, DollarSign, Activity, FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface DashboardMetrics {
  activeShipments: number;
  availableVehicles: number;
  totalDrivers: number;
  openAlerts: number;
  revenue30d: number;
  utilizationRate: number;
  onTimeRate: number;
  emptyMilesReduced: number;
}

export default function OwnerDashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeShipments: 0,
    availableVehicles: 0,
    totalDrivers: 0,
    openAlerts: 0,
    revenue30d: 0,
    utilizationRate: 0,
    onTimeRate: 0,
    emptyMilesReduced: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [activeLots, setActiveLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [shipmentsRes, trucksRes, driversRes, lotsRes] = await Promise.allSettled([
        api.get("/shipments/"),
        api.get("/trucks/"),
        api.get("/drivers/"),
        api.get("/shipments/lots/", { params: { status__in: 'SHARED,ACCEPTED,SHIPMENT_GENERATED', page_size: 5 } }),
      ]);

      const shipments = shipmentsRes.status === "fulfilled" ? shipmentsRes.value.data : [];
      const trucks = trucksRes.status === "fulfilled" ? trucksRes.value.data : [];
      const drivers = driversRes.status === "fulfilled" ? driversRes.value.data : [];
      const lotsData = lotsRes.status === "fulfilled" ? lotsRes.value.data : [];

      const shipmentList = Array.isArray(shipments) ? shipments : shipments.results || [];
      const truckList = Array.isArray(trucks) ? trucks : trucks.results || [];
      const driverList = Array.isArray(drivers) ? drivers : drivers.results || [];

      const activeShipments = shipmentList.filter((s: any) => s.status === "IN_TRANSIT" || s.status === "DISPATCHED").length;
      const availableVehicles = truckList.filter((t: any) => t.status === "AVAILABLE" || !t.status).length;

      setMetrics({
        activeShipments,
        availableVehicles,
        totalDrivers: driverList.length,
        openAlerts: shipmentList.filter((s: any) => s.status === "DELAYED").length,
        revenue30d: shipmentList.filter((s: any) => s.status === "DELIVERED").length * 12500,
        utilizationRate: truckList.length > 0 ? Math.round(((truckList.length - availableVehicles) / truckList.length) * 100) : 0,
        onTimeRate: 94,
        emptyMilesReduced: 12,
      });

      setRecentActivity(
        shipmentList.slice(0, 5).map((s: any) => ({
          id: s.id,
          title: `Shipment #${s.tracking_number || s.id}`,
          status: s.status,
          time: s.updated_at || s.created_at,
        }))
      );

      setActiveLots(Array.isArray(lotsData) ? lotsData : lotsData.results || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Active Shipments", value: metrics.activeShipments, icon: Navigation, color: "text-blue-600", bg: "bg-blue-50", trend: "+3" },
    { label: "Available Vehicles", value: metrics.availableVehicles, icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50", trend: null },
    { label: "Total Drivers", value: metrics.totalDrivers, icon: Users, color: "text-violet-600", bg: "bg-violet-50", trend: null },
    { label: "Open Alerts", value: metrics.openAlerts, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", trend: metrics.openAlerts > 0 ? `${metrics.openAlerts}` : "0" },
  ];

  const kpiCards = [
    { label: "Revenue (30d)", value: `₹${(metrics.revenue30d / 1000).toFixed(0)}K`, icon: DollarSign, trend: "+18%", up: true },
    { label: "Fleet Utilization", value: `${metrics.utilizationRate}%`, icon: Activity, trend: "+5%", up: true },
    { label: "On-Time Delivery", value: `${metrics.onTimeRate}%`, icon: CheckCircle2, trend: "+2%", up: true },
    { label: "Empty Miles Saved", value: `${metrics.emptyMilesReduced}%`, icon: RotateCcw, trend: "+4%", up: true },
  ];

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      IN_TRANSIT: "bg-blue-100 text-blue-700",
      DISPATCHED: "bg-violet-100 text-violet-700",
      DELIVERED: "bg-emerald-100 text-emerald-700",
      DELAYED: "bg-amber-100 text-amber-700",
      PENDING: "bg-gray-100 text-gray-600",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text">
          Welcome back, {user?.first_name || "Owner"}
        </h1>
        <p className="text-brand-muted text-sm mt-1">
          {user?.organization_name || "Your logistics operations"} — here&apos;s your control center.
        </p>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                {card.trend && (
                  <span className="text-xs font-medium text-brand-muted bg-black/[0.03] px-2 py-1 rounded-lg">
                    {card.trend}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-brand-text mt-3">{card.value}</p>
              <p className="text-sm text-brand-muted mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-black/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-brand-muted" />
                <span className="text-xs text-brand-muted font-medium">{kpi.label}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-brand-text">{kpi.value}</span>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.up ? "text-emerald-600" : "text-red-500"}`}>
                  {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.04]">
          <h2 className="font-semibold text-brand-text">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-brand-muted text-sm">
            No recent shipment activity. Start by bidding on marketplace requests!
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {recentActivity.map((item) => (
              <div key={item.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-black/[0.01] transition-colors">
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-brand-muted" />
                  <div>
                    <p className="text-sm font-medium text-brand-text">{item.title}</p>
                    <p className="text-xs text-brand-muted flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(item.time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${getStatusColor(item.status)}`}>
                  {item.status?.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Workflows */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-black/[0.04] flex justify-between items-center">
          <h2 className="font-semibold text-brand-text">Active Workflows (Check Workflow)</h2>
          <button 
            onClick={() => router.push('/admin/marketplace/requests')}
            className="text-xs font-medium text-brand-orange hover:bg-brand-orange/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            View All →
          </button>
        </div>
        {activeLots.length === 0 ? (
          <div className="p-8 text-center text-brand-muted text-sm">
            No active workflows found.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {activeLots.map((lot) => (
              <div 
                key={lot.id} 
                onClick={() => router.push(`/admin/marketplace/requests/${lot.id}/workflow`)}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-black/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
                    <FileText size={18} className="text-brand-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">Lot {lot.lot_number}</p>
                    <p className="text-xs text-brand-muted flex items-center gap-1">
                      From {lot.factory_name} | {lot.parcels?.length || 0} parcels
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-brand-orange`}>
                  {lot.status?.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
