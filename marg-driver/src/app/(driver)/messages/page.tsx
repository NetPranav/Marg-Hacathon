"use client";

import BottomNav from "@/components/navigation/BottomNav";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRealtimeStore } from "@/store/realtimeStore";

export default function MessagesPage() {
  const driverMessages = useRealtimeStore((state) => state.driverMessages) || [];
  const addDriverMessage = useRealtimeStore((state) => state.addDriverMessage);
  
  const [messages, setMessages] = useState(driverMessages);
  
  // Sync when store updates (from admin side)
  useEffect(() => {
    setMessages(driverMessages);
  }, [driverMessages]);

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

  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = { id: Date.now().toString(), text: inputText, sender: "driver", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    addDriverMessage(newMsg);
    setInputText("");
  };

  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-brand-bg relative flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm z-10 sticky top-0">
        <Link href="/" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Logistics Manager</h1>
          <p className="text-xs text-green-600 font-medium">Online</p>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-40 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'driver' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'driver' ? 'bg-[#C15B2B] text-white rounded-br-sm shadow-glow' : 'bg-white shadow-soft text-gray-800 rounded-bl-sm border border-black/[0.05]'}`}>
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              <p className={`text-[9px] mt-2 font-bold tracking-widest uppercase ${msg.sender === 'driver' ? 'text-white/70' : 'text-gray-400'}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-[104px] left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-40">
        <div className="bg-white p-2 rounded-[2rem] shadow-soft border border-black/[0.05] flex gap-2 items-center">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Message Dispatch..." 
            className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm font-medium text-brand-text placeholder:text-gray-400"
          />
          <button onClick={handleSend} className="w-12 h-12 bg-[#C15B2B] rounded-full flex items-center justify-center text-white shadow-md flex-shrink-0 hover:bg-[#9C3600] transition-colors">
            <Send size={18} className="mr-0.5" />
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
