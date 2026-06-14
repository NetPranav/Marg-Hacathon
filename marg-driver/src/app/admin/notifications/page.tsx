"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle2, Package, Truck, AlertTriangle, MessageSquare, Clock } from "lucide-react";
import api from "@/lib/api";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setNotifications(list);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/`, { is_read: true });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const getIcon = (type: string) => {
    const map: Record<string, any> = {
      SHIPMENT: Package,
      FLEET: Truck,
      ALERT: AlertTriangle,
      MESSAGE: MessageSquare,
    };
    return map[type] || Bell;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Notifications</h1>
        <p className="text-sm text-brand-muted mt-1">{notifications.filter((n) => !n.is_read).length} unread</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-brand-muted text-sm">
            <Bell size={32} className="mx-auto mb-2 opacity-30" />
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.03]">
            {notifications.map((n) => {
              const Icon = getIcon(n.notification_type || "");
              return (
                <div key={n.id} className={`px-5 py-4 flex items-start gap-3 hover:bg-black/[0.01] transition-colors ${!n.is_read ? "bg-blue-50/30" : ""}`}>
                  <div className="w-9 h-9 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"} text-brand-text`}>{n.title || n.message}</p>
                    {n.body && <p className="text-xs text-brand-muted mt-0.5">{n.body}</p>}
                    <p className="text-xs text-brand-muted flex items-center gap-1 mt-1">
                      <Clock size={10} /> {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markAsRead(n.id)} className="p-1 hover:bg-black/5 rounded-lg text-brand-muted shrink-0" title="Mark read">
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
