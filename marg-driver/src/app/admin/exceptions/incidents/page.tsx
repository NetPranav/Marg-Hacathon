"use client";

import { ShieldAlert, Plus, Calendar, User, FileText } from "lucide-react";

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Incident Management</h1>
          <p className="text-sm text-brand-muted mt-1">Track and manage operational incidents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-[0_4px_12px_rgba(255,123,71,0.2)]">
          <Plus size={15} /> Report Incident
        </button>
      </div>

      <div className="bg-white rounded-2xl p-10 text-center text-brand-muted text-sm border border-black/[0.04]">
        <ShieldAlert size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium text-brand-text mb-1">No Incidents Reported</p>
        <p>Incident reports from drivers, warehouse exceptions, and system-detected issues will appear here.</p>
      </div>
    </div>
  );
}
