"use client";

import { Warehouse, ArrowRight } from "lucide-react";

export default function WarehouseCommsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Warehouse Communications</h1>
        <p className="text-sm text-brand-muted mt-1">Coordinate dock reservations and unloading with warehouses</p>
      </div>

      <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
        <Warehouse size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium text-brand-text mb-1">No Warehouse Conversations</p>
        <p className="mb-4">Warehouse communications will appear here when shipments are in transit.</p>
        <a href="/admin/coordination/conversations" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors">
          Go to All Conversations <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
