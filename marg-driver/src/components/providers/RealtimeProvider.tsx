'use client';

import { useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import Cookies from 'js-cookie';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/dashboard/';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const setConnected = useRealtimeStore((state) => state.setConnected);
  const updateShipment = useRealtimeStore((state) => state.updateShipment);
  const updateTelemetry = useRealtimeStore((state) => state.updateTelemetry);
  const addNotification = useRealtimeStore((state) => state.addNotification);

  // We append token in URL for auth during connection (Django Channels auth helper needs to read this or headers)
  // For standard channels we might just rely on cookies, but WS cross-origin cookies can be tricky.
  const token = Cookies.get('access_token');
  const wsUrl = isAuthenticated && token ? `${WS_URL}?token=${token}` : null;

  const { lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    setConnected(readyState === ReadyState.OPEN);
  }, [readyState, setConnected]);

  useEffect(() => {
    if (lastJsonMessage) {
      const msg = lastJsonMessage as any;
      switch (msg.type) {
        case 'shipment_update':
          updateShipment(msg.data);
          break;
        case 'telemetry_update':
          updateTelemetry(msg.data);
          break;
        case 'notification_push':
          addNotification(msg.data);
          break;
        case 'connection_established':
          console.log('[WS] Connected to groups:', msg.groups);
          break;
        default:
          console.log('[WS] Unhandled message:', msg);
      }
    }
  }, [lastJsonMessage, updateShipment, updateTelemetry, addNotification]);

  return <>{children}</>;
}
