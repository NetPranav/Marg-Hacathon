import { Canvas } from '@react-three/fiber';
import { MapControls, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useSlottingStore } from '@/stores/slottingStore';
import { useRef, useEffect } from 'react';
import SlottingRack3D from './SlottingRack3D';
import GatePath3D from './GatePath3D';

function Floor({ width, depth }: { width: number; depth: number }) {
  const zLines = Math.floor((depth - 4) / 5);
  const xLines = Math.floor((width - 4) / 8);

  return (
    <group>
      {/* Grid */}
      <Grid
        args={[width, depth]}
        cellSize={1}
        cellThickness={0.8}
        cellColor="#334155"
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor="#475569"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid={true}
      />
      {/* Concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[width + 2, depth + 2]} />
        <meshStandardMaterial color="#3A4A63" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Floor lane markings */}
      {Array.from({ length: Math.max(0, zLines + 1) }).map((_, i) => {
        const z = -depth / 2 + 2 + i * 5;
        if (z > depth / 2 - 2) return null;
        return (
          <mesh key={`lane-z-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, z]}>
            <planeGeometry args={[width - 2, 0.08]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.4} />
          </mesh>
        );
      })}
      {Array.from({ length: Math.max(0, xLines + 1) }).map((_, i) => {
        const x = -width / 2 + 2 + i * 8;
        if (x > width / 2 - 2) return null;
        return (
          <mesh key={`lane-x-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
            <planeGeometry args={[0.08, depth - 2]} />
            <meshBasicMaterial color="#F59E0B" transparent opacity={0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

function IndustrialCeiling({ width, depth, height }: { width: number; depth: number; height: number }) {

  const ceilH = height + 1;
  const angle = 1 * Math.PI / 180;
  const roofDepth = depth / 2 + 0.5;
  const ridgeY = ceilH + Math.sin(angle) * roofDepth;
  const opacity = 0.4;

  const trussCount = Math.max(2, Math.ceil(width / 8));
  const lightCols = Math.max(1, Math.ceil(width / 6));
  const lightRows = Math.max(1, Math.ceil(depth / 6));
  const lightDist = Math.max(width, depth) / 2.5;

  return (
    <group>
      {/* Roof panels (pitched) */}
      <mesh position={[0, ceilH + (ridgeY - ceilH) / 2, -depth / 4 - 0.25]} rotation={[-Math.PI / 2 + angle, 0, 0]}>
        <planeGeometry args={[width, roofDepth]} />
        <meshStandardMaterial transparent opacity={opacity} color="#3F2E1E" side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
      <mesh position={[0, ceilH + (ridgeY - ceilH) / 2, depth / 4 + 0.25]} rotation={[-Math.PI / 2 - angle, 0, 0]}>
        <planeGeometry args={[width, roofDepth]} />
        <meshStandardMaterial transparent opacity={opacity} color="#3F2E1E" side={THREE.DoubleSide} roughness={0.85} />
      </mesh>

      {/* Steel trusses along length */}
      {Array.from({ length: trussCount }).map((_, i) => {
        const x = -width / 2 + (width / (trussCount - 1 || 1)) * i;
        return (
          <group key={`truss-${i}`}>
            <mesh position={[x, ceilH - 0.3, 0]}>
              <boxGeometry args={[0.15, 0.3, depth]} />
              <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Overhead lights */}
      {Array.from({ length: lightCols }).map((_, i) =>
        Array.from({ length: lightRows }).map((_, j) => {
          const x = -width / 2 + (width / (lightCols * 2)) * (i * 2 + 1);
          const z = -depth / 2 + (depth / (lightRows * 2)) * (j * 2 + 1);
          return (
            <group key={`light-${i}-${j}`}>
              <mesh position={[x, ceilH - 0.5, z]}>
                <boxGeometry args={[0.6, 0.1, 0.3]} />
                <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[x, ceilH - 0.6, z]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, 0.2]} />
                <meshBasicMaterial color="#FFF7ED" transparent opacity={0.6} />
              </mesh>
              <pointLight position={[x, ceilH - 1, z]} intensity={0.7} color="#FFF7ED" distance={lightDist} decay={2} />
            </group>
          );
        })
      )}
    </group>
  );
}

function WarehouseWalls({ width, depth, height }: { width: number; depth: number; height: number }) {
  const ceilH = height + 1;
  const layout = useSlottingStore(s => s.layout);

  const frontWallMat = (
    <meshPhysicalMaterial color="#334155" transparent opacity={0.22} depthWrite={false} roughness={0.5} />
  );

  const solidWallMat = <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.7} />;

  // Corrugation ribs
  const backRibs = Math.floor(width);
  const sideRibs = Math.floor(depth);
  const opct = 0.4;

  const docksOnWalls = layout?.dock_bays.filter(d =>
    d.z_position !== null && d.x_position !== null && Math.abs(Math.abs(d.z_position) - depth / 2) <= 1
  ) || [];

  return (
    <group>
      {/* Back Wall (solid) */}
      <group position={[0, ceilH / 2, -depth / 2]}>
        <mesh><boxGeometry args={[width, ceilH, 0.2]} />{solidWallMat}</mesh>
        {Array.from({ length: backRibs }).map((_, i) => (
          <mesh key={`b-rib-${i}`} position={[-width / 2 + 0.5 + i, 0, 0.15]}>
            <boxGeometry args={[0.1, ceilH, 0.03]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
      </group>

      {/* Left Wall (solid) */}
      <group position={[-width / 2, ceilH / 2, 0]}>
        <mesh><boxGeometry args={[0.2, ceilH, depth]} />{solidWallMat}</mesh>
        {Array.from({ length: sideRibs }).map((_, i) => (
          <mesh key={`l-rib-${i}`} position={[0.15, 0, -depth / 2 + 0.5 + i]}>
            <boxGeometry args={[0.03, ceilH, 0.1]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
      </group>

      {/* Right Wall (solid) */}
      <group position={[width / 2, ceilH / 2, 0]}>
        <mesh><boxGeometry args={[0.2, ceilH, depth]} />{solidWallMat}</mesh>
        {Array.from({ length: sideRibs }).map((_, i) => (
          <mesh key={`r-rib-${i}`} position={[-0.15, 0, -depth / 2 + 0.5 + i]}>
            <boxGeometry args={[0.03, ceilH, 0.1]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
      </group>

      {/* Front Wall — split in two for entrance */}
      <mesh position={[-(width / 2 - 2) / 2 - 2, ceilH / 2, depth / 2]}>
        <boxGeometry args={[width / 2 - 2, ceilH, 0.2]} />
        {frontWallMat}
      </mesh>
      <mesh position={[(width / 2 - 2) / 2 + 2, ceilH / 2, depth / 2]}>
        <boxGeometry args={[width / 2 - 2, ceilH, 0.2]} />
        {frontWallMat}
      </mesh>

      {/* Loading dock doors */}
      {docksOnWalls.length > 0 ? docksOnWalls.map((dock, i) => {
        const isFront = dock.z_position! > 0;
        const z = isFront ? depth / 2 - 0.15 : -depth / 2 + 0.15;
        const zDoor = isFront ? depth / 2 - 0.2 : -depth / 2 + 0.2;
        return (
          <group key={`door-${i}`}>
            <mesh position={[Number(dock.x_position!), 2, z]}>
              <boxGeometry args={[3, 4, 0.1]} />
              <meshStandardMaterial color="#0F172A" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh position={[Number(dock.x_position!), 2, zDoor]}>
              <boxGeometry args={[2.8, 3.8, 0.05]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
        );
      }) : Array.from({ length: 4 }).map((_, i) => {
        const x = -width / 2 + (width / 4) * (i + 0.5);
        return (
          <group key={`door-${i}`}>
            <mesh position={[x, 2, -depth / 2 + 0.15]}>
              <boxGeometry args={[3, 4, 0.1]} />
              <meshStandardMaterial color="#0F172A" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh position={[x, 2, -depth / 2 + 0.2]}>
              <boxGeometry args={[2.8, 3.8, 0.05]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Docks() {
  const layout = useSlottingStore((s) => s.layout);
  if (!layout) return null;

  return (
    <group>
      {layout.dock_bays.map((dock) => {
        if (dock.x_position === null || dock.z_position === null) return null;
        const color = dock.dock_type === 'LOADING' ? '#3B82F6' : dock.dock_type === 'UNLOADING' ? '#E8700A' : '#64748B';
        return (
          <group key={dock.id} position={[Number(dock.x_position), 0.1, Number(dock.z_position)]}>
            {/* Dock Area */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4, 4]} />
              <meshBasicMaterial color={color} transparent opacity={0.15} />
            </mesh>
            {/* Dock hazard stripes */}
            <mesh position={[0, 0.01, -1.8]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[4, 0.3]} />
              <meshBasicMaterial color="#F59E0B" transparent opacity={0.5} />
            </mesh>
            {/* Dock Label Plate */}
            <mesh position={[0, 0.02, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[3, 0.4]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Decorative forklift (simple box representation)
function Forklift({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 1.2]} />
        <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 1, -0.55]}>
        <boxGeometry args={[0.6, 1.4, 0.08]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Forks */}
      <mesh position={[-0.2, 0.15, -0.9]}>
        <boxGeometry args={[0.08, 0.05, 0.7]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.2, 0.15, -0.9]}>
        <boxGeometry args={[0.08, 0.05, 0.7]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Wheels */}
      {[[-0.35, 0.12, 0.35], [0.35, 0.12, 0.35], [-0.35, 0.12, -0.35], [0.35, 0.12, -0.35]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function WarehouseCanvas() {
  const { layout, parcels, showDensity, highlightPath, clearSelection, setMapControlsRef } = useSlottingStore();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMapControlsRef(controlsRef);
  }, [setMapControlsRef]);

  if (!layout) return null;

  const wh = Number(layout.height) || 6;
  const layoutWidth = Number(layout.width);
  const layoutDepth = Number(layout.depth);
  const diag = Math.sqrt(layoutWidth ** 2 + layoutDepth ** 2);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [0, 20, 25], fov: 45 }}
        shadows
        onPointerMissed={clearSelection}
      >
        <color attach="background" args={['#0C1322']} />
        <fog attach="fog" args={['#0C1322', diag * 0.9, diag * 2.2]} />

        <ambientLight intensity={0.45} />
        <directionalLight
          position={[15, 25, 10]}
          intensity={0.9}
          color="#ffffff"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-10, 20, -5]}
          intensity={0.2}
          color="#94A3B8"
        />
        <Environment preset="warehouse" />

        <Floor width={layoutWidth} depth={layoutDepth} />
        <WarehouseWalls width={layoutWidth} depth={layoutDepth} height={wh} />
        <IndustrialCeiling width={layoutWidth} depth={layoutDepth} height={wh} />
        <Docks />

        {/* Decorative forklifts */}
        <Forklift position={[-6, 0, 2]} />
        <Forklift position={[8, 0, -5]} />

        {layout.racks.map((rack) => (
          <SlottingRack3D
            key={rack.id}
            config={rack}
            parcels={parcels}
            showDensity={showDensity}
          />
        ))}

        {highlightPath && <GatePath3D path={highlightPath} />}

        <MapControls
          ref={controlsRef}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
}
