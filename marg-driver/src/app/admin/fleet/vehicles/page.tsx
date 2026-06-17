"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Truck, X, Save, MapPin, Package, Fuel, Calendar, Pencil, Trash2, User } from "lucide-react";
import api from "@/lib/api";

const STATUS_OPTIONS = ["AVAILABLE", "ASSIGNED", "IN_TRANSIT", "UNDER_MAINTENANCE"];
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-600",
  ASSIGNED: "bg-blue-50 text-blue-600",
  IN_TRANSIT: "bg-violet-50 text-violet-600",
  UNDER_MAINTENANCE: "bg-amber-50 text-amber-600",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form, setForm] = useState({
    registration_number: "", vehicle_type: "TRUCK", capacity_tons: "",
    fuel_type: "DIESEL", assigned_driver: "", status: "AVAILABLE",
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [trucksRes, driversRes] = await Promise.allSettled([
        api.get("/trucks/"),
        api.get("/drivers/"),
      ]);
      const truckList = trucksRes.status === "fulfilled" ? (Array.isArray(trucksRes.value.data) ? trucksRes.value.data : trucksRes.value.data.results || []) : [];
      const driverList = driversRes.status === "fulfilled" ? (Array.isArray(driversRes.value.data) ? driversRes.value.data : driversRes.value.data.results || []) : [];
      setVehicles(truckList);
      setDrivers(driverList);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        registration_number: form.registration_number,
        vehicle_type: form.vehicle_type,
        capacity_kg: (parseFloat(form.capacity_tons) || 10) * 1000,
        status: form.status,
        ...(form.assigned_driver ? { assigned_driver: parseInt(form.assigned_driver) } : { assigned_driver: null }),
      };
      if (editingId) {
        await api.patch(`/trucks/${editingId}/`, payload);
      } else {
        await api.post("/trucks/", payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ registration_number: "", vehicle_type: "TRUCK", capacity_tons: "", fuel_type: "DIESEL", assigned_driver: "", status: "AVAILABLE" });
      loadData();
    } catch (err) { console.error("Save vehicle error:", err); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    try {
      await api.delete(`/trucks/${id}/`);
      loadData();
    } catch (err) { console.error("Delete vehicle error:", err); }
  };

  const handleEdit = (vehicle: any) => {
    setForm({
      registration_number: vehicle.registration_number || "",
      vehicle_type: vehicle.vehicle_type || "TRUCK",
      capacity_tons: vehicle.capacity_kg ? (vehicle.capacity_kg / 1000).toString() : "",
      fuel_type: vehicle.fuel_type || "DIESEL",
      assigned_driver: vehicle.assigned_driver ? vehicle.assigned_driver.toString() : "",
      status: vehicle.status || "AVAILABLE",
    });
    setEditingId(vehicle.id);
    setShowForm(true);
  };

  const filtered = vehicles.filter((v) => {
    const matchSearch = (v.registration_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || (v.status || "AVAILABLE") === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = vehicles.filter((v) => (v.status || "AVAILABLE") === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Vehicles</h1>
          <p className="text-sm text-brand-muted mt-1">{vehicles.length} vehicles in fleet</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ registration_number: "", vehicle_type: "TRUCK", capacity_tons: "", fuel_type: "DIESEL", assigned_driver: "", status: "AVAILABLE" }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors shadow-[0_4px_12px_rgba(255,123,71,0.2)]">
          <Plus size={15} /> Add Vehicle
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === "ALL" ? "bg-brand-orange text-white" : "bg-white text-brand-muted border border-black/[0.06] hover:bg-black/[0.02]"}`}
        >All ({vehicles.length})</button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? "bg-brand-orange text-white" : "bg-white text-brand-muted border border-black/[0.06] hover:bg-black/[0.02]"}`}
          >{s.replace(/_/g, " ")} ({statusCounts[s] || 0})</button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by vehicle number..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-brand-text flex items-center gap-2"><Truck size={16} className="text-brand-orange" /> {editingId ? "Edit Vehicle" : "New Vehicle"}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-black/5 rounded-lg"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Vehicle Number</label>
              <input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} placeholder="MH12AB4582" className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
            </div>
            <div>
              <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Vehicle Type</label>
              <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30">
                <option value="TRUCK">Truck</option><option value="TRAILER">Trailer</option><option value="TANKER">Tanker</option><option value="MINI_TRUCK">Mini Truck</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Capacity (Tons)</label>
              <input type="number" value={form.capacity_tons} onChange={(e) => setForm({ ...form, capacity_tons: e.target.value })} placeholder="20" className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
            </div>
            <div>
              <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Assigned Driver</label>
              <select value={form.assigned_driver} onChange={(e) => setForm({ ...form, assigned_driver: e.target.value })} className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30">
                <option value="">Unassigned</option>
                {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.user_name || `Driver #${d.id}`}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={handleSave} disabled={saving || !form.registration_number} className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-orange text-white rounded-xl text-sm font-medium hover:bg-brand-orange/90 transition-colors disabled:opacity-50">
              <Save size={15} /> {saving ? "Saving..." : (editingId ? "Save Changes" : "Add Vehicle")}
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-10 text-center text-brand-muted text-sm bg-white rounded-2xl border border-black/[0.04]">
            <Truck size={32} className="mx-auto mb-2 opacity-30" />No vehicles found.
          </div>
        ) : filtered.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl p-5 border border-black/[0.04] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Truck size={18} /></div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[v.status || "AVAILABLE"]}`}>
                  {(v.status || "AVAILABLE").replace(/_/g, " ")}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
            <h3 className="font-semibold text-brand-text">{v.registration_number || v.vehicle_number || `Vehicle #${v.id}`}</h3>
            <p className="text-xs text-brand-muted mt-0.5">{v.vehicle_type || "Truck"}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-brand-muted"><Package size={11} /> Capacity: {v.capacity_kg ? (v.capacity_kg / 1000) : "—"} T</div>
              <div className="flex items-center gap-2 text-xs text-brand-muted"><Fuel size={11} /> {v.fuel_type || "Diesel"}</div>
              {v.assigned_driver_name && <div className="flex items-center gap-2 text-xs text-brand-muted"><User size={11} /> {v.assigned_driver_name}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
