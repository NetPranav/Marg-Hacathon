import CargoHeader from "@/components/cargo/CargoHeader";
import ManifestSummary from "@/components/cargo/ManifestSummary";
import LedgerCard from "@/components/cargo/LedgerCard";
import WeightProfileCard from "@/components/cargo/WeightProfileCard";
import ComplianceDocs from "@/components/cargo/ComplianceDocs";
import PoDCapture from "@/components/cargo/PoDCapture";
import BottomNav from "@/components/navigation/BottomNav";

export default function CargoPage() {
  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-[#FDF5F1] relative overflow-hidden flex flex-col pt-2">
      <CargoHeader />
      
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar pt-2">
        <ManifestSummary />
        <LedgerCard />
        <WeightProfileCard />
        <ComplianceDocs />
        <PoDCapture />
      </div>

      <BottomNav />
    </main>
  );
}
