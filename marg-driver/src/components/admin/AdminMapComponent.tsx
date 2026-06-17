"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import { Crosshair, Navigation } from "lucide-react";
import { useRealtimeStore } from "@/store/realtimeStore";
import api from "@/lib/api";
import L from "leaflet";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// India center (Between Mumbai and Dewas)
const centerPos: [number, number] = [21.0, 74.5]; 

const createDotIcon = (color: string, size: number = 20) => {
  return L.divIcon({
    className: "custom-dot-icon",
    html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border: 4px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.2);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapControls() {
  const map = useMap();
  
  return (
    <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
      <button 
        onClick={() => map.flyTo(centerPos, 6)}
        className="w-12 h-12 bg-brand-surface rounded-[1rem] flex items-center justify-center shadow-soft text-brand-text hover:bg-black/5 transition-colors border border-black/[0.03]"
      >
        <Crosshair size={20} />
      </button>
    </div>
  );
}

export default function AdminMapComponent() {
  const telemetryStream = useRealtimeStore((state) => state.telemetryStream);
  const activeShipments = useRealtimeStore((state) => state.activeShipments);

  // Initialize with seed data locations for fallback
  const [trucks, setTrucks] = useState<Record<string, {lat: number, lng: number, status: string}>>({
    "TRK-SEED": { lat: 19.5, lng: 73.5, status: "IN_TRANSIT" }
  });

  useEffect(() => {
    if (Object.keys(telemetryStream).length > 0) {
      setTrucks((prev) => {
        const next = { ...prev };
        Object.entries(telemetryStream).forEach(([id, data]) => {
          next[id] = { lat: data.latitude, lng: data.longitude, status: 'IN_TRANSIT' };
        });
        return next;
      });
    }
  }, [telemetryStream]);

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [originData, setOriginData] = useState({ lat: 19.0760, lng: 72.8777, name: "Mumbai Plant (Origin)" });
  const [destData, setDestData] = useState({ lat: 22.9676, lng: 76.0534, name: "Pranav (Dewas) (Destination)" });

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        let oLat = 19.0760, oLng = 72.8777, oName = "Mumbai Plant (Origin)";
        let dLat = 22.9676, dLng = 76.0534, dName = "Pranav (Dewas) (Destination)";

        try {
          const res = await api.get('/shipments/');
          const list = Array.isArray(res.data) ? res.data : res.data.results || [];
          const active = list.find((s: any) => ["READY_FOR_DISPATCH", "IN_TRANSIT", "DISPATCHED"].includes(s.status));
          
          if (active) {
            if (active.origin_lat && active.origin_lng) {
              oLat = parseFloat(active.origin_lat);
              oLng = parseFloat(active.origin_lng);
              oName = `${active.factory_name} (Origin)`;
            }
            if (active.dest_lat && active.dest_lng) {
              dLat = parseFloat(active.dest_lat);
              dLng = parseFloat(active.dest_lng);
              dName = `${active.warehouse_name} (Destination)`;
            }
          }
        } catch (e) {
          console.error("Failed to fetch dynamic locations", e);
        }

        setOriginData({ lat: oLat, lng: oLng, name: oName });
        setDestData({ lat: dLat, lng: dLng, name: dName });

        // Fetch route
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          // OSRM returns [lon, lat], convert to [lat, lon] for Leaflet
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
          setRouteCoords(coords);
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
      }
    };
    fetchRoute();
  }, []);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-[400] bg-brand-surface px-4 py-2.5 rounded-[1rem] shadow-soft border border-black/[0.03] text-sm font-semibold flex items-center gap-2 text-brand-text">
        <Navigation className="text-brand-orange w-4 h-4" /> Live Fleet Tracking
      </div>

      <MapContainer
        center={centerPos}
        zoom={6}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.8}
        />
        
        {/* Render Trucks */}
        {Object.entries(trucks).map(([id, pos]) => (
          <Marker 
            key={id} 
            position={[pos.lat, pos.lng]} 
            icon={createDotIcon(pos.status === 'IN_TRANSIT' ? "#FF7B47" : "#A39B98", 22)}
          >
            <Popup className="rounded-xl overflow-hidden shadow-soft border-none">
              <div className="p-1">
                <p className="font-bold text-brand-text mb-1">Truck {id}</p>
                <p className="text-xs text-brand-muted">{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            pathOptions={{ color: "#FF7B47", weight: 4, opacity: 0.7, dashArray: "8, 8" }} 
          />
        )}

        {/* Highlight Factories/Warehouses */}
        <Marker position={[originData.lat, originData.lng]} icon={createDotIcon("#211E1D", 16)}>
          <Popup>{originData.name}</Popup>
        </Marker>
        <Marker position={[destData.lat, destData.lng]} icon={createDotIcon("#211E1D", 16)}>
          <Popup>{destData.name}</Popup>
        </Marker>

        <MapControls />
      </MapContainer>
    </div>
  );
}
