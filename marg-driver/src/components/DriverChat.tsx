'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

interface Message {
  id: number;
  content: string;
  sender_name?: string;
  message_type: 'TEXT' | 'SYSTEM';
  created_at: string;
}

export default function DriverChat({ shipmentId }: { shipmentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch/mock
    setMessages([
      { id: 1, content: 'Chat room connected for coordination.', message_type: 'SYSTEM', created_at: new Date().toISOString() }
    ]);
  }, [shipmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: Message = {
      id: Date.now(),
      content: input,
      sender_name: 'Me',
      message_type: 'TEXT',
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-indigo-600 p-3 text-white font-semibold">
        Coordination Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map(msg => {
          if (msg.message_type === 'SYSTEM') {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="bg-slate-200 text-slate-600 text-xs px-3 py-1 rounded-full font-medium">
                  {msg.content}
                </span>
              </div>
            );
          }
          const isMe = msg.sender_name === 'Me';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && <span className="text-xs text-slate-400 ml-1 mb-0.5">{msg.sender_name}</span>}
              <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none shadow-sm'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 bg-white border-t border-slate-200 flex gap-2">
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none"
          placeholder="Message warehouse..."
        />
        <button onClick={handleSend} disabled={!input.trim()} className="bg-indigo-600 text-white w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50">
          ➤
        </button>
      </div>
    </div>
  );
}
