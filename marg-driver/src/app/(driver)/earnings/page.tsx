import EarningsHeader from "@/components/earnings/EarningsHeader";
import PerformanceDashboard from "@/components/earnings/PerformanceDashboard";
import PendingSettlement from "@/components/earnings/PendingSettlement";
import TripHistory from "@/components/earnings/TripHistory";
import BottomNav from "@/components/navigation/BottomNav";

export default function EarningsPage() {
  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-[#FDF5F1] relative overflow-hidden flex flex-col pt-2">
      <EarningsHeader />
      
      <div className="flex-1 overflow-y-auto pt-2 no-scrollbar">
        <PerformanceDashboard />
        <PendingSettlement />
        <TripHistory />
      </div>

      <BottomNav />
    </main>
  );
}
