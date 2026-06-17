"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, Calendar, Weight, ArrowRight, FileText, X as XIcon, Send, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function MarketplaceRequestsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", transit_time: "", conditions: "" });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const res = await api.get("/shipments/lots/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      // Show lots that are available for bidding
      setShipments(list.filter((s: any) => s.status !== "ACCEPTED"));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleIgnore = (id: number) => {
    setShipments(shipments.filter(s => s.id !== id));
  };

  const handleSubmitQuote = async () => {
    if (!selectedShipment) return;
    setSubmitting(true);
    try {
      await api.post(`/shipments/lots/${selectedShipment.id}/submit-quote/`, {
        bid_amount: quoteForm.price,
        estimated_delivery_hours: parseInt(quoteForm.transit_time) || 24,
        notes: `Conditions: ${quoteForm.conditions}`
      });
      // Remove the shipment from the list locally
      setShipments(shipments.filter(s => s.id !== selectedShipment.id));
      setSelectedShipment(null);
      setQuoteForm({ price: "", transit_time: "", conditions: "" });
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Available Requests</h1>
        <p className="text-sm text-brand-muted mt-1">Browse transportation requirements from factories and submit quotations</p>
      </div>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-brand-text mb-1">No Available Requests</p>
          <p>New transportation requests from factories will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {shipments.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-black/[0.04] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-brand-text">Shipment #{s.tracking_number || s.id}</h3>
                  <p className="text-xs text-brand-muted mt-0.5">{s.status}</p>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">Open</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <MapPin size={13} className="text-emerald-500 shrink-0" />
                  <span className="truncate">Pickup: {s.origin_name || s.factory_name || "Factory"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-brand-muted">
                  <MapPin size={13} className="text-red-400 shrink-0" />
                  <span className="truncate">Destination: {s.destination_name || s.warehouse_name || "Warehouse"}</span>
                </div>
                <div className="flex items-center gap-3">
                  {s.total_weight && (
                    <span className="flex items-center gap-1 text-xs text-brand-muted"><Weight size={11} />{s.total_weight} kg</span>
                  )}
                  {s.created_at && (
                    <span className="flex items-center gap-1 text-xs text-brand-muted"><Calendar size={11} />{new Date(s.created_at).toLocaleDateString()}</span>
                  )}
                </div>
                {s.parcels?.some((p: any) => p.is_fragile) && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">⚠ Fragile items included</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedShipment(s)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors"
                >
                  <FileText size={14} /> Submit Quote
                </button>
                <button
                  onClick={() => router.push(`/admin/marketplace/requests/${s.id}/workflow`)}
                  className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} /> Workflow
                </button>
                <button 
                  onClick={() => handleIgnore(s.id)}
                  className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XIcon size={14} /> Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedShipment(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-text">Submit Quotation</h3>
              <button onClick={() => setSelectedShipment(null)} className="p-1 hover:bg-black/5 rounded-lg"><XIcon size={16} /></button>
            </div>

            <div className="bg-brand-bg rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-brand-text">Shipment #{selectedShipment.tracking_number || selectedShipment.id}</p>
              <div className="flex items-center gap-2 text-xs text-brand-muted mt-1">
                <span>{selectedShipment.origin_name || "Factory"}</span>
                <ArrowRight size={10} />
                <span>{selectedShipment.destination_name || "Warehouse"}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Price (₹)</label>
                <input type="number" value={quoteForm.price} onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })} placeholder="25000" className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
              </div>
              <div>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Estimated Transit Time (hours)</label>
                <input type="number" value={quoteForm.transit_time} onChange={(e) => setQuoteForm({ ...quoteForm, transit_time: e.target.value })} placeholder="12" className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
              </div>
              <div>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Special Conditions</label>
                <textarea value={quoteForm.conditions} onChange={(e) => setQuoteForm({ ...quoteForm, conditions: e.target.value })} placeholder="Any special conditions or notes..." rows={3} className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setSelectedShipment(null)} className="flex-1 py-2.5 bg-gray-100 text-brand-muted rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSubmitQuote} disabled={submitting || !quoteForm.price} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50">
                <Send size={14} /> {submitting ? "Submitting..." : "Submit Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
