"use client";

import { useState, useEffect, useRef } from "react";
import { Handshake, Send, Search, Package, Factory, X as XIcon, FileText } from "lucide-react";
import api from "@/lib/api";

export default function NegotiationsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ price: "", hours: "", conditions: "" });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    loadRooms(); 
    // Set up polling
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const res = await api.get("/logistics/chatrooms/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setRooms(list);
      
      // Update selectedConvo if it's currently open
      setSelectedConvo((prev: any) => {
        if (!prev) return null;
        const updated = list.find((r: any) => r.id === prev.id);
        return updated || prev;
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const selectConversation = async (id: number) => {
    const convo = rooms.find((c) => c.id === id);
    setSelectedConvo(convo);
    try {
      await api.post(`/logistics/chatrooms/${id}/mark-read/`);
      loadRooms(); // Refresh the read status locally
    } catch (err) {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedConvo) {
      scrollToBottom();
      api.post(`/logistics/chatrooms/${selectedConvo.id}/mark-read/`).catch(() => {});
    }
  }, [selectedConvo?.messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo) return;
    try {
      const res = await api.post("/logistics/messages/", {
        room: selectedConvo.id,
        text: newMessage,
        is_from_logistics: true,
      });
      // Optimistic update
      const updatedMessages = [...(selectedConvo.messages || []), res.data];
      const updatedConvo = { ...selectedConvo, messages: updatedMessages };
      setSelectedConvo(updatedConvo);
      setRooms(rooms.map(r => r.id === updatedConvo.id ? updatedConvo : r));
      setNewMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  const submitQuote = async () => {
    if (!selectedConvo || !quoteForm.price || !quoteForm.hours) return;
    setSubmittingQuote(true);
    try {
      await api.post("/logistics/quotes/", {
        room: selectedConvo.id,
        price: quoteForm.price,
        estimated_delivery_hours: quoteForm.hours,
        number_of_vehicles: 1,
        special_conditions: quoteForm.conditions,
      });
      // Send an automated chat message that a quote was submitted
      await api.post("/logistics/messages/", {
        room: selectedConvo.id,
        text: `We have submitted a formal quote of ₹${quoteForm.price} for ${quoteForm.hours} hours.`,
        is_from_logistics: true,
      });
      setShowQuoteModal(false);
      setQuoteForm({ price: "", hours: "", conditions: "" });
      loadRooms(); // Refresh to see the new message
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const filteredConvos = rooms.filter((c) =>
    (c.factory_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.lot_number || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading && rooms.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text">Active Negotiations</h1>
        <p className="text-sm text-brand-muted mt-1">Chat seamlessly with factories regarding active lot requests</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/[0.04] overflow-hidden flex" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
        {/* Conversation List */}
        <div className={`${selectedConvo ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-black/[0.04]`}>
          <div className="p-3 border-b border-black/[0.04]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search factory or lot..." className="w-full pl-9 pr-3 py-2 bg-brand-bg border border-black/[0.04] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConvos.length === 0 ? (
              <div className="p-6 text-center text-brand-muted text-xs">
                <Handshake size={24} className="mx-auto mb-2 opacity-30" />No active negotiations.
              </div>
            ) : filteredConvos.map((c) => {
              const messages = c.messages || [];
              const lastMsg = messages[messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-black/[0.02] hover:bg-black/[0.01] transition-colors ${selectedConvo?.id === c.id ? "bg-brand-orange/5 border-l-2 border-l-brand-orange" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-brand-text flex items-center gap-1.5">
                        <Factory size={12} className="text-brand-orange" /> {c.factory_name}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5 truncate max-w-[180px]">
                        {lastMsg ? lastMsg.text : `Lot: ${c.lot_number}`}
                      </p>
                    </div>
                    {lastMsg && (
                      <span className="text-[10px] text-brand-muted shrink-0">
                        {new Date(lastMsg.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${selectedConvo ? "flex" : "hidden md:flex"} flex-col flex-1 bg-brand-bg/30`}>
          {!selectedConvo ? (
            <div className="flex-1 flex items-center justify-center text-brand-muted text-sm">
              <div className="text-center">
                <Handshake size={40} className="mx-auto mb-3 opacity-20" />
                <p>Select a factory negotiation to begin</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-white px-5 py-3.5 border-b border-black/[0.04] flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedConvo(null)} className="md:hidden p-1.5 hover:bg-black/5 rounded-lg text-brand-muted"><XIcon size={16} /></button>
                  <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange">
                    <Factory size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{selectedConvo.factory_name}</p>
                    <p className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5"><Package size={10} /> Lot: {selectedConvo.lot_number}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {(selectedConvo.messages || []).map((msg: any) => {
                  const isOwn = msg.is_from_logistics;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] ${isOwn ? "bg-brand-orange text-white" : "bg-white border border-black/[0.05] text-brand-text shadow-sm"} px-4 py-3 ${isOwn ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}>
                        {!isOwn && <p className="text-[10px] font-bold mb-1 opacity-60 uppercase tracking-wider">{selectedConvo.factory_name}</p>}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[9px] mt-1.5 text-right ${isOwn ? "text-white/70" : "text-brand-muted"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white px-4 py-3 border-t border-black/[0.04] shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium text-sm flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FileText size={16} /> Submit Quote
                  </button>
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-brand-bg border border-black/[0.04] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all"
                  />
                  <button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim()} 
                    className="px-5 py-3 bg-brand-orange text-white rounded-xl hover:bg-brand-orange/90 transition-all disabled:opacity-40 disabled:hover:bg-brand-orange active:scale-95 flex items-center justify-center shadow-md shadow-brand-orange/20"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteModal && selectedConvo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowQuoteModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-text">Submit Formal Quote</h3>
              <button onClick={() => setShowQuoteModal(false)} className="p-1 hover:bg-black/5 rounded-lg"><XIcon size={16} /></button>
            </div>

            <div className="bg-brand-bg rounded-xl p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-orange/10 rounded-lg flex items-center justify-center text-brand-orange">
                <Factory size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-text">{selectedConvo.factory_name}</p>
                <p className="text-[10px] text-brand-muted">Lot Number: {selectedConvo.lot_number}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Price (₹)</label>
                <input type="number" value={quoteForm.price} onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })} placeholder="50000" className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
              </div>
              <div>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Estimated Transit Time (hours)</label>
                <input type="number" value={quoteForm.hours} onChange={(e) => setQuoteForm({ ...quoteForm, hours: e.target.value })} placeholder="24" className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30" />
              </div>
              <div>
                <label className="text-xs text-brand-muted font-medium uppercase tracking-wider">Special Conditions</label>
                <textarea value={quoteForm.conditions} onChange={(e) => setQuoteForm({ ...quoteForm, conditions: e.target.value })} placeholder="Any special conditions or notes..." rows={3} className="w-full mt-1 px-3 py-2 bg-brand-bg border border-black/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/30 resize-none" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowQuoteModal(false)} className="flex-1 py-2.5 bg-gray-100 text-brand-muted rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={submitQuote} disabled={submittingQuote || !quoteForm.price || !quoteForm.hours} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                <FileText size={14} /> {submittingQuote ? "Submitting..." : "Send Formal Quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
