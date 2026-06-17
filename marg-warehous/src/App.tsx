import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterWarehousePage from '@/pages/RegistrationFlow/RegisterWarehousePage';
import DashboardPage from '@/pages/DashboardPage';
import IncomingShipmentsPage from '@/pages/IncomingShipmentsPage';
import ShipmentDetailPage from '@/pages/ShipmentDetailPage';
import InboundYardPage from '@/pages/InboundYardPage';
import StorageOptimizationPage from '@/pages/StorageOptimizationPage';
import SLALedgerPage from '@/pages/SLALedgerPage';
import { Box, CircularProgress, Typography, alpha } from '@mui/material';

// New placeholders (will be implemented)
const ArrivalSchedulePage = lazy(() => import('@/pages/ArrivalSchedulePage'));
const WarehouseApprovalsPage = lazy(() => import('@/pages/WarehouseApprovalsPage'));
const GateCheckInPage = lazy(() => import('@/pages/GateCheckInPage'));
const ReceivingChecklistPage = lazy(() => import('@/pages/ReceivingChecklistPage'));
const ExceptionsPage = lazy(() => import('@/pages/ExceptionsPage'));
const ShipmentConversationsPage = lazy(() => import('@/pages/ShipmentConversationsPage'));
const InventoryPlacementPage = lazy(() => import('@/pages/InventoryPlacementPage'));
const ParcelLocatorPage = lazy(() => import('@/pages/ParcelLocatorPage'));
const ForwardingQueuePage = lazy(() => import('@/pages/ForwardingQueuePage'));
const OutboundPlanningPage = lazy(() => import('@/pages/OutboundPlanningPage'));
const NextWarehousePage = lazy(() => import('@/pages/NextWarehousePage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));

const DockAssignmentPage = lazy(() => import('@/pages/DockAssignmentPage'));

const SlottingPage = lazy(() => import('@/pages/SlottingPage'));

const WarehouseLotWorkflowPage = lazy(() => import('@/pages/WarehouseLotWorkflowPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function TwinLoader() {
  return (
    <Box sx={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 2,
      bgcolor: '#0F172A',
    }}>
      <Box sx={{
        width: 56, height: 56, borderRadius: '16px',
        background: 'linear-gradient(135deg, #E8700A 0%, #8B3A0E 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 32px ${alpha('#E8700A', 0.3)}`,
      }}>
        <CircularProgress size={28} sx={{ color: '#fff' }} />
      </Box>
      <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>
        Loading 3D Warehouse...
      </Typography>
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterWarehousePage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<IncomingShipmentsPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="inbound-yard" element={<InboundYardPage />} />
        <Route path="storage-optimization" element={<StorageOptimizationPage />} />
        <Route path="sla-ledger" element={<SLALedgerPage />} />
        
        {/* New Workflow Routes wrapped in Suspense */}
        <Route path="arrival-schedule" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><ArrivalSchedulePage /></Suspense>} />
        <Route path="warehouse-approvals" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><WarehouseApprovalsPage /></Suspense>} />
        <Route path="warehouse-approvals/:id/workflow" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><WarehouseLotWorkflowPage /></Suspense>} />
        
        {/* Dock Operations (Existing inbound-yard + new) */}
        <Route path="dock-assignment" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><DockAssignmentPage /></Suspense>} />

        <Route path="gate-checkin" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><GateCheckInPage /></Suspense>} />
        <Route path="receiving-checklist/:id" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><ReceivingChecklistPage /></Suspense>} />
        <Route path="exceptions" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><ExceptionsPage /></Suspense>} />
        <Route path="conversations" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><ShipmentConversationsPage /></Suspense>} />

        <Route path="inventory-placement" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><InventoryPlacementPage /></Suspense>} />
        <Route path="parcel-locator" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><ParcelLocatorPage /></Suspense>} />

        <Route path="forwarding-queue" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><ForwardingQueuePage /></Suspense>} />
        <Route path="outbound-planning" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><OutboundPlanningPage /></Suspense>} />
        <Route path="next-warehouse" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><NextWarehousePage /></Suspense>} />

        <Route path="analytics" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><AnalyticsPage /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<CircularProgress sx={{ m: 4 }}/>}><NotificationsPage /></Suspense>} />
      </Route>
      <Route
        path="digital-twin"
        element={
          <ProtectedRoute>
            <Suspense fallback={<TwinLoader />}>
              <SlottingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="warehouse-3d/:lotId"
        element={
          <ProtectedRoute>
            <Suspense fallback={<TwinLoader />}>
              <SlottingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {/* Redirect old routes to new ones */}
      <Route path="docks" element={<Navigate to="/inbound-yard" replace />} />
      <Route path="recommendations" element={<Navigate to="/inbound-yard" replace />} />
      <Route path="detention" element={<Navigate to="/sla-ledger" replace />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
