"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Mail, Phone, User, X, Save, Trash2 } from "lucide-react";
import api from "@/lib/api";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  department?: string;
  role: string;
  is_active: boolean;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", department: "", role: "EMPLOYEE" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await api.get("/users/");
      const users = Array.isArray(res.data) ? res.data : res.data.results || [];
      setEmployees(users.filter((u: any) => u.role !== "DRIVER"));
    } catch (err) {
      console.error("Load employees error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setSaving(true);
    try {
      await api.post("/auth/provision/", {
        ...form,
        phone_number: form.phone,
        password: "Temp@" + Math.random().toString(36).slice(2, 8),
      });
      setShowForm(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "", department: "", role: "EMPLOYEE" });
      loadEmployees();
    } catch (err) {
      console.error("Add employee error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await api.patch(`/users/${id}/`, { is_active: false });
      loadEmployees();
    } catch (err) {
      console.error("Deactivate error:", err);
    }
  };

  const filtered = employees.filter(
    (e) =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="text-2xl font-bold text-brand-text">Employees</h1>
          <p className="text-sm text-brand-muted mt-1">{employees.length} team members</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-[0_4px_12px_rgba(255,123,71,0.2)]"
        >
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
        />
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-text">New Employee</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-black/5 rounded-lg"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "first_name", label: "First Name", placeholder: "John" },
              { key: "last_name", label: "Last Name", placeholder: "Doe" },
              { key: "email", label: "Email", placeholder: "john@company.com" },
              { key: "phone", label: "Phone", placeholder: "+91 9876543210" },
              { key: "department", label: "Department", placeholder: "Operations" },
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
            <div>
              <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAdd}
              disabled={saving || !form.first_name || !form.email}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50"
            >
              <Save size={15} /> {saving ? "Adding..." : "Add Employee"}
            </button>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-brand-muted text-sm">
            <User size={32} className="mx-auto mb-2 opacity-30" />
            No employees found. Add your first team member!
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {filtered.map((emp) => (
              <div key={emp.id} className="px-5 py-4 flex items-center gap-4 hover:bg-black/[0.01] transition-colors">
                <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange font-bold rounded-xl flex items-center justify-center text-sm shrink-0">
                  {emp.first_name?.[0]}{emp.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">
                    {emp.first_name} {emp.last_name}
                    {!emp.is_active && <span className="ml-2 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Inactive</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-brand-muted flex items-center gap-1"><Mail size={10} />{emp.email}</span>
                    {emp.phone && <span className="text-xs text-brand-muted flex items-center gap-1"><Phone size={10} />{emp.phone}</span>}
                  </div>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 shrink-0">
                  {emp.role}
                </span>
                {emp.is_active && (
                  <button
                    onClick={() => handleDeactivate(emp.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-brand-muted hover:text-red-500 transition-colors"
                    title="Deactivate"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
