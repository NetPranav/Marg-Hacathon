"use client";

import Header from "@/components/dashboard/Header";
import ETACard from "@/components/cards/ETACard";
import MetricsGrid from "@/components/cards/MetricsGrid";
import EmergencyCTA from "@/components/dashboard/EmergencyCTA";
import JourneyActions from "@/components/dashboard/JourneyActions";
import MapContainer from "@/components/map/MapContainer";
import BottomNav from "@/components/navigation/BottomNav";
import { useRealtimeStore } from "@/store/realtimeStore";

export default function Dashboard() {
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  const currentShipment = activeShipments[0];
  
  // Map and active journey stuff should only be visible once in transit or arriving
  const showJourneyDetails = currentShipment?.status === "IN_TRANSIT" || currentShipment?.status === "APPROACHING_DESTINATION" || currentShipment?.status === "ARRIVED_AT_GATE";

  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-brand-bg relative overflow-hidden flex flex-col pt-2">
      <Header />
      
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        <ETACard />
        <JourneyActions />
        
        {showJourneyDetails ? (
          <>
            <MapContainer />
            <MetricsGrid />
            <EmergencyCTA />
          </>
        ) : (
          <div className="mx-6 p-6 text-center text-brand-muted bg-white border border-black/[0.05] rounded-3xl shadow-sm">
            <h3 className="font-bold text-brand-text mb-2">Awaiting Dispatch</h3>
            <p className="text-sm">Please verify the loading checklist and await Dock Approval to begin your journey.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
