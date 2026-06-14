'use client';

import { Settings, Building2, Key, Bell, Save } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="w-full pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-text tracking-tight mb-2">Platform Settings</h1>
          <p className="text-brand-muted font-medium">Manage your organization's configuration and preferences.</p>
        </div>
        <button className="bg-brand-text text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-orange transition-colors flex items-center gap-2">
          <Save className="w-5 h-5" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Organization Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-brand-surface rounded-[2rem] border border-black/[0.03] shadow-soft overflow-hidden">
            <div className="p-6 border-b border-black/[0.03] flex items-center gap-3">
              <Building2 className="w-5 h-5 text-brand-orange" />
              <h2 className="font-bold text-lg text-brand-text">Organization Details</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6 bg-brand-bg/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Company Name</label>
                  <input type="text" defaultValue="Marg Logistics Pvt Ltd" className="w-full bg-white px-4 py-3 rounded-xl text-sm font-semibold border border-black/[0.05] focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Registration Number</label>
                  <input type="text" defaultValue="CIN-U60232MH2024PTC123456" className="w-full bg-white px-4 py-3 rounded-xl text-sm font-semibold border border-black/[0.05] focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">HQ Address</label>
                  <textarea rows={3} defaultValue="123, Logistics Park, Pune-Mumbai Highway, Maharashtra, 411033" className="w-full bg-white px-4 py-3 rounded-xl text-sm font-semibold border border-black/[0.05] focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 transition-all resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* API Integrations */}
          <div className="bg-brand-surface rounded-[2rem] border border-black/[0.03] shadow-soft overflow-hidden">
            <div className="p-6 border-b border-black/[0.03] flex items-center gap-3">
              <Key className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-lg text-brand-text">API & Integrations</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6 bg-brand-bg/30">
              <p className="text-sm text-brand-muted mb-4 font-medium">Generate API keys to integrate Marg OS with your custom ERP or telematics software.</p>
              <div>
                <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Production API Key</label>
                <div className="flex gap-3">
                  <input type="password" value="sk_live_1234567890abcdef" readOnly className="flex-1 bg-black/5 px-4 py-3 rounded-xl text-sm font-mono border-none focus:outline-none" />
                  <button className="bg-white border border-black/10 px-4 py-3 rounded-xl font-bold text-sm hover:bg-black/5 transition-colors">Regenerate</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Sidebar */}
        <div className="space-y-8">
          <div className="bg-brand-surface rounded-[2rem] border border-black/[0.03] shadow-soft overflow-hidden">
            <div className="p-6 border-b border-black/[0.03] flex items-center gap-3">
              <Bell className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-lg text-brand-text">Notifications</h2>
            </div>
            <div className="p-6 bg-brand-bg/30 space-y-6">
              {[
                { label: 'New Marketplace Bids', desc: 'When a new open market load is available', checked: true },
                { label: 'Driver Delays', desc: 'When ETA drops below threshold', checked: true },
                { label: 'Payment Settlements', desc: 'When a shipment is fully paid', checked: false },
                { label: 'Daily Reports', desc: 'Receive morning digest emails', checked: true },
              ].map((pref, i) => (
                <div key={i} className="flex items-start gap-4">
                  <input type="checkbox" defaultChecked={pref.checked} className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                  <div>
                    <div className="font-bold text-sm text-brand-text">{pref.label}</div>
                    <div className="text-xs text-brand-muted font-medium">{pref.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
