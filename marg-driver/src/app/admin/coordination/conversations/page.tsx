"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Package, Users, Clock, Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { useRealtimeStore } from "@/store/realtimeStore";

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
  isSystem: boolean;
}

interface Conversation {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  participants: string[];
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { loadShipments(); }, []);

  const loadShipments = async () => {
    try {
      const res = await api.get("/shipments/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setShipments(list);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'logimind-realtime-storage') {
        useRealtimeStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const conversations: Conversation[] = shipments.map((s) => ({
    id: s.id.toString(),
    shipmentId: s.id,
    trackingNumber: s.tracking_number || `SH-${s.id}`,
    participants: ["Factory", "Warehouse", "Driver"],
    lastMessage: `Shipment ${s.status?.toLowerCase().replace(/_/g, " ")}`,
    lastTime: s.updated_at || s.created_at || new Date().toISOString(),
    unread: 0,
  }));

  const filteredConvos = conversations.filter((c) =>
    c.trackingNumber.toLowerCase().includes(search.toLowerCase())
  );

  const driverMessages = useRealtimeStore((state) => state.driverMessages) || [];
  const addDriverMessage = useRealtimeStore((state) => state.addDriverMessage);

  const selectConversation = (id: string) => {
    setSelectedConvo(id);
  };

  useEffect(() => {
    if (selectedConvo) {
      // Map shared store driverMessages to Admin message format
      const mapped = driverMessages.map((m: any) => ({
        id: m.id,
        sender: m.sender === "driver" ? "Driver" : "Logistics Admin",
        content: m.text,
        time: new Date().toISOString(), // Using current for mock, normally parse m.time
        isOwn: m.sender === "logistics",
        isSystem: false,
      }));
      
      const convo = conversations.find((c) => c.id === selectedConvo);
      
      setMessages([
        { id: "sys-1", sender: "System", content: `Conversation started for Shipment ${convo?.trackingNumber || 'Active'}`, time: new Date().toISOString(), isOwn: false, isSystem: true },
        ...mapped
      ]);
    }
  }, [selectedConvo, driverMessages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMsg = { 
      id: Date.now().toString(), 
      text: newMessage, 
      sender: "logistics", 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    addDriverMessage(newMsg);
    setNewMessage("");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Shipment Conversations</h1>
        <p className="text-sm text-brand-muted mt-1">Collaborate with factories, warehouses, and drivers on active shipments</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
        {/* Conversation List */}
        <div className={`${selectedConvo ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-black/[0.04]`}>
          <div className="p-3 border-b border-black/[0.04]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shipments..." className="w-full pl-9 pr-3 py-2 bg-brand-bg border border-black/[0.04] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConvos.length === 0 ? (
              <div className="p-6 text-center text-brand-muted text-xs">
                <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />No conversations yet.
              </div>
            ) : filteredConvos.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-black/[0.02] hover:bg-black/[0.01] transition-colors ${selectedConvo === c.id ? "bg-brand-orange/5 border-l-2 border-l-brand-orange" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-text flex items-center gap-1.5">
                      <Package size={12} className="text-brand-orange" /> {c.trackingNumber}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5 truncate max-w-[180px]">{c.lastMessage}</p>
                  </div>
                  <span className="text-[10px] text-brand-muted shrink-0">
                    {new Date(c.lastTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Users size={10} className="text-brand-muted" />
                  <span className="text-[10px] text-brand-muted">{c.participants.join(", ")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedConvo ? "flex" : "hidden md:flex"} flex-col flex-1`}>
          {!selectedConvo ? (
            <div className="flex-1 flex items-center justify-center text-brand-muted text-sm">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                <p>Select a shipment conversation to begin</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-black/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedConvo(null)} className="md:hidden p-1 mr-1 hover:bg-black/5 rounded-lg text-brand-muted">←</button>
                  <Package size={16} className="text-brand-orange" />
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{conversations.find((c) => c.id === selectedConvo)?.trackingNumber}</p>
                    <p className="text-[10px] text-brand-muted">Factory • Warehouse • Driver</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? "justify-end" : msg.isSystem ? "justify-center" : "justify-start"}`}>
                    {msg.isSystem ? (
                      <div className="bg-black/[0.03] px-3 py-1.5 rounded-full text-[10px] text-brand-muted">{msg.content}</div>
                    ) : (
                      <div className={`max-w-[70%] ${msg.isOwn ? "bg-brand-orange text-white" : "bg-brand-bg text-brand-text"} rounded-2xl px-4 py-2.5 ${msg.isOwn ? "rounded-br-md" : "rounded-bl-md"}`}>
                        {!msg.isOwn && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.sender}</p>}
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[9px] mt-1 ${msg.isOwn ? "text-white/60" : "text-brand-muted"}`}>
                          {new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="px-4 py-3 border-t border-black/[0.04]">
                <div className="flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-brand-bg border border-black/[0.04] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                  />
                  <button onClick={sendMessage} disabled={!newMessage.trim()} className="px-4 py-2.5 bg-brand-orange text-white rounded-xl hover:bg-brand-orange/90 transition-colors disabled:opacity-40">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
