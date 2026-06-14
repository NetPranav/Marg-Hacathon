import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ShelfData {
  id: number;
  rack: number;
  rack_id: string;
  level: number;
  available_volume: number;
  occupied_volume: number;
  total_volume: number;
  utilization: number;
  parcel_count: number;
  max_weight: number;
  current_weight: number;
  is_locked: boolean;
  is_reserved: boolean;
}

export interface RackData {
  id: number;
  warehouse: number;
  rack_id: string;
  row_index: number;
  col_index: number;
  x_position: number;
  z_position: number;
  num_shelves: number;
  shelf_width: number;
  shelf_depth: number;
  shelf_height: number;
  shelves: ShelfData[];
}

export interface DockData {
  id: number;
  dock_number: string;
  status: string;
  dock_type: string;
  x_position: number | null;
  z_position: number | null;
}

export interface ParcelData {
  id: number;
  parcel_id: string;
  warehouse: number;
  shelf: number | null;
  shelf_level: number | null;
  rack_id: string | null;
  rack_db_id: number | null;
  height: number;
  width: number;
  depth: number;
  weight: number;
  volume: number;
  destination: string;
  expected_dispatch_date: string;
  priority: string;
  special_handling: string;
  position_label: string;
  status: string;
  color?: string;
}

export interface LayoutData {
  id: number;
  name: string;
  width: number;
  depth: number;
  height: number;
  layout_version: number;
  racks: RackData[];
  dock_bays: DockData[];
  utilization: {
    total_volume: number;
    occupied_volume: number;
    utilization_pct: number;
    rack_count: number;
    shelf_count: number;
    parcel_count: number;
  };
}

export interface Recommendation {
  shelf_id: number;
  rack_id: string;
  rack_db_id: number;
  shelf_level: number;
  score: number;
  breakdown: {
    space_utilization: number;
    dispatch_priority: number;
    destination_grouping: number;
    accessibility: number;
    weight_distribution: number;
  };
  available_volume: number;
  current_utilization: number;
  warnings: string[];
}

export interface HighlightPath {
  gatePosition: [number, number, number];
  rackPosition: [number, number, number];
  shelfLevel: number;
  gateName: string;
  rackName: string;
  positionLabel: string;
}

type ViewMode = 'visualization' | 'editor' | 'inventory';

interface SlottingState {
  // Data
  layout: LayoutData | null;
  parcels: ParcelData[];
  recommendations: Recommendation[];

  // Selection
  selectedParcel: ParcelData | null;
  selectedParcelIds: string[];
  selectedRackId: string | null;
  selectedShelfId: number | null;
  highlightPath: HighlightPath | null;

  mapControlsRef: any;

  // View state
  viewMode: ViewMode;
  showDensity: boolean;
  showHeatmap: boolean;
  searchQuery: string;
  filterDestination: string;
  filterStatus: string;

  // Actions
  setLayout: (layout: LayoutData) => void;
  setParcels: (parcels: ParcelData[]) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  selectParcel: (parcel: ParcelData | null) => void;
  toggleParcelSelection: (parcelId: string) => void;
  selectRack: (rackId: string | null) => void;
  selectShelf: (shelfId: number | null) => void;
  setMapControlsRef: (ref: any) => void;
  setHighlightPath: (path: HighlightPath | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setShowDensity: (v: boolean) => void;
  setShowHeatmap: (v: boolean) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (s: string) => void;
  updateRackPosition: (rackId: string, x: number, z: number) => void;
  locateParcel: (parcel: ParcelData) => void;
  clearSelection: () => void;
}

export const useSlottingStore = create<SlottingState>()((set, get) => ({
  layout: null,
  parcels: [],
  recommendations: [],
  selectedParcel: null,
  selectedParcelIds: [],
  selectedRackId: null,
  selectedShelfId: null,
  highlightPath: null,
  mapControlsRef: null,
  viewMode: 'visualization',
  showDensity: true,
  showHeatmap: false,
  searchQuery: '',
  filterDestination: '',
  filterStatus: '',

  setLayout: (layout) => set({ layout }),
  setParcels: (parcels) => set({ parcels }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  selectParcel: (parcel) => set({ selectedParcel: parcel }),
  toggleParcelSelection: (parcelId) => {
    const { selectedParcelIds } = get();
    if (selectedParcelIds.includes(parcelId)) {
      set({ selectedParcelIds: selectedParcelIds.filter(id => id !== parcelId) });
    } else {
      set({ selectedParcelIds: [...selectedParcelIds, parcelId] });
    }
  },
  selectRack: (rackId) => set({ selectedRackId: rackId }),
  selectShelf: (shelfId) => set({ selectedShelfId: shelfId }),
  setMapControlsRef: (ref) => set({ mapControlsRef: ref }),
  setHighlightPath: (path) => set({ highlightPath: path }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowDensity: (v) => set({ showDensity: v }),
  setShowHeatmap: (v) => set({ showHeatmap: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFilterDestination: (d: any) => set({ filterDestination: d }),
  setFilterStatus: (s) => set({ filterStatus: s }),

  updateRackPosition: (rackId, x, z) => {
    const { layout } = get();
    if (!layout) return;
    const newRacks = layout.racks.map(r => 
      r.rack_id === rackId ? { ...r, x_position: x, z_position: z } : r
    );
    set({ layout: { ...layout, racks: newRacks } });
  },

  locateParcel: (parcel) => {
    const { layout } = get();
    if (!layout || !parcel.rack_id) return;

    // Find the rack
    const rack = layout.racks.find((r) => r.rack_id === parcel.rack_id);
    if (!rack) return;

    // Find nearest gate
    const gates = layout.dock_bays.filter(
      (d) => d.x_position !== null && d.z_position !== null,
    );
    let nearestGate = gates[0];
    let minDist = Infinity;
    for (const g of gates) {
      const dx = (g.x_position || 0) - rack.x_position;
      const dz = (g.z_position || 0) - rack.z_position;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        nearestGate = g;
      }
    }

    set({
      selectedParcel: parcel,
      selectedRackId: parcel.rack_id,
      selectedShelfId: parcel.shelf,
      highlightPath: nearestGate
        ? {
            gatePosition: [
              nearestGate.x_position || 0,
              0,
              nearestGate.z_position || 0,
            ],
            rackPosition: [rack.x_position, 0, rack.z_position],
            shelfLevel: parcel.shelf_level || 1,
            gateName: nearestGate.dock_number,
            rackName: rack.rack_id,
            positionLabel: parcel.position_label,
          }
        : null,
    });
  },

  clearSelection: () =>
    set({
      selectedParcel: null,
      selectedParcelIds: [],
      selectedRackId: null,
      selectedShelfId: null,
      highlightPath: null,
      recommendations: [],
    }),
}));
