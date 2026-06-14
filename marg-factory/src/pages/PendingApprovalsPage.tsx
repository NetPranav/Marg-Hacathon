import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  CircularProgress, LinearProgress, Avatar,
} from '@mui/material';
import {
  HourglassTop, CheckCircle, Cancel, Schedule,
} from '@mui/icons-material';

import { shipmentsApi } from '../api/endpoints';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  AWAITING_REVIEW: { label: 'Under Review', bg: '#FEF3C7', color: '#D97706', icon: <HourglassTop /> },
  APPROVED: { label: 'Approved', bg: '#D1FAE5', color: '#059669', icon: <CheckCircle /> },
  REJECTED: { label: 'Rejected', bg: '#FEE2E2', color: '#DC2626', icon: <Cancel /> },
};

export default function PendingApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Assuming status CREATED or PENDING means awaiting review
    shipmentsApi.list()
      .then(res => {
        const allShipments = res.data.results || res.data || [];
        const pending = allShipments.filter((s: any) => s.status === 'CREATED' || s.status === 'PENDING');
        setApprovals(pending);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
          Pending Approvals
        </Typography>
        <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
          Monitor warehouse responses to your shipment requests.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
        ) : approvals.length === 0 ? (
          <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: '#8A7F75' }}>No pending approvals found.</Typography>
        ) : approvals.map(approval => {
          const st = STATUS_CONFIG[approval.status] || STATUS_CONFIG.AWAITING_REVIEW;
          return (
            <Card key={approval.id}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    width: 48, height: 48, bgcolor: st.bg, color: st.color, fontWeight: 700
                  }}>
                    {(approval.warehouse_name || 'W').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: '#332922', fontSize: '1rem' }}>
                      {approval.warehouse_name || 'Unknown Warehouse'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>
                      Shipment: {approval.shipment_number} · Created: {new Date(approval.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    icon={st.icon as any}
                    label={st.label}
                    sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: st.bg, color: st.color }}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
