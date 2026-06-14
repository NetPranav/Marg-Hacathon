"use client";

import { useState, useEffect } from "react";
import { RotateCcw, Factory, MapPin, DollarSign, Truck, CheckCircle2, X, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function ReturnLoadsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDelivered(); }, []);

  const loadDelivered = async () => {
    try {
      const res = await api.get("/shipments/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setShipments(list.filter((s: any) => s.status === "DELIVERED"));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // Generate return load suggestions based on delivered shipments
  const returnLoads = shipments.slice(0, 5).map((s, i) => ({
    id: `RL-${s.id}`,
    factory: `Factory ${["Alpha", "Beta", "Gamma", "Delta", "Epsilon"][i % 5]}`,
    distance: `${Math.floor(Math.random() * 150) + 20} km`,
    estimatedRevenue: `₹${(Math.floor(Math.random() * 20) + 8) * 1000}`,
    destination: s.origin_name || s.factory_name || "Origin Factory",
    vehicleCapacity: `${Math.floor(Math.random() * 10) + 5}T available`,
    shipmentRef: s.tracking_number || s.id,
  }));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Return Load Center</h1>
        <p className="text-sm text-brand-muted mt-1">Reduce empty miles by assigning return loads after delivery</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><RotateCcw size={16} /></div>
            <span className="text-xs text-brand-muted font-medium uppercase">Available Loads</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">{returnLoads.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><DollarSign size={16} /></div>
            <span className="text-xs text-brand-muted font-medium uppercase">Est. Revenue</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">₹{returnLoads.reduce((sum, r) => sum + parseInt(r.estimatedRevenue.replace(/[₹,]/g, "")), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-black/[0.04]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Truck size={16} /></div>
            <span className="text-xs text-brand-muted font-medium uppercase">Idle Vehicles</span>
          </div>
          <p className="text-2xl font-bold text-brand-text">{shipments.length}</p>
        </div>
      </div>

      {/* Return Load Cards */}
      {returnLoads.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
          <RotateCcw size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-brand-text mb-1">No Return Loads Available</p>
          <p>Return load suggestions will appear after shipments are delivered.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returnLoads.map((rl) => (
            <div key={rl.id} className="bg-white rounded-2xl p-5 border border-black/[0.04] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-brand-text flex items-center gap-2">
                    <Factory size={15} className="text-brand-orange" /> {rl.factory}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">Ref: Shipment #{rl.shipmentRef}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{rl.estimatedRevenue}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <MapPin size={12} className="text-red-400" /> {rl.distance}
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <ArrowRight size={12} /> {rl.destination}
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <Truck size={12} /> {rl.vehicleCapacity}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors">
                  <CheckCircle2 size={14} /> Approve & Assign
                </button>
                <button className="px-4 py-2.5 bg-black/[0.03] text-brand-muted rounded-xl text-sm font-medium hover:bg-black/[0.06] transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
