"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin, Truck, Phone, Mail, Edit2, Save, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export default function CompanyProfilePage() {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    registration_number: "",
    coverage_regions: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    loadOrgData();
  }, []);

  const loadOrgData = async () => {
    try {
      const res = await api.get("/organizations/");
      const orgs = Array.isArray(res.data) ? res.data : res.data.results || [];
      if (orgs.length > 0) {
        const org = orgs[0];
        setOrgData(org);
        setForm({
          name: org.name || "",
          registration_number: org.metadata?.registration_number || org.registration_number || org.gst_number || "",
          coverage_regions: org.metadata?.coverage_regions || org.coverage_regions || "Pan-India",
          phone: org.phone_number || org.phone || "",
          email: org.email || "",
          address: org.address || org.metadata?.company_address || "",
        });
      }
    } catch (err) {
      // Use user data as fallback
      setForm((prev) => ({ ...prev, name: user?.organization_name || "" }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (orgData?.id) {
        await api.patch(`/organizations/${orgData.id}/`, {
          name: form.name,
          phone_number: form.phone,
          email: form.email,
          address: form.address,
          metadata: {
            ...(orgData.metadata || {}),
            registration_number: form.registration_number,
            coverage_regions: form.coverage_regions,
          }
        });
      }
      setEditing(false);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "name", label: "Company Name", icon: Building2 },
    { key: "registration_number", label: "Registration Number", icon: Building2 },
    { key: "coverage_regions", label: "Coverage Regions", icon: MapPin },
    { key: "phone", label: "Contact Phone", icon: Phone },
    { key: "email", label: "Contact Email", icon: Mail },
    { key: "address", label: "Address", icon: MapPin },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Company Profile</h1>
          <p className="text-sm text-brand-muted mt-1">Manage your logistics company details</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-[0_4px_12px_rgba(255,123,71,0.2)]"
          >
            <Edit2 size={15} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 text-brand-muted rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <X size={15} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-[0_4px_12px_rgba(255,123,71,0.2)] disabled:opacity-50"
            >
              <Save size={15} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Company Logo / Avatar */}
      <div className="bg-white rounded-2xl p-6 border border-black/[0.04] flex items-center gap-5">
        <div className="w-20 h-20 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-brand-orange shrink-0">
          {form.name ? form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "LC"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-brand-text">{form.name || "Your Logistics Company"}</h2>
          <p className="text-sm text-brand-muted mt-0.5">Logistics Service Provider</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Active</span>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
              <Truck size={10} /> Fleet Partner
            </span>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-black/[0.04] divide-y divide-black/[0.03]">
        {fields.map((field) => {
          const Icon = field.icon;
          const value = form[field.key as keyof typeof form];

          return (
            <div key={field.key} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 bg-black/[0.03] rounded-lg flex items-center justify-center shrink-0">
                <Icon size={16} className="text-brand-muted" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">{field.label}</label>
                {editing ? (
                  <input
                    value={value}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full mt-1 text-sm text-brand-text bg-brand-bg border border-black/[0.06] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                  />
                ) : (
                  <p className="text-sm font-medium text-brand-text mt-0.5">{value || "—"}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
