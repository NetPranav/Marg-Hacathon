import Header from "@/components/dashboard/Header";
import ETACard from "@/components/cards/ETACard";
import MetricsGrid from "@/components/cards/MetricsGrid";
import EmergencyCTA from "@/components/dashboard/EmergencyCTA";
import JourneyActions from "@/components/dashboard/JourneyActions";
import MapContainer from "@/components/map/MapContainer";
import BottomNav from "@/components/navigation/BottomNav";

export default function Dashboard() {
  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-brand-bg relative overflow-hidden flex flex-col pt-2">
      <Header />
      
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        <ETACard />
        <JourneyActions />
        <MapContainer />
        <MetricsGrid />
        <EmergencyCTA />
      </div>

      <BottomNav />
    </main>
  );
}
