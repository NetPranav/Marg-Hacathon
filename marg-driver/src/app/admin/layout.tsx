import AdminBottomNav from "@/components/admin/AdminBottomNav";
import AdminSidebar from "@/components/admin/AdminSidebar";
import HintManager from "@/components/admin/HintManager";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Desktop Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden pb-32 md:pb-6 pt-6 md:pl-[280px]">
        <div className="max-w-7xl mx-auto px-6">
          {children}
        </div>
      </div>

      {/* Mobile Navigation */}
      <AdminBottomNav />
      <HintManager />
    </div>
  );
}
