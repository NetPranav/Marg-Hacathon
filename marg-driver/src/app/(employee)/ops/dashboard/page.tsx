'use client';

import { useAuthStore } from '@/store/authStore';
import { LogOut, QrCode, ScanLine, Clock, Box, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function OpsDashboard() {
  const { user, logout } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    // Fetch shipments pending loading or assignment for tasks
    const fetchTasks = async () => {
      try {
        const res = await api.get('/shipments/');
        // Filter to items needing ops attention
        const pending = res.data.filter((s: any) => 
          s.status === 'READY_FOR_ASSIGNMENT' || s.status === 'LOADING'
        );
        setTasks(pending);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-surface rounded-[1.2rem] shadow-soft border border-black/[0.03] flex items-center justify-center text-xl font-bold text-brand-orange">
            {user?.first_name?.[0]}
          </div>
          <div>
            <p className="text-sm text-brand-muted font-medium">Hello,</p>
            <h1 className="text-xl font-bold text-brand-text tracking-tight">{user?.first_name} {user?.last_name}</h1>
          </div>
        </div>
        <button 
          onClick={() => logout()}
          className="w-12 h-12 bg-brand-surface rounded-[1.2rem] shadow-soft border border-black/[0.03] flex items-center justify-center text-brand-muted hover:bg-black/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scanner CTA */}
      <div className="bg-brand-orange rounded-[2rem] p-6 shadow-[0_15px_40px_rgba(255,123,71,0.25)] flex items-center justify-between relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h2 className="text-white text-2xl font-bold mb-1">Scan Gate Pass</h2>
          <p className="text-white/80 text-sm font-medium">Verify incoming fleet & cargo</p>
        </div>
        <button className="w-14 h-14 bg-white text-brand-orange rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform relative z-10 shrink-0">
          <ScanLine className="w-6 h-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Pending Tasks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-brand-text">Action Items</h3>
          <span className="bg-brand-surface border border-black/[0.03] px-3 py-1 rounded-full text-xs font-bold text-brand-orange shadow-sm">
            {tasks.length} Pending
          </span>
        </div>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-brand-surface border border-black/[0.03] rounded-[1.5rem] p-8 text-center shadow-soft">
              <ClipboardCheck className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <p className="text-brand-text font-bold">All caught up!</p>
              <p className="text-sm text-brand-muted mt-1">No pending operations.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="bg-brand-surface border border-black/[0.03] rounded-[1.5rem] p-5 shadow-soft flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      task.status === 'READY_FOR_ASSIGNMENT' ? 'bg-orange-100 text-brand-orange' : 'bg-blue-100 text-blue-500'
                    }`}>
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-text text-[15px]">SHP-{task.id.toString().padStart(4, '0')}</h4>
                      <p className="text-xs font-medium text-brand-muted mt-0.5">{task.shipment_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-brand-muted text-xs font-semibold bg-brand-bg px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    2h left
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/[0.03]">
                  <p className="text-[13px] font-semibold text-brand-text">
                    {task.status === 'READY_FOR_ASSIGNMENT' ? 'Awaiting Truck Assignment' : 'Verify Loading Manifest'}
                  </p>
                  <button className="w-8 h-8 bg-brand-bg rounded-full flex items-center justify-center text-brand-text hover:bg-black/5 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Dock Status Mini Widget */}
      <div className="bg-brand-surface border border-black/[0.03] rounded-[1.5rem] p-5 shadow-soft">
        <h3 className="text-sm font-bold text-brand-text mb-4 uppercase tracking-wider text-brand-muted">Dock Availability</h3>
        <div className="flex gap-2">
          {[1,2,3,4].map(dock => (
            <div key={dock} className={`flex-1 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
              dock === 2 ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' : 'bg-brand-bg text-brand-muted'
            }`}>
              D{dock}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
import { ClipboardCheck } from 'lucide-react';
