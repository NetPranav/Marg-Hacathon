'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RealtimeState {
  isConnected: boolean;
  activeShipments: any[];
  telemetryStream: Record<string, any>; // dict of truck_id -> coords
  notifications: any[];
  
  setConnected: (status: boolean) => void;
  updateShipment: (data: any) => void;
  updateTelemetry: (data: any) => void;
  addNotification: (data: any) => void;
  
  driverMessages: any[];
  addDriverMessage: (msg: any) => void;
}

export const useRealtimeStore = create<RealtimeState>()(
  persist(
    (set) => ({
      isConnected: false,
      activeShipments: [],
      telemetryStream: {},
      notifications: [],
      driverMessages: [
        { id: "1", text: "Truck has been loaded. Gate pass issued.", sender: "logistics", time: "10:30 AM" }
      ],

      setConnected: (status) => set({ isConnected: status }),

      updateShipment: (data) => set((state) => {
        const idx = state.activeShipments.findIndex(s => s.id === data.id);
        if (idx >= 0) {
          const newShipments = [...state.activeShipments];
          newShipments[idx] = { ...newShipments[idx], ...data };
          return { activeShipments: newShipments };
        }
        return { activeShipments: [data, ...state.activeShipments] };
      }),

      updateTelemetry: (data) => set((state) => ({
        telemetryStream: {
          ...state.telemetryStream,
          [data.truck_id]: data
        }
      })),

      addNotification: (data) => set((state) => ({
        notifications: [data, ...state.notifications]
      })),

      addDriverMessage: (msg) => set((state) => ({
        driverMessages: [...state.driverMessages, msg]
      })),
    }),
    {
      name: 'logimind-realtime-storage',
      // Only persist the driverMessages to avoid breaking other realtime states across reloads
      partialize: (state) => ({ driverMessages: state.driverMessages }),
    }
  )
);
