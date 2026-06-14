"use client";

import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import api from "@/lib/api";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      const res = await api.get("/logistics/quotes/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setQuotations(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  const counts = {
    Pending: quotations.filter(q => q.status === 'PENDING').length,
    Accepted: quotations.filter(q => q.status === 'ACCEPTED').length,
    Rejected: quotations.filter(q => q.status === 'REJECTED').length,
    Revision_Requested: quotations.filter(q => q.status === 'REVISION_REQUESTED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Quotations</h1>
        <p className="text-sm text-brand-muted mt-1">Track your submitted quotations and their status</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: counts.Pending, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Accepted", value: counts.Accepted, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Rejected", value: counts.Rejected, icon: XCircle, color: "bg-red-50 text-red-500" },
          { label: "Revision Requested", value: counts.Revision_Requested, icon: RefreshCw, color: "bg-blue-50 text-blue-600" },
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

      {/* Quotation List */}
      {quotations.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-brand-text mb-1">No Quotations Yet</p>
          <p>Submit quotes from the Available Requests page to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotations.map((quote: any) => (
            <div key={quote.id} className="bg-white p-5 rounded-2xl border border-black/[0.04] shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Quote #{quote.id}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                  quote.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' :
                  quote.status === 'REJECTED' ? 'bg-red-50 text-red-500' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {quote.status}
                </span>
              </div>
              <div className="mb-4">
                <div className="text-sm text-brand-muted mb-1">Offered Price</div>
                <div className="text-2xl font-bold text-brand-text">₹{quote.price || '0'}</div>
              </div>
              <div className="text-xs text-brand-muted mt-4 pt-4 border-t border-black/[0.04]">
                Submitted on: {new Date(quote.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
