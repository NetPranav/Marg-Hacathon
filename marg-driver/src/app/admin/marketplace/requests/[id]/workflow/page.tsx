"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Lock, Truck, Package, Search, FileText, Rocket, MapPin, RefreshCw, Send, CircleDot } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import MapContainer from "@/components/map/MapContainer";

/* ── Status → Step mapping ─────────────────────────────────────── */
const STATUS_STEP_MAP: Record<string, number> = {
  DRAFT: 0,
  UNDER_REVIEW: 1,
  PENDING_WAREHOUSE_APPROVAL: 2,
  WAREHOUSE_REJECTED: 2,
  WAREHOUSE_APPROVED: 3,
  SHARED: 4,
  ACCEPTED: 5,
  SHIPMENT_GENERATED: 6,
  COMPLETED: 8,
};

const STEPS = [
  { label: "Lot Created by Factory", key: "draft", owner: "Factory" },
  { label: "Factory Verification", key: "verify", owner: "Factory" },
  { label: "Warehouse Approval", key: "warehouse", owner: "Warehouse" },
  { label: "Shared for Quotations", key: "partner_search", owner: "Factory" },
  { label: "Quote & Selection", key: "partner_select", owner: "Logistics", role: "LOGISTICS" },
  { label: "Shipment Generated", key: "shipment", owner: "Factory" },
  { label: "Driver Loading Verification", key: "checklist", owner: "Driver" },
  { label: "Dock Reservation", key: "dock_request", owner: "Logistics", role: "LOGISTICS" },
  { label: "Dock Approval", key: "dock_approve", owner: "Warehouse" },
  { label: "Dispatch", key: "dispatch", owner: "Driver" },
  { label: "Warehouse Receiving", key: "track", owner: "Warehouse" },
];

