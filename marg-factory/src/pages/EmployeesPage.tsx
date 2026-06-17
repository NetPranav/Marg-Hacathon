import React, { useState, useEffect } from 'react';
import { Add as Plus, Edit as Edit2, Delete as Trash2 } from '@mui/icons-material';
import { Box, Typography, Button, Card, Table, TableBody, TableCell, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import api from '@/api/client';

const ROLES = [
  { value: 'DISPATCH_MANAGER', label: 'Dispatch Manager' },
  { value: 'OPERATIONS_MANAGER', label: 'Operations Manager' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager' },
  { value: 'READ_ONLY', label: 'Read Only User' },
];

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', role: 'DISPATCH_MANAGER', password: '', confirm_password: '', department: 'Operations', notes: ''
  });

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users/');
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) return alert("Passwords don't match");
    try {
      await api.post('/auth/provision/', formData);
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      alert('Failed to provision user: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleDeactivate = async (id: string) => {
    if(!confirm("Are you sure you want to deactivate this employee?")) return;
    try {
      await api.patch(`/users/${id}/`, { is_active: false });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181B' }}>Employee Management</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>Manage access and roles for your organization.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus />} onClick={() => setShowModal(true)} sx={{
          bgcolor: '#EA580C', '&:hover': { bgcolor: '#C2410C' }, borderRadius: '8px', fontWeight: 600
        }}>
          Create Employee
        </Button>
      </Box>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
            ) : employees.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No employees found.</TableCell></TableRow>
            ) : employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>{emp.first_name} {emp.last_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>{emp.email}</Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{emp.phone_number}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={emp.role.replace('_', ' ')} size="small" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Chip label={emp.is_active !== false ? 'Active' : 'Deactivated'} size="small" color={emp.is_active !== false ? 'success' : 'error'} variant="outlined" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDeactivate(emp.id)}><Trash2 fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Employee</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField required label="First Name" name="first_name" onChange={handleChange} size="small" />
            <TextField required label="Last Name" name="last_name" onChange={handleChange} size="small" />
            <TextField required label="Email" type="email" name="email" onChange={handleChange} size="small" />
            <TextField required label="Phone Number" name="phone_number" onChange={handleChange} size="small" />
            
            <FormControl size="small">
              <InputLabel>Role</InputLabel>
              <Select name="role" value={formData.role} onChange={handleChange} label="Role">
                {ROLES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Department" name="department" onChange={handleChange} size="small" />

            <TextField required label="Password" type="password" name="password" onChange={handleChange} size="small" />
            <TextField required label="Confirm Password" type="password" name="confirm_password" onChange={handleChange} size="small" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#EA580C', '&:hover': { bgcolor: '#C2410C' } }}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EmployeesPage;
