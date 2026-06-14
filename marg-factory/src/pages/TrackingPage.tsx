import React from 'react';
import { Box, Card, CardContent, Typography, Chip, List, ListItemButton, ListItemText } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { dashboardApi, telemetryApi } from '@/api/endpoints';
import { STATUS_COLORS } from '@/theme/statusColors';
import 'leaflet/dist/leaflet.css';

// Orange truck icon
const truckIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function TrackingPage() {
  const { data: trucksData } = useQuery({
    queryKey: ['transit-trucks'],
    queryFn: () => dashboardApi.getTransitTrucks(),
    refetchInterval: 15000,
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ['transit-shipments'],
    queryFn: () => dashboardApi.getTransitShipments(),
    refetchInterval: 15000,
  });

  const trucks = trucksData?.data?.data ?? [];
  const shipments = shipmentsData?.data?.data ?? [];
  const trucksWithLocation = trucks.filter((t: any) => t.location);

  // Default center: India
  const center: [number, number] = trucksWithLocation.length > 0
    ? [trucksWithLocation[0].location.latitude, trucksWithLocation[0].location.longitude]
    : [20.5937, 78.9629];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Live Tracking</Typography>
      <Grid container spacing={2.5}>
        {/* Map */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 520 }}>
              <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://osm.org">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {trucksWithLocation.map((t: any) => (
                  <Marker key={t.id} position={[t.location.latitude, t.location.longitude]} icon={truckIcon}>
                    <Popup>
                      <strong>{t.registration_number}</strong><br />
                      Driver: {t.driver || 'N/A'}<br />
                      Shipment: {t.shipment || 'None'}<br />
                      Speed: {t.location.speed} km/h
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Card>
        </Grid>

        {/* Shipment list */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: 520, overflow: 'auto' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>In-Transit Shipments ({shipments.length})</Typography>
              <List dense>
                {shipments.map((s: any) => {
                  const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.IN_TRANSIT;
                  return (
                    <ListItemButton key={s.id} sx={{ borderRadius: 1, mb: 0.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.shipment_number}</Typography>
                            <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontSize: '0.65rem', height: 20 }} />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>{s.factory} → {s.destination}</Typography>
                            {s.eta && (
                              <Typography variant="caption" sx={{ display: 'block', color: '#F97316', fontWeight: 600 }}>
                                ETA: {new Date(s.eta.predicted_eta).toLocaleTimeString()} ({s.eta.remaining_distance_km}km)
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  );
                })}
                {shipments.length === 0 && (
                  <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: '#9CA3AF' }}>
                    No shipments in transit
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
