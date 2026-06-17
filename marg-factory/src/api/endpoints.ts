import client from './client';

export const authApi = {
  login: (email: string, password: string) =>
    client.post('/auth/login/', { email, password }),

  refreshToken: (refresh: string) =>
    client.post('/auth/refresh/', { refresh }),

  getProfile: () => client.get('/auth/me/'),
};

export const dashboardApi = {
  getFactoryDashboard: () => client.get('/dashboard/factory/'),
  getTransitLive: () => client.get('/transit/live/'),
  getTransitShipments: () => client.get('/transit/shipments/'),
  getTransitTrucks: () => client.get('/transit/trucks/'),
};

export const shipmentsApi = {
  list: (params?: Record<string, unknown>) => client.get('/shipments/', { params }),
  get: (id: number) => client.get(`/shipments/${id}/`),
  create: (data: Record<string, unknown>) => client.post('/shipments/', data),
  update: (id: number, data: Record<string, unknown>) => client.patch(`/shipments/${id}/`, data),
  timeline: (id: number) => client.get(`/shipments/${id}/timeline/`),
  eta: (id: number) => client.get(`/shipments/${id}/eta/`),
  transitions: (id: number) => client.get(`/shipments/${id}/transitions/`),
  assignTruck: (id: number, truckId: number) =>
    client.post(`/shipments/${id}/assign-truck/`, { truck_id: truckId }),
  assignDriver: (id: number, driverId: number) =>
    client.post(`/shipments/${id}/assign-driver/`, { driver_id: driverId }),
  reserveDock: (id: number, dockId: number) =>
    client.post(`/shipments/${id}/reserve-dock/`, { dock_id: dockId }),
  markLoadingComplete: (id: string) => client.post(`/shipments/${id}/mark-loading-complete/`),
  dispatch: (id: number) => client.post(`/shipments/${id}/dispatch/`),
  cancel: (id: number, reason: string) =>
    client.post(`/shipments/${id}/cancel/`, { reason }),
};

export const fleetApi = {
  listTrucks: (params?: Record<string, unknown>) => client.get('/trucks/', { params }),
  listDrivers: (params?: Record<string, unknown>) => client.get('/drivers/', { params }),
  listWarehouses: () => client.get('/warehouses/global-registry/'),
  listDocks: () => client.get('/docks/'),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => client.get('/notifications/', { params }),
  markRead: (id: number) => client.post(`/notifications/${id}/mark-read/`),
  markAllRead: () => client.post('/notifications/mark-all-read/'),
  unreadCount: () => client.get('/notifications/unread-count/'),
};

export const telemetryApi = {
  latest: () => client.get('/telemetry/latest/'),
  history: (shipmentId: number) => client.get('/telemetry/history/', { params: { shipment_id: shipmentId } }),
};

export const optimizationApi = {
  returnLoads: (params?: Record<string, unknown>) => client.get('/return-loads/', { params }),
  dockRecommendations: (params?: Record<string, unknown>) => client.get('/dock-recommendations/', { params }),
};

export const lotsApi = {
  list: (params?: Record<string, unknown>) => client.get('/shipments/lots/', { params }),
  get: (id: number) => client.get(`/shipments/lots/${id}/`),
  create: (data: Record<string, unknown>) => client.post('/shipments/lots/', data),
  update: (id: number, data: Record<string, unknown>) => client.patch(`/shipments/lots/${id}/`, data),
  delete: (id: number) => client.delete(`/shipments/lots/${id}/`),
};

export const logisticsApi = {
  listCompanies: (params?: Record<string, unknown>) => client.get('/logistics/companies/', { params }),
  listChatRooms: (params?: Record<string, unknown>) => client.get('/logistics/chatrooms/', { params }),
  getChatRoom: (id: number) => client.get(`/logistics/chatrooms/${id}/`),
  createChatRoom: (data: Record<string, unknown>) => client.post('/logistics/chatrooms/', data),
  sendMessage: (data: Record<string, unknown>) => client.post('/logistics/messages/', data),
  markReadChat: (id: number) => client.post(`/logistics/chatrooms/${id}/mark-read/`),
  acceptQuote: (quoteId: number) => client.post(`/logistics/quotes/${quoteId}/accept/`),
  rejectQuote: (quoteId: number) => client.post(`/logistics/quotes/${quoteId}/reject/`),
};
