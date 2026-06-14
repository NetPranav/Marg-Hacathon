import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from '@/theme/theme';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ShipmentsPage from '@/pages/ShipmentsPage';
import ShipmentDetailPage from '@/pages/ShipmentDetailPage';
import CreateShipmentPage from '@/pages/CreateShipmentPage';
import TrackingPage from '@/pages/TrackingPage';
import TrucksPage from '@/pages/TrucksPage';
import DriversPage from '@/pages/DriversPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import LogisticsDirectoryPage from '@/pages/LogisticsDirectoryPage';
import LogisticsChatPage from '@/pages/LogisticsChatPage';
import LotsPage from '@/pages/LotsPage';
import CreateLotPage from '@/pages/CreateLotPage';

// New workflow pages
import VerificationQueuePage from '@/pages/VerificationQueuePage';
import DraftShipmentsPage from '@/pages/DraftShipmentsPage';
import WarehouseRequestsPage from '@/pages/WarehouseRequestsPage';
import PendingApprovalsPage from '@/pages/PendingApprovalsPage';
import ConversationsPage from '@/pages/ConversationsPage';
import QuotationsPage from '@/pages/QuotationsPage';
import LoadingChecklistPage from '@/pages/LoadingChecklistPage';
import CompletedShipmentsPage from '@/pages/CompletedShipmentsPage';
import HistoricalShipmentsPage from '@/pages/HistoricalShipmentsPage';

// Final refinement pages
import DispatchCalendarPage from '@/pages/DispatchCalendarPage';
import ShipmentReadinessPage from '@/pages/ShipmentReadinessPage';
import ExceptionsPage from '@/pages/ExceptionsPage';
import LotTraceabilityPage from '@/pages/LotTraceabilityPage';

// Factory Organization
import FactoryRegisterPage from '@/pages/FactoryRegisterPage';
import EmployeesPage from '@/pages/EmployeesPage';
import OrganizationSettingsPage from '@/pages/OrganizationSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-factory" element={<FactoryRegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'FACTORY_MANAGER', 'DISPATCH_MANAGER', 'OPERATIONS_MANAGER', 'INVENTORY_MANAGER', 'FINANCE_MANAGER', 'READ_ONLY']}>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />

              {/* Dispatch Planning */}
              <Route path="lots" element={<LotsPage />} />
              <Route path="lots/new" element={<CreateLotPage />} />
              <Route path="verification-queue" element={<VerificationQueuePage />} />
              <Route path="draft-shipments" element={<DraftShipmentsPage />} />
              <Route path="dispatch-calendar" element={<DispatchCalendarPage />} />

              {/* Warehouse Coordination */}
              <Route path="warehouse-requests" element={<WarehouseRequestsPage />} />
              <Route path="pending-approvals" element={<PendingApprovalsPage />} />

              {/* Logistics Coordination */}
              <Route path="logistics" element={<LogisticsDirectoryPage />} />
              <Route path="logistics/chat/:id" element={<LogisticsChatPage />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="quotations" element={<QuotationsPage />} />

              {/* Dispatch Execution */}
              <Route path="loading-checklist/:id" element={<LoadingChecklistPage />} />
              <Route path="shipment-readiness" element={<ShipmentReadinessPage />} />
              <Route path="exceptions" element={<ExceptionsPage />} />

              {/* Shipment Operations */}
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route path="shipments/create" element={<CreateShipmentPage />} />
              <Route path="shipments/:id" element={<ShipmentDetailPage />} />
              <Route path="tracking" element={<TrackingPage />} />
              <Route path="completed-shipments" element={<CompletedShipmentsPage />} />
              <Route path="lot-traceability" element={<LotTraceabilityPage />} />

              {/* Analytics & Reports */}
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="historical-shipments" element={<HistoricalShipmentsPage />} />

              {/* Organization */}
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="settings" element={<OrganizationSettingsPage />} />

              {/* Other */}
              <Route path="trucks" element={<TrucksPage />} />
              <Route path="drivers" element={<DriversPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
