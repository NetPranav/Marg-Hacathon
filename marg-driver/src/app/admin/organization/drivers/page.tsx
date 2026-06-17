"use client";

import { useState, useEffect } from "react";
import { Plus, Search, UserPlus, Truck, KeyRound, Copy, CheckCircle2, X, Save, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

interface DriverAccount {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  employee_id?: string;
  license_number?: string;
  assigned_vehicle?: string;
  is_active: boolean;
}

export default function DriverAccountsPage() {
  const [drivers, setDrivers] = useState<DriverAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ username: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    employee_id: "",
    license_number: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const driversRes = await api.get("/drivers/");
      const driverList = Array.isArray(driversRes.data) ? driversRes.data : driversRes.data.results || [];
      setDrivers(driverList);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateUsername = (firstName: string, lastName: string) => {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s/g, "");
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "Drv@";
    for (let i = 0; i < 6; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    return password;
  };

  const handleCreate = async () => {
    setSaving(true);
    const username = generateUsername(form.first_name, form.last_name);
    const password = generatePassword();

    try {
      await api.post("/auth/provision/", {
        first_name: form.first_name,
        last_name: form.last_name,
        email: `${username}@driver.logimind.ai`,
        phone_number: form.phone,
        password,
        role: "DRIVER",
        license_number: form.license_number,
        employee_id: form.employee_id,
      });

      setCreatedCreds({ username, password });
      setShowForm(false);
      setForm({ first_name: "", last_name: "", phone: "", employee_id: "", license_number: "" });
      loadData();
    } catch (err) {
      console.error("Create driver error:", err);
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = () => {
    if (createdCreds) {
      navigator.clipboard.writeText(`Username: ${createdCreds.username}\nPassword: ${createdCreds.password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filtered = drivers.filter(
    (d: any) =>
      (d.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.user_phone || d.user_email || "").includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Driver Accounts</h1>
          <p className="text-sm text-brand-muted mt-1">{drivers.length} registered drivers</p>
        </div>
        <button
          onClick={() => { 
            setShowForm(true); 
            setCreatedCreds(null); 
            setForm(prev => ({ ...prev, employee_id: `drv-${drivers.length}` }));
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-[0_4px_12px_rgba(255,123,71,0.2)]"
        >
          <UserPlus size={15} /> Create Driver Account
        </button>
      </div>

      {/* Credentials Display */}
      {createdCreds && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">Driver Account Created!</h3>
            </div>
            <button onClick={() => setCreatedCreds(null)} className="p-1 hover:bg-emerald-100 rounded-lg"><X size={14} className="text-emerald-600" /></button>
          </div>
          <p className="text-sm text-emerald-700 mb-3">Share these credentials with the driver manually:</p>
          <div className="bg-white rounded-xl p-4 space-y-2 border border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-muted font-medium w-20">Email ID:</span>
              <code className="text-sm font-mono text-brand-text">{createdCreds.username}@driver.logimind.ai</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-muted font-medium w-20">Password:</span>
              <code className="text-sm font-mono text-brand-text">{showPassword ? createdCreds.password : "••••••••"}</code>
              <button onClick={() => setShowPassword(!showPassword)} className="p-1 hover:bg-black/5 rounded">
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
          <button
            onClick={copyCredentials}
            className="mt-3 flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition-colors"
          >
            {copied ? <><CheckCircle2 size={12} /> Copied!</> : <><Copy size={12} /> Copy Credentials</>}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drivers by name or phone..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
        />
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyRound size={16} className="text-brand-orange" />
              <h3 className="font-semibold text-brand-text">New Driver Account</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-black/5 rounded-lg"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "first_name", label: "Driver Name", placeholder: "Rajesh" },
              { key: "last_name", label: "Last Name", placeholder: "Kumar" },
              { key: "phone", label: "Phone Number", placeholder: "+91 9876543210" },
              { key: "employee_id", label: "Employee ID", placeholder: "EMP-001" },
              { key: "license_number", label: "License Number", placeholder: "MH1220210012345" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-muted mt-3 flex items-center gap-1.5">
            <KeyRound size={11} /> System will auto-generate username and temporary password.
          </p>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCreate}
              disabled={saving || !form.first_name || !form.last_name || !form.phone}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
            >
              <UserPlus size={15} /> {saving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </div>
      )}

      {/* Driver List */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-brand-muted text-sm">
            <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
            No driver accounts. Create the first driver account above!
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {filtered.map((d: any) => (
              <div key={d.id} className="px-5 py-4 flex items-center gap-4 hover:bg-black/[0.01] transition-colors">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center text-sm shrink-0">
                  {d.user_name ? d.user_name.substring(0, 2).toUpperCase() : "DR"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {d.user_name}
                    {d.employee_id && (
                      <span className="ml-2 text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        {d.employee_id}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">{d.user_phone || d.user_email}</p>
                </div>
                {d.assigned_vehicle && (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1 shrink-0">
                    <Truck size={10} /> {d.assigned_vehicle}
                  </span>
                )}
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${d.is_available !== false ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {d.is_available !== false ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
