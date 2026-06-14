
import { Box, Typography, Tooltip, alpha } from '@mui/material';
import { useSlottingStore, RackData, DockData } from '@/stores/slottingStore';

interface Props {
  onRackClick?: (rack: RackData) => void;
  highlightedRackId?: string | null;
}

const getUtilizationColor = (rack: RackData) => {
  let totalVol = 0;
  let occVol = 0;
  (rack.shelves || []).forEach(s => {
    totalVol += s.total_volume;
    occVol += s.occupied_volume;
  });

  const pct = totalVol > 0 ? (occVol / totalVol) * 100 : 0;

  if (pct >= 90) return '#EF4444'; // Red
  if (pct >= 75) return '#E8700A'; // Orange
  if (pct >= 50) return '#F59E0B'; // Yellow
  return '#22C55E'; // Green
};

export default function WarehouseMiniMap({ onRackClick, highlightedRackId }: Props) {
  const { layout } = useSlottingStore();

  if (!layout) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', borderRadius: 2 }}>
        <Typography sx={{ color: '#94A3B8', fontWeight: 600 }}>Warehouse Map Loading...</Typography>
      </Box>
    );
  }

  // Adjust SVG viewbox to add some padding
  const padding = 2;
  const layoutWidth = Number(layout.width);
  const layoutDepth = Number(layout.depth);
  const viewBox = `-${padding} -${padding} ${layoutWidth + padding * 2} ${layoutDepth + padding * 2}`;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg
        viewBox={viewBox}
        style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Draw Warehouse Floor / Border */}
        <rect
          x={0} y={0} width={layoutWidth} height={layoutDepth}
          fill="#F1F5F9"
          stroke="#CBD5E1"
          strokeWidth={0.2}
          rx={0.5}
        />

        {/* Draw Docks/Gates */}
        {(layout.dock_bays || []).map((dock: DockData) => {
          if (dock.x_position === null || dock.z_position === null) return null;
          const dx = Number(dock.x_position);
          const dz = Number(dock.z_position);
          return (
            <g key={`dock-${dock.id}`}>
              <rect
                x={dx - 1}
                y={dz - 1}
                width={2}
                height={2}
                fill={alpha('#3B82F6', 0.2)}
                stroke="#3B82F6"
                strokeWidth={0.2}
              />
              <text
                x={dx}
                y={dz + 0.3}
                fontSize={0.6}
                fill="#1E40AF"
                textAnchor="middle"
                fontWeight="bold"
              >
                {dock.dock_number}
              </text>
            </g>
          );
        })}

        {/* Draw Racks */}
        {(layout.racks || []).map((rack: RackData) => {
          // Rack dimensions are roughly based on shelf_width and depth, plus some padding.
          // In the 3D map we might use different scales, but we'll approximate here:
          const rWidth = Number(rack.shelf_width) || 2;
          const rDepth = Number(rack.shelf_depth) || 1;
          const rx = Number(rack.x_position);
          const rz = Number(rack.z_position);
          const isHighlighted = highlightedRackId === rack.rack_id;
          const color = getUtilizationColor(rack);

          return (
            <Tooltip
              key={`rack-${rack.id}`}
              title={
                <Box sx={{ p: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Rack {rack.rack_id}</Typography>
                  <Typography variant="caption">Shelves: {rack.num_shelves}</Typography>
                </Box>
              }
              arrow
            >
              <rect
                x={rx - rWidth / 2}
                y={rz - rDepth / 2}
                width={rWidth}
                height={rDepth}
                fill={isHighlighted ? alpha(color, 0.8) : color}
                stroke={isHighlighted ? '#0F172A' : alpha('#000', 0.2)}
                strokeWidth={isHighlighted ? 0.3 : 0.1}
                rx={0.2}
                onClick={() => onRackClick?.(rack)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  filter: isHighlighted ? 'drop-shadow(0 0 1px rgba(0,0,0,0.5))' : 'none'
                }}
              />
            </Tooltip>
          );
        })}
      </svg>

      {/* Legend overlay */}
      <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: alpha('#fff', 0.9), p: 1, borderRadius: 2, border: '1px solid #E2E8F0', display: 'flex', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#22C55E' }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>&lt;50%</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#F59E0B' }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>50-75%</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#E8700A' }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>75-90%</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: '#EF4444' }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748B' }}>&gt;90%</Typography>
        </Box>
      </Box>
    </Box>
  );
}
