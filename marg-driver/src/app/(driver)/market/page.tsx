import MarketHeader from "@/components/marketplace/MarketHeader";
import SearchZoneCard from "@/components/marketplace/SearchZoneCard";
import MarketFeed from "@/components/marketplace/MarketFeed";
import BottomNav from "@/components/navigation/BottomNav";

export default function MarketPage() {
  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-brand-bg relative overflow-hidden flex flex-col pt-2">
      <MarketHeader />
      
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar pt-2">
        <SearchZoneCard />
        <MarketFeed />
      </div>

      <BottomNav />
    </main>
  );
}
