import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Paper, TextField, MenuItem, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Save as SaveIcon, Add as AddIcon, ViewColumn as ViewColumnIcon,
  Delete as DeleteIcon, FileDownload as FileDownloadIcon, FileUpload as FileUploadIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { lotsApi, fleetApi, authApi } from '../api/endpoints';

const STANDARD_FIELDS = ['parcel_id', 'length', 'width', 'height', 'weight', 'quantity', 'dispatch_priority', 'is_fragile'];

const initialColumns: GridColDef[] = [
  { field: 'parcel_id', headerName: 'Parcel ID', width: 120, editable: true },
  { field: 'destination', headerName: 'Destination', width: 140, editable: true },
  { field: 'expected_dispatch_date', headerName: 'Exp Dispatch', type: 'date', width: 120, editable: true },
  { field: 'sku', headerName: 'SKU', width: 100, editable: true },
  { field: 'product_name', headerName: 'Product Name', width: 140, editable: true },
  { field: 'batch_number', headerName: 'Batch No', width: 100, editable: true },
  { field: 'insurance_value', headerName: 'Ins Value (₹)', type: 'number', width: 110, editable: true },
  { field: 'special_handling', headerName: 'Spl Handling', width: 130, editable: true },
  { field: 'length', headerName: 'L (cm)', type: 'number', width: 80, editable: true },
  { field: 'width', headerName: 'W (cm)', type: 'number', width: 80, editable: true },
  { field: 'height', headerName: 'H (cm)', type: 'number', width: 80, editable: true },
  { field: 'weight', headerName: 'Wt (kg)', type: 'number', width: 80, editable: true },
  { field: 'quantity', headerName: 'Qty', type: 'number', width: 80, editable: true },
  { field: 'dispatch_priority', headerName: 'Priority', width: 110, editable: true, type: 'singleSelect', valueOptions: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  { field: 'is_fragile', headerName: 'Fragile', type: 'boolean', width: 90, editable: true },
];

const initialRows: GridRowsProp = [];

export default function CreateLotPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<GridRowsProp>(initialRows);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [destination, setDestination] = useState('');
  
  const [totals, setTotals] = useState({ items: 0, weight: 0, volume: 0 });
  const [destBreakdown, setDestBreakdown] = useState(0);

  const [colDialogOpen, setColDialogOpen] = useState(false);
  const [newColName, setNewColName] = useState('');

  const handleDeleteRow = (id: import('@mui/x-data-grid').GridRowId) => {
    setRows(rows.filter((row) => row.id !== id));
  };

  const currentColumns: GridColDef[] = [
    ...initialColumns,
    ...customColumns.map(cc => ({ field: cc, headerName: cc.replace(/_/g, ' '), width: 150, editable: true })),
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: ({ id }) => {
        return [
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDeleteRow(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  useEffect(() => {
    fleetApi.listWarehouses().then(res => setWarehouses(res.data.results || []));
    authApi.getProfile().then(res => {
      const userFactory = res.data.data?.organization?.factories?.[0]?.id;
      if (userFactory) {
        setFactoryId(userFactory);
      } else {
        // Fallback to factory ID 1 if not strictly found in profile 
        // to prevent demo save failures
        setFactoryId(1);
      }
    }).catch(err => {
      console.error('Failed to get profile', err);
      setFactoryId(1); // fallback
    });
  }, []);

  const calculateTotals = () => {
    let tItems = 0;
    let tWeight = 0;
    let tVolume = 0;

    const destinations = new Set<string>();

    rows.forEach(r => {
      const qty = Number(r.quantity) || 1;
      tItems += qty;
      tWeight += (Number(r.weight) || 0) * qty;
      const vol = (Number(r.length) || 0) * (Number(r.width) || 0) * (Number(r.height) || 0);
      tVolume += (vol / 1000000) * qty;
      if (r.destination) destinations.add(r.destination);
    });

    setTotals({ items: tItems, weight: tWeight, volume: tVolume });
    setDestBreakdown(destinations.size);
  };

  useEffect(() => {
    calculateTotals();
  }, [rows]);

  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const fieldId = newColName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (currentColumns.find(c => c.field === fieldId)) {
      alert("Column already exists!");
      return;
    }

    setCustomColumns([...customColumns, fieldId]);
    setColDialogOpen(false);
    setNewColName('');
  };

  const handleSave = async () => {
    if (!destination) {
      alert("Please select a destination warehouse.");
      return;
    }
    if (!factoryId) {
      alert("Unable to determine your factory ID. Please refresh or contact support.");
      return;
    }

    try {
      const payload = {
        factory: factoryId,
        destination_warehouse: destination,
        status: 'DRAFT',
        parcels: rows.map(r => {
          // Serialize custom fields into JSON notes
          const customData: Record<string, any> = {};
          customColumns.forEach(cc => {
            if (r[cc] !== undefined && r[cc] !== '') {
              customData[cc] = r[cc];
            }
          });

          return {
            parcel_id: r.parcel_id || 'UNKNOWN',
            length: Number(r.length) || 0,
            width: Number(r.width) || 0,
            height: Number(r.height) || 0,
            weight: Number(r.weight) || 0,
            quantity: Number(r.quantity) || 1,
            dispatch_priority: r.dispatch_priority || 'MEDIUM',
            is_fragile: Boolean(r.is_fragile),
            notes: Object.keys(customData).length > 0 ? JSON.stringify(customData) : ''
          };
        })
      };

      await lotsApi.create(payload);
      navigate('/lots');
    } catch (e) {
      console.error(e);
      alert("Error saving lot");
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Top Header & Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>Spreadsheet Entry</Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>Create your lot by adding dynamic rows and columns.</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip label={`Items: ${totals.items}`} sx={{ fontWeight: 700, bgcolor: '#FFF7ED', color: '#EA580C', borderRadius: '8px' }} />
          <Chip label={`Weight: ${totals.weight}kg`} sx={{ fontWeight: 700, bgcolor: '#EFF6FF', color: '#3B82F6', borderRadius: '8px' }} />
          <Chip label={`Vol: ${totals.volume.toFixed(2)}m³`} sx={{ fontWeight: 700, bgcolor: '#F0FDF4', color: '#22C55E', borderRadius: '8px' }} />
          <Chip label={`Dests: ${destBreakdown}`} sx={{ fontWeight: 700, bgcolor: '#F3E8FF', color: '#9333EA', borderRadius: '8px' }} />
          
          <Button 
            variant="contained" 
            sx={{ borderRadius: '10px', px: 3, py: 1 }}
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Draft Lot
          </Button>
        </Box>
      </Box>

      {/* Settings Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          select
          size="small"
          sx={{ minWidth: 250 }}
          label="Destination Warehouse"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          {warehouses.map(w => (
            <MenuItem key={w.id} value={w.id}>{w.name}{w.city ? ` (${w.city})` : ''}</MenuItem>
          ))}
        </TextField>
        <TextField
          type="date"
          size="small"
          label="Dispatch Date"
          InputLabelProps={{ shrink: true }}
        />
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<FileUploadIcon />}
            sx={{ borderRadius: '8px' }}
            onClick={() => alert("Excel Import using SheetJS to be implemented here")}
          >
            Import
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<FileDownloadIcon />}
            sx={{ borderRadius: '8px' }}
            onClick={() => alert("Excel Export to be implemented here")}
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ViewColumnIcon />}
            onClick={() => setColDialogOpen(true)}
            sx={{ borderRadius: '8px' }}
          >
            Custom Col
          </Button>
        </Box>
        <Button 
          variant="contained" 
          color="secondary"
          startIcon={<AddIcon />}
          sx={{ borderRadius: '8px' }}
          onClick={() => setRows([...rows, { 
            id: Date.now(), parcel_id: `P-${Date.now().toString().slice(-4)}`, 
            length: 0, width: 0, height: 0, weight: 0, quantity: 1, 
            dispatch_priority: 'MEDIUM', is_fragile: false 
          }])}
        >
          Add Row
        </Button>
      </Paper>

      {/* Spreadsheet Area */}
      <Paper sx={{ flex: 1, width: '100%', borderRadius: '20px', overflow: 'hidden', mb: 2 }}>
        <DataGrid
          rows={rows}
          columns={currentColumns}
          processRowUpdate={(newRow) => {
            setRows(rows.map(r => r.id === newRow.id ? newRow : r));
            return newRow;
          }}
          hideFooter
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#FDFBF7',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              color: '#8A7F75',
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(0,0,0,0.03)',
              color: '#332922',
            },
          }}
        />
      </Paper>

      {/* Add Column Dialog */}
      <Dialog open={colDialogOpen} onClose={() => setColDialogOpen(false)} PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#332922' }}>Add Custom Column</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: '#8A7F75' }}>
            Enter a name for the new column. Data in this column will be saved automatically as metadata.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Column Name"
            value={newColName}
            onChange={e => setNewColName(e.target.value)}
            placeholder="e.g. Color, Material, Handling Code"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setColDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddColumn} sx={{ borderRadius: '8px' }}>Add Column</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
