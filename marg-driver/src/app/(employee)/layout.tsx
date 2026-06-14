import OpsBottomNav from "@/components/ops/OpsBottomNav";

export default function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg relative pb-32">
      {/* Mobile-first layout for ops floor */}
      <div className="max-w-md mx-auto w-full pt-4 px-5">
        {children}
      </div>
      <OpsBottomNav />
    </div>
  );
}
