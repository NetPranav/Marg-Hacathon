"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { clsx } from "clsx";
import {
  LayoutDashboard, Building2, Users, UserPlus,
  Truck, Wrench, ShoppingCart, FileText, Handshake,
  MessageSquare, Factory, Warehouse,
  Navigation, MapPin, CalendarClock,
  Eye, RotateCcw,
  AlertTriangle, ShieldAlert,
  DollarSign, BarChart3, Star,
  Bell, LogOut, ChevronDown, Settings
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface NavItem {
  label: string;
  icon: any;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Company Profile", icon: Building2, href: "/admin/organization/profile" },
      { label: "Employees", icon: Users, href: "/admin/organization/employees" },
      { label: "Driver Accounts", icon: UserPlus, href: "/admin/organization/drivers" },
    ],
  },
  {
    title: "Fleet Operations",
    items: [
      { label: "Vehicles", icon: Truck, href: "/admin/fleet/vehicles" },
      { label: "Vehicle Maintenance", icon: Wrench, href: "/admin/fleet/maintenance" },
    ],
  },
  {
    title: "Shipment Marketplace",
    items: [
      { label: "Available Requests", icon: ShoppingCart, href: "/admin/marketplace/requests" },
      { label: "Quotations", icon: FileText, href: "/admin/marketplace/quotations" },
      { label: "Active Negotiations", icon: Handshake, href: "/admin/marketplace/negotiations" },
      { label: "Tie-Up Requests", icon: FileText, href: "/admin/shipments" },
    ],
  },
  {
    title: "Coordination Center",
    items: [
      { label: "Shipment Conversations", icon: MessageSquare, href: "/admin/coordination/conversations" },
      { label: "Factory Comms", icon: Factory, href: "/admin/coordination/factory" },
      { label: "Warehouse Comms", icon: Warehouse, href: "/admin/coordination/warehouse" },
    ],
  },
  {
    title: "Transit Operations",
    items: [
      { label: "Active Shipments", icon: Navigation, href: "/admin/transit/active" },
      { label: "Live Fleet Tracking", icon: MapPin, href: "/admin/transit/tracking" },
      { label: "Dock Reservations", icon: CalendarClock, href: "/admin/transit/docks" },
    ],
  },
  {
    title: "Driver Operations",
    items: [
      { label: "Driver Monitoring", icon: Eye, href: "/admin/driver-ops/monitoring" },
      { label: "Return Load Center", icon: RotateCcw, href: "/admin/driver-ops/return-loads" },
    ],
  },
  {
    title: "Exceptions",
    items: [
      { label: "Operational Alerts", icon: AlertTriangle, href: "/admin/exceptions/alerts" },
      { label: "Incident Management", icon: ShieldAlert, href: "/admin/exceptions/incidents" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Revenue Reports", icon: DollarSign, href: "/admin/analytics/revenue" },
      { label: "Utilization Reports", icon: BarChart3, href: "/admin/analytics/utilization" },
      { label: "Driver Performance", icon: Star, href: "/admin/analytics/drivers" },
    ],
  },
  {
    title: "",
    items: [
      { label: "Notifications", icon: Bell, href: "/admin/notifications" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [unreadNegotiations, setUnreadNegotiations] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/logistics/chatrooms/");
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        let count = 0;
        list.forEach((room: any) => {
          room.messages?.forEach((m: any) => {
            if (!m.is_from_logistics && !m.read) count++;
          });
        });
        setUnreadNegotiations(count);
      } catch (err) {}
    };
    if (user?.role === "ADMIN") {
      fetchUnread();
      const int = setInterval(fetchUnread, 10000);
      return () => clearInterval(int);
    }
  }, [user]);

  const toggleGroup = (title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="hidden md:flex flex-col w-[280px] bg-brand-surface border-r border-black/[0.03] fixed top-0 left-0 h-screen shadow-soft z-50">
      {/* Brand Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center">
            <Truck className="text-brand-orange w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-brand-text tracking-tight text-lg">Marg</h1>
            <p className="text-[10px] text-brand-muted uppercase tracking-widest font-semibold mt-0.5">Logistics Portal</p>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {navGroups.map((group, gi) => {
          const isCollapsed = group.title ? collapsed[group.title] : false;

          return (
            <div key={gi} className={clsx(group.title && "mt-4")}>
              {group.title && (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex items-center justify-between w-full px-2 mb-1"
                >
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-brand-muted">
                    {group.title}
                  </span>
                  <ChevronDown
                    size={12}
                    className={clsx(
                      "text-brand-muted transition-transform duration-200",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </button>
              )}

              {!isCollapsed && (
                <nav className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[13px] font-medium",
                          isActive
                            ? "bg-brand-orange text-white shadow-[0_4px_12px_rgba(255,123,71,0.2)]"
                            : "text-brand-muted hover:bg-black/[0.03] hover:text-brand-text"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                            <span>{item.label}</span>
                          </div>
                          {item.label === "Active Negotiations" && unreadNegotiations > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                              {unreadNegotiations}
                            </span>
                          )}
                          {item.label === "Shipment Conversations" && (
                            <span className="bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                              1 New
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="px-4 pb-4 pt-2 border-t border-black/[0.03]">
        <div className="bg-brand-bg rounded-xl p-3 flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-brand-orange/20 text-brand-orange font-bold flex items-center justify-center rounded-lg shrink-0 text-sm">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-brand-text truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] text-brand-muted truncate">{user?.organization_name || "Logistics Owner"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/settings" className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-brand-muted hover:bg-black/5 transition-colors text-sm font-medium">
            <Settings size={15} />
          </Link>
          <button
            onClick={() => logout()}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-red-500/70 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
