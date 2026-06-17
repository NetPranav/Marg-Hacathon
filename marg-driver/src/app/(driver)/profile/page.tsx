"use client";

import BottomNav from "@/components/navigation/BottomNav";
import { ArrowLeft, User, Truck, Shield, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useRealtimeStore } from "@/store/realtimeStore";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeShipments = useRealtimeStore((state) => state.activeShipments);
  
  const currentShipment = activeShipments[0];
  const truckReg = currentShipment?.truck_reg || "Not Assigned";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <main className="min-h-screen w-full max-w-md mx-auto bg-brand-bg relative flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 bg-white shadow-sm z-10 sticky top-0">
        <Link href="/" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Driver Profile</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar">
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-black/[0.03] flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-brand-primary/10 flex items-center justify-center mb-4">
            <User size={40} className="text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{user?.full_name || user?.first_name || "Driver Name"}</h2>
          <p className="text-gray-500 font-medium mb-4">{user?.email || "driver@logimind.com"}</p>
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
            Active Status
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-black/[0.03] mb-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Assigned Vehicle</p>
              <p className="text-lg font-bold text-gray-900">{truckReg}</p>
            </div>
          </div>
          <div className="w-full h-px bg-gray-100" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">KYC Status</p>
              <p className="text-lg font-bold text-gray-900">{user?.kyc_status?.replace('_', ' ') || "PENDING"}</p>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
