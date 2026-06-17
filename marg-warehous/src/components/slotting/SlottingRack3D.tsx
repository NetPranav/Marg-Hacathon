import { useRef, useState, useEffect } from 'react';
import { Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { RackData, ShelfData, ParcelData } from '@/stores/slottingStore';
import { useSlottingStore } from '@/stores/slottingStore';
import { slottingApi } from '@/api/endpoints';

function densityColor(u: number) {
  if (u < 0.3) return '#22C55E';
  if (u < 0.6) return '#F59E0B';
  if (u < 0.8) return '#FF8C00';
  return '#EF4444';
}

interface Props {
  config: RackData;
  parcels: ParcelData[];
  showDensity: boolean;
}

export default function SlottingRack3D({ config, parcels, showDensity }: Props) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const { viewMode, selectedRackId, selectedShelfId, selectRack, selectShelf, updateRackPosition } = useSlottingStore();
  const isSelected = selectedRackId === config.rack_id;

  const w = Number(config.shelf_width);
  const sh = Number(config.shelf_height);
  const d = Number(config.shelf_depth);
  const num_shelves = Number(config.num_shelves);
  const totalHeight = sh * num_shelves;

  const [transformRef, setTransformRef] = useState<any>(null);

  // Safely bind to the native dragging-changed event of TransformControls
  useEffect(() => {
    if (!transformRef) return;
    const controls = useSlottingStore.getState().mapControlsRef?.current;

    const handleDrag = (event: any) => {
      if (event.value) {
        if (controls) controls.enabled = false;
      } else {
        if (controls) controls.enabled = true;
        if (groupRef.current) {
          const newX = groupRef.current.position.x;
          const newZ = groupRef.current.position.z;
          updateRackPosition(config.rack_id, newX, newZ);
        }
      }
    };

    transformRef.addEventListener('dragging-changed', handleDrag);
    return () => transformRef.removeEventListener('dragging-changed', handleDrag);
  }, [transformRef, config.rack_id, updateRackPosition]);

  const content = (
    <group>
      {/* Posts — Blue uprights like real pallet racking */}
      {[
        [-w / 2, -d / 2],
        [-w / 2, d / 2],
        [w / 2, -d / 2],
        [w / 2, d / 2],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, totalHeight / 2, pz]} castShadow>
          <boxGeometry args={[0.1, totalHeight, 0.1]} />
          <meshStandardMaterial color="#1E40AF" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Diagonal cross-braces on front face for structural realism */}
      {Array.from({ length: num_shelves }).map((_, i) => {
        const y1 = i * sh;
        const y2 = (i + 1) * sh;
        const midY = (y1 + y2) / 2;
        return (
          <mesh key={`brace-${i}`} position={[0, midY, -d / 2]} rotation={[0, 0, Math.PI / 4 * (i % 2 === 0 ? 1 : -1)]}>
            <boxGeometry args={[0.03, sh * 1.1, 0.03]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.5} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Shelves */}
      {Array.from({ length: config.num_shelves }).map((_, i) => {
        const shelf = config.shelves.find((s) => s.level === i);
        const sy = i * sh;

        if (!shelf) {
          // Placeholder for missing backend shelf record
          return (
            <group key={`missing-${i}`}>
              <mesh position={[0, sy, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, 0.06, d]} />
                <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.35} />
              </mesh>
              <mesh
                position={[0, sy + sh / 2, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  selectRack(config.rack_id);
                }}
                onPointerOver={() => {
                  setHovered(true);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHovered(false);
                  document.body.style.cursor = 'auto';
                }}
              >
                <boxGeometry args={[w + 0.1, sh, d + 0.1]} />
                <meshStandardMaterial transparent opacity={0} />
              </mesh>
              <Html position={[0, sy + 0.2, d / 2 + 0.1]} center>
                <div style={{ background: '#F59E0B', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 'bold' }}>
                  Unsynced
                </div>
              </Html>
            </group>
          );
        }

        const util = shelf.utilization || 0;
        const color = showDensity ? densityColor(util) : '#94A3B8';
        const isShelfSelected = selectedShelfId === shelf.id;

        // Parcels on this shelf
        const shelfParcels = parcels.filter((p) => p.shelf === shelf.id);

        return (
          <group key={shelf.id}>
            {/* Shelf platform */}
            <mesh position={[0, sy, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, 0.06, d]} />
              <meshStandardMaterial color={showDensity && util > 0 ? color : "#E8700A"} metalness={0.5} roughness={0.35} />
            </mesh>

            {/* Individual parcels */}
            {shelfParcels.map((parcel, pi) => {
              // Parcels use their actual dimensions, capped by shelf size
              const pw = Math.min(parcel.width, w * 0.8);
              const ph = Math.min(parcel.height, sh * 0.9);
              const pd = Math.min(parcel.depth, d * 0.8);

              // Place them sequentially along the shelf (simple linear layout for visual)
              const px = -w / 2 + pw / 2 + 0.1 + (pi * (pw + 0.1));
              const py = sy + 0.03 + ph / 2; // Resting on the shelf platform
              const isParcelSelected =
                useSlottingStore.getState().selectedParcel?.id === parcel.id;
              const isMultiSelected = useSlottingStore.getState().selectedParcelIds.includes(String(parcel.id));

              return (
                <group key={parcel.id} position={[Math.min(px, w / 2 - pw / 2), py, 0]}>
                  <mesh
                    castShadow
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey || e.nativeEvent.shiftKey) {
                        useSlottingStore.getState().toggleParcelSelection(String(parcel.id));
                      } else {
                        useSlottingStore.getState().selectRack(config.rack_id);
                        useSlottingStore.getState().selectShelf(shelf.id);
                        useSlottingStore.getState().selectParcel(parcel);
                      }
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = 'auto';
                    }}
                  >
                    <boxGeometry args={[pw, ph, pd]} />
                    <meshStandardMaterial
                      color={isParcelSelected ? '#FBBF24' : (parcel.color || '#C28E5F')}
                      roughness={0.9}
                      metalness={0.0}
                      emissive={isMultiSelected ? '#38BDF8' : isParcelSelected ? '#FBBF24' : '#000000'}
                      emissiveIntensity={isMultiSelected ? 0.35 : isParcelSelected ? 0.3 : 0}
                    />
                  </mesh>
                </group>
              );
            })}

            {/* Shelf select hitbox */}
            <mesh
              position={[0, sy + sh / 2, 0]}
              onClick={(e) => {
                e.stopPropagation();
                selectRack(config.rack_id);
                selectShelf(isShelfSelected ? null : shelf.id);
              }}
              onPointerOver={() => {
                setHovered(true);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = 'auto';
              }}
            >
              <boxGeometry args={[w + 0.1, sh, d + 0.1]} />
              <meshStandardMaterial transparent opacity={0} />
            </mesh>

            {/* Shelf selection wireframe */}
            {isShelfSelected && (
              <mesh position={[0, sy + sh / 2, 0]}>
                <boxGeometry args={[w + 0.12, sh, d + 0.12]} />
                <meshStandardMaterial color="#E8700A" wireframe />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Rack selection outline */}
      {(hovered || isSelected) && (
        <mesh position={[0, totalHeight / 2, 0]}>
          <boxGeometry args={[w + 0.2, totalHeight + 0.15, d + 0.2]} />
          <meshStandardMaterial color="#8B3A0E" wireframe />
        </mesh>
      )}

      {/* Rack label */}
      <Html position={[0, totalHeight + 0.6, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color: hovered || isSelected ? '#E8700A' : '#94A3B8',
            fontWeight: 700,
            fontSize: 12,
            textAlign: 'center',
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px rgba(0,0,0,0.8)',
          }}
        >
          {config.rack_id}
          {showDensity && config.shelves.length > 0 && (
            <div
              style={{
                color: densityColor(
                  config.shelves.reduce((s, sh) => s + (sh.utilization || 0), 0) /
                  config.shelves.length,
                ),
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {Math.round(
                (config.shelves.reduce((s, sh) => s + (sh.utilization || 0), 0) /
                  config.shelves.length) *
                100,
              )}
              %
            </div>
          )}
        </div>
      </Html>

      {/* Selected rack info popup */}
      {isSelected && viewMode !== 'editor' && (
        <Html position={[w / 2 + 1.5, totalHeight, 0]} distanceFactor={10}>
          <div
            style={{
              background: 'rgba(15,23,42,0.92)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 11,
              minWidth: 160,
              border: '1px solid rgba(232,112,10,0.3)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: '#E8700A', marginBottom: 4 }}>
              {config.rack_id}
            </div>
            <div>
              Shelves: <strong>{config.num_shelves}</strong>
            </div>
            <div>
              Size:{' '}
              <strong>
                {config.shelf_width}×{config.shelf_depth}×{config.shelf_height}m
              </strong>
            </div>
            <div>
              Parcels:{' '}
              <strong>
                {parcels.filter((p) => p.rack_id === config.rack_id).length}
              </strong>
            </div>
          </div>
        </Html>
      )}
    </group>
  );

  return (
    <>
      {viewMode === 'editor' && isSelected && (
        <TransformControls
          ref={setTransformRef}
          object={groupRef as any}
          mode="translate"
          showY={false}
          size={1.2}
        />
      )}
      <group ref={groupRef} position={[Number(config.x_position), 0, Number(config.z_position)]}>
        {content}
      </group>
    </>
  );
}
