import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, MenuItem, Select, Chip, Divider, CircularProgress } from '@mui/material';
import axios from 'axios';
import ShipmentChatRoom from './ShipmentChatRoom';

interface Props {
  shipment: any;
  onUpdate: () => void;
}

export default function CoordinationPanel({ shipment, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [exceptionType, setExceptionType] = useState('MISSING_PARCEL');
  const [exceptionDesc, setExceptionDesc] = useState('');

  const triggerAction = async (endpoint: string, payload: any = {}) => {
    setLoading(true);
    try {
      await axios.post(`/api/v1/coordination/${shipment.shipment_number}/${endpoint}/`, payload);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleException = async () => {
    if (!exceptionDesc) return;
    await triggerAction('exceptions', { exception_type: exceptionType, description: exceptionDesc });
    setExceptionDesc('');
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Driver Coordination</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => triggerAction('check-in', { action: 'APPROVE' })}
            disabled={loading || shipment.status !== 'ARRIVED_AT_GATE'}
          >
            Approve Gate Check-In
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => triggerAction('check-in', { action: 'REJECT' })}
            disabled={loading || shipment.status !== 'ARRIVED_AT_GATE'}
          >
            Reject Entry
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => triggerAction('arrive')} // Usually driver does this, but keeping as fallback
            disabled={loading}
          >
            Mark Arrived Manually
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Exception Management</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Select size="small" value={exceptionType} onChange={(e) => setExceptionType(e.target.value as string)} sx={{ width: 180 }}>
            <MenuItem value="MISSING_PARCEL">Missing Parcel</MenuItem>
            <MenuItem value="DAMAGED_GOODS">Damaged Goods</MenuItem>
            <MenuItem value="WRONG_QUANTITY">Wrong Quantity</MenuItem>
            <MenuItem value="BROKEN_SEAL">Broken Seal</MenuItem>
          </Select>
          <TextField 
            size="small" 
            placeholder="Exception details..." 
            value={exceptionDesc} 
            onChange={(e) => setExceptionDesc(e.target.value)} 
            fullWidth 
          />
          <Button variant="contained" color="warning" onClick={handleException} disabled={!exceptionDesc || loading}>
            Raise
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <ShipmentChatRoom shipmentId={shipment.shipment_number} />
      </CardContent>
    </Card>
  );
}
