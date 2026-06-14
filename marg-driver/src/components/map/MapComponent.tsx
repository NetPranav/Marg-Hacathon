"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Crosshair, Layers } from "lucide-react";
import api from "@/lib/api";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});



// Custom marker styles
const createDotIcon = (color: string, size: number = 20) => {
  return L.divIcon({
    className: "custom-dot-icon",
    html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border: 4px solid white; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.2);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapControls({ currentPos }: { currentPos: [number, number] }) {
  const map = useMap();
  
  return (
    <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
      <button 
        onClick={() => map.flyTo(currentPos, 7)}
        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-brand-text hover:bg-gray-50 transition-colors"
      >
        <Crosshair size={22} />
      </button>
      <button 
        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-brand-text hover:bg-gray-50 transition-colors"
      >
        <Layers size={22} />
      </button>
    </div>
  );
}

export default function MapComponent() {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [originData, setOriginData] = useState({ lat: 19.0760, lng: 72.8777, name: "Mumbai Plant (Origin)" });
  const [destData, setDestData] = useState({ lat: 22.9676, lng: 76.0534, name: "Pranav (Dewas) (Destination)" });
  const [currentPos, setCurrentPos] = useState<[number, number]>([21.0, 74.5]);

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
        setCurrentPos([oLat, oLng]); // Mock current position to origin for now

        // Fetch route
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
          setRouteCoords(coords);
          if (coords.length > 0) {
            setCurrentPos(coords[Math.floor(coords.length / 2)]); // Put truck in middle of route
          }
        }
      } catch (err) {
        console.error("Failed to fetch route", err);
      }
    };
    fetchRoute();
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* Label Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white px-4 py-2 rounded-xl shadow-sm text-sm font-semibold flex items-center gap-2 text-brand-text">
        <span className="text-brand-orange text-lg">◬</span> {originData.name.split(' ')[0]} to {destData.name.split(' ')[0]}
      </div>

      <MapContainer
        center={currentPos}
        zoom={6}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
          opacity={0.8}
        />
        
        {routeCoords.length > 0 && (
          <Polyline 
            positions={routeCoords} 
            pathOptions={{ 
              color: "#FF7B47", 
              weight: 5, 
              dashArray: "15, 15",
              lineCap: "round",
              lineJoin: "round"
            }} 
          />
        )}

        {/* Start Point */}
        <Marker position={[originData.lat, originData.lng]} icon={createDotIcon("#FF7B47", 16)} />
        
        {/* Current Truck Location */}
        <Marker position={currentPos} icon={createDotIcon("#FF7B47", 24)} />
        
        {/* Destination */}
        <Marker position={[destData.lat, destData.lng]} icon={createDotIcon("#FF7B47", 16)} />

        <MapControls currentPos={currentPos} />
      </MapContainer>
    </div>
  );
}