export default function LogisticsLotWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ price: "", transit_time: "", conditions: "" });
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [eta, setEta] = useState("");

  const [shipment, setShipment] = useState<any>(null);

  const handleRequestDock = async () => {
    setActionLoading(true);
    setError("");
    try {
      await api.post(`/shipments/${shipment.id}/request-dock/`, {
        requested_arrival_time: new Date(eta).toISOString()
      });
      setSuccess("Dock reservation requested.");
      await loadLot();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request dock.");
    } finally {
      setActionLoading(false);
    }
  };

  const loadLot = useCallback(async () => {
    try {
      const res = await api.get(`/shipments/lots/${id}/`);
      const lotData = res.data?.data ?? res.data;
      setLot(lotData);

      if (lotData.shipments && lotData.shipments.length > 0) {
        try {
          const shipRes = await api.get(`/shipments/${lotData.shipments[0].id ?? lotData.shipments[0]}/`);
          setShipment(shipRes.data?.data ?? shipRes.data);
        } catch { /* no shipment yet */ }
      }
    } catch { setError("Failed to load lot."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadLot(); }, [loadLot]);

  const currentStep = useMemo(() => {
    if (!lot) return 0;
    
    // Check shipment status for steps 6 to 10
    if (shipment) {
      if (['COMPLETED', 'SLOTTING_IN_PROGRESS', 'RECEIVING_IN_PROGRESS', 'ARRIVED_AT_GATE'].includes(shipment.status)) return 10; // Warehouse Receiving
      if (['IN_TRANSIT', 'APPROACHING_DESTINATION'].includes(shipment.status)) return 10; // Waiting for warehouse receiving
      if (shipment.status === 'DOCK_APPROVED') return 9; // Dispatch Shipment
      if (shipment.status === 'DOCK_REQUESTED') return 8; // Dock Approval
      if (shipment.status === 'READY_FOR_TRANSIT') return 7; // Dock Reservation
      if (shipment.status === 'LOADING_IN_PROGRESS') return 6; // Driver verifying
      if (shipment.status === 'READY_FOR_PICKUP' || shipment.status === 'DRIVER_ASSIGNED' || shipment.status === 'DRAFT') return 6;
    }
    if (lot.status === 'SHIPMENT_GENERATED') return 6;
    return STATUS_STEP_MAP[lot.status] ?? 0;
  }, [lot, shipment]);

  const parcels = lot?.parcels ?? [];
  const totalWeight = parcels.reduce((s: number, p: any) => s + (parseFloat(p.weight) * (p.quantity || 1)), 0);

  const handleSubmitQuote = async () => {
    setActionLoading(true); setError(""); setSuccess("");
    try {
      await api.post(`/shipments/lots/${id}/submit-quote/`, {
        bid_amount: quoteForm.price,
        estimated_delivery_hours: parseInt(quoteForm.transit_time) || 24,
        notes: quoteForm.conditions,
      });
      setSuccess("Quote submitted successfully!");
      setShowQuoteForm(false);
      setQuoteForm({ price: "", transit_time: "", conditions: "" });
      await loadLot();
    } catch (err: any) { setError(err.response?.data?.message || "Failed to submit quote."); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="p-10 text-center text-brand-muted">
        <p className="font-medium text-brand-text mb-2">Lot not found</p>
        <button onClick={() => router.push("/admin/marketplace/requests")} className="text-sm text-brand-orange">← Back to Requests</button>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    DRAFT: "Draft", UNDER_REVIEW: "Under Review", PENDING_WAREHOUSE_APPROVAL: "Awaiting Warehouse",
    WAREHOUSE_APPROVED: "Warehouse Approved", WAREHOUSE_REJECTED: "Warehouse Rejected",
    SHARED: "Awaiting Your Quote", ACCEPTED: "Your Quote Accepted", SHIPMENT_GENERATED: "Shipment Generated", COMPLETED: "Completed",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/marketplace/requests")} className="p-2 bg-white rounded-xl border border-black/[0.06] hover:bg-black/[0.02] transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-brand-text">{lot.lot_number}</h1>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              lot.status === "SHARED" ? "bg-amber-50 text-amber-600" :
              lot.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-600" :
              "bg-gray-100 text-gray-500"
            }`}>
              {statusLabel[lot.status] || lot.status}
            </span>
          </div>
          <p className="text-sm text-brand-muted mt-0.5 truncate">
            {lot.factory_name} → {lot.destination_name}
          </p>
        </div>
        <button onClick={loadLot} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-muted border border-black/[0.06] rounded-xl hover:bg-black/[0.02] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm flex items-center justify-between">
          {error} <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
          {success} <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">×</button>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-black/[0.04] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-brand-text">Order Progress</span>
          <span className="text-xs text-brand-muted font-semibold">Step {currentStep + 1} / {STEPS.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-orange to-orange-600 transition-all duration-500" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
        </div>
        {/* Step pills */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {STEPS.map((step, idx) => {
            const isYours = step.role === "LOGISTICS";
            return (
              <span key={step.key} className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap transition-colors ${
                idx < currentStep ? "bg-emerald-50 text-emerald-600" :
                idx === currentStep ? (isYours ? "bg-brand-orange/10 text-brand-orange ring-1 ring-brand-orange" : "bg-amber-50 text-amber-600 ring-1 ring-amber-300") :
                "bg-gray-50 text-gray-300"
              }`}>
                {isYours ? "⬤ " : ""}{step.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-black/[0.04] p-4 sm:p-6">
        <div className="space-y-0">
          {STEPS.map((step, idx) => {
            const isComplete = idx < currentStep;
            const isActive = idx === currentStep;
            const isLocked = idx > currentStep;
            const isYours = step.role === "LOGISTICS";

            return (
              <div key={step.key} className="relative">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className={`absolute left-[17px] top-[36px] w-0.5 ${isComplete ? "bg-emerald-200" : "bg-gray-100"}`} style={{ height: "calc(100% - 20px)" }} />
                )}

                <div className="flex gap-3 pb-5">
                  {/* Icon */}
                  <div className="shrink-0 z-10">
                    {isComplete ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      </div>
                    ) : isActive ? (
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
                        isYours ? "bg-gradient-to-br from-brand-orange to-orange-600" : "bg-gradient-to-br from-amber-400 to-amber-600"
                      }`}>
                        <CircleDot size={16} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <Lock size={14} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isComplete ? "text-emerald-600" : isActive ? "text-brand-text" : "text-gray-300"}`}>
                        {step.label}
                      </p>
                      {isYours && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange">Your Step</span>
                      )}
                      <span className="text-[10px] text-brand-muted">({step.owner})</span>
                    </div>

                    {/* Step body */}
                    {isLocked && (
                      <p className="text-xs text-gray-300 italic mt-1">Waiting for previous steps</p>
                    )}
                    {isComplete && (
                      <p className="text-xs text-emerald-500 font-medium mt-1">✓ Completed</p>
                    )}

                    {/* Active step content */}
                    {isActive && idx === 4 && isYours && (
                      <div className="mt-3 space-y-3">
                        <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-xl p-3">
                          <p className="text-sm font-semibold text-brand-orange mb-1">Action required!</p>
                          <p className="text-xs text-brand-muted">Submit a competitive quote for this lot. The factory will compare and select a partner.</p>
                        </div>
                        {/* Lot details */}
                        <div className="bg-gray-50 rounded-xl p-3 flex gap-4 flex-wrap text-xs">
                          <div><span className="text-brand-muted">Parcels</span><p className="font-bold text-brand-text">{parcels.length}</p></div>
                          <div><span className="text-brand-muted">Weight</span><p className="font-bold text-brand-text">{totalWeight.toFixed(1)} kg</p></div>
                          <div><span className="text-brand-muted">From</span><p className="font-bold text-brand-text">{lot.factory_name || "—"}</p></div>
                          <div><span className="text-brand-muted">Dispatch</span><p className="font-bold text-brand-text">{lot.expected_dispatch_date || "TBD"}</p></div>
                        </div>
                        {!showQuoteForm ? (
                          <button onClick={() => setShowQuoteForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors">
                            <FileText size={14} /> Submit Quote
                          </button>
                        ) : (
                          <div className="border border-black/[0.06] rounded-xl p-4 space-y-3">
                            <div>
                              <label className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider">Price (₹)</label>
                              <input type="number" value={quoteForm.price} onChange={(e) => setQuoteForm({...quoteForm, price: e.target.value})} placeholder="25000" className="w-full mt-1 px-3 py-2 bg-gray-50 border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
                            </div>
                            <div>
                              <label className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider">Transit Time (hours)</label>
                              <input type="number" value={quoteForm.transit_time} onChange={(e) => setQuoteForm({...quoteForm, transit_time: e.target.value})} placeholder="12" className="w-full mt-1 px-3 py-2 bg-gray-50 border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
                            </div>
                            <div>
                              <label className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider">Conditions</label>
                              <textarea value={quoteForm.conditions} onChange={(e) => setQuoteForm({...quoteForm, conditions: e.target.value})} placeholder="Special conditions..." rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setShowQuoteForm(false)} className="flex-1 py-2 bg-gray-100 text-brand-muted rounded-xl text-sm font-medium">Cancel</button>
                              <button onClick={handleSubmitQuote} disabled={actionLoading || !quoteForm.price} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-orange text-white rounded-xl text-sm font-medium disabled:opacity-50">
                                <Send size={13} /> {actionLoading ? "Submitting..." : "Submit"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isActive && idx === 7 && isYours && (
                      <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4 border border-black/[0.06]">
                        <p className="text-xs text-brand-muted mb-2">Driver has verified loading. Request a dock from the warehouse based on Estimated Time of Arrival (ETA).</p>
                        <div>
                          <label className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider">Estimated Time of Arrival</label>
                          <input type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
                        </div>
                        <button onClick={handleRequestDock} disabled={actionLoading || !eta} className="w-full flex justify-center py-2 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50">
                          {actionLoading ? "Requesting..." : "Request Dock Reservation"}
                        </button>
                      </div>
                    )}

                    {(isActive || currentStep > idx) && (idx === 9 || idx === 10) && (
                      <div className="mt-3 space-y-2">
                        {isActive && (
                          <div className="mt-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl flex items-start gap-3">
                            <MapPin className="text-[#3B82F6] shrink-0" />
                            <div>
                              <p className="font-semibold text-[#1E3A8A]">In Transit</p>
                              <p className="text-sm text-[#1E3A8A]/70">The shipment is on its way to the warehouse. Track progress live.</p>
                            </div>
                          </div>
                        )}
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold mb-2 text-gray-700">Live Tracking Location</h4>
                          <div className="relative">
                            <MapContainer />
                          </div>
                        </div>
                        <button onClick={() => router.push("/admin/transit/active")} className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                          <MapPin size={14} /> View Fleet Dashboard
                        </button>
                      </div>
                    )}

                    {/* Generic active waiting */}
                    {isActive && !isYours && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-brand-muted">Waiting for {step.owner} to complete this step…</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
