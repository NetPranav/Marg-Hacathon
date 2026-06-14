import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import type { HighlightPath } from '@/stores/slottingStore';

export default function GatePath3D({ path }: { path: HighlightPath }) {
  const lineRef = useRef<any>(null);
  const materialRef = useRef<THREE.LineDashedMaterial>(null);

  // Define points: Gate -> Rack front -> Shelf height
  const points = useMemo(() => {
    const p = [];
    const [gx, gy, gz] = path.gatePosition;
    const [rx, ry, rz] = path.rackPosition;
    
    // Start at gate
    p.push(new THREE.Vector3(gx, 0.2, gz));
    
    // Move out from gate slightly
    p.push(new THREE.Vector3(gx, 0.2, gz - 2));
    
    // Move across to rack's X coordinate
    p.push(new THREE.Vector3(rx, 0.2, gz - 2));
    
    // Move to rack's Z coordinate (front of rack)
    p.push(new THREE.Vector3(rx, 0.2, rz + 1.5));
    
    // Move up to shelf level
    p.push(new THREE.Vector3(rx, (path.shelfLevel - 0.5) * 1.0, rz + 0.5));
    
    return p;
  }, [path]);

  // Animate the dashed line
  useFrame((state, delta) => {
    if (materialRef.current) {
      (materialRef.current as any).dashOffset -= delta * 2;
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color="#22C55E"
        lineWidth={4}
        dashed={true}
        dashSize={0.5}
        gapSize={0.2}
        dashOffset={0}
      >
        <lineDashedMaterial ref={materialRef} color="#22C55E" dashSize={0.5} gapSize={0.2} depthTest={false} />
      </Line>

      {/* Gate Marker */}
      <mesh position={[path.gatePosition[0], 0.1, path.gatePosition[2]]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.5} depthTest={false} />
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial color="#3B82F6" depthTest={false} />
        </mesh>
      </mesh>

      {/* Label Box */}
      <Html
        position={points[Math.floor(points.length / 2)]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(34, 197, 94, 0.9)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>Dock {path.gateName}</span>
          <span style={{ opacity: 0.6 }}>→</span>
          <span>Rack {path.rackName}</span>
          <span style={{ opacity: 0.6 }}>→</span>
          <span>Pos {path.positionLabel}</span>
        </div>
      </Html>
    </group>
  );
}
