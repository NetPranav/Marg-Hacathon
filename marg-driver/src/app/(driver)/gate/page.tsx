"use client";

import Header from "@/components/dashboard/Header";
import GeofenceStatus from "@/components/gate/GeofenceStatus";
import QRCard from "@/components/qr/QRCard";
import PayloadPanel from "@/components/qr/PayloadPanel";
import DockAllocation from "@/components/gate/DockAllocation";
import LiveQueue from "@/components/gate/LiveQueue";
import BottomNav from "@/components/navigation/BottomNav";
import { useRealtimeStore } from "@/store/realtimeStore";

export default function GatePage() {
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  const currentShipment = activeShipments[0];

  const payloadData = {
    manifestId: currentShipment?.shipment_number || "Loading...",
    vehicleMatch: currentShipment?.truck_reg || "Loading...",
    destination: currentShipment?.assigned_dock ? `WH-DOCK-${currentShipment.assigned_dock.name}` : "Pending Assignment"
  };
  
  const qrPayload = JSON.stringify(payloadData);

  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-brand-bg relative overflow-hidden flex flex-col pt-2">
      <Header statusText="Gate Sync Active" statusColorClass="bg-brand-cyan" />
      
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar pt-2">
        <GeofenceStatus state="allocated" />
        
        <QRCard payload={qrPayload} />
        
        <PayloadPanel data={payloadData} />
        
        <DockAllocation assignedDockName={currentShipment?.assigned_dock?.name} />
        
        <LiveQueue 
          trucksAhead={6}
          estWaitMin={12}
          progressPercent={65}
        />
      </div>

      <BottomNav />
    </main>
  );
}
