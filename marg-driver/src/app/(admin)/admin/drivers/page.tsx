'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Mail, User, Phone, CheckCircle2, Copy, Shield, Hash, Truck } from 'lucide-react';
import api from '@/lib/api';

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionData, setProvisionData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'DRIVER',
    license_number: ''
  });
  const [provisioningStatus, setProvisioningStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [provisionError, setProvisionError] = useState('');
  const [newCredentials, setNewCredentials] = useState<{email: string, password: string} | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/'); // Assuming /auth/ returns UserViewSet
      // Filter for drivers
      setDrivers(res.data.filter((u: any) => u.role === 'DRIVER'));
    } catch (err) {
      console.error('Failed to fetch drivers', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioningStatus('loading');
    setProvisionError('');
    
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';

    try {
      await api.post('/auth/provision/', {
        ...provisionData,
        password: tempPassword
      });
      
      setNewCredentials({
        email: provisionData.email,
        password: tempPassword
      });
      setProvisioningStatus('success');
      fetchDrivers();
    } catch (err: any) {
      setProvisionError(err.response?.data?.message || 'Failed to provision driver');
      setProvisioningStatus('error');
    }
  };

  const copyCredentials = () => {
    if (newCredentials) {
      navigator.clipboard.writeText(`Login: ${newCredentials.email}\nTemporary Password: ${newCredentials.password}`);
      alert('Credentials copied to clipboard!');
    }
  };

  const closeAndResetModal = () => {
    setIsProvisionModalOpen(false);
    setProvisioningStatus('idle');
    setNewCredentials(null);
    setProvisionData({
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      role: 'DRIVER',
      license_number: ''
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-brand-text mb-1 tracking-tight">Fleet Drivers</h1>
          <p className="text-brand-muted">Manage your logistics vehicle operators</p>
        </div>
        <button 
          onClick={() => setIsProvisionModalOpen(true)}
          className="bg-[#C15B2B] hover:bg-[#A84F25] text-white px-5 py-2.5 rounded-[1rem] font-medium transition-colors flex items-center shadow-soft"
        >
          <Plus className="w-5 h-5 mr-2" />
          Provision Driver
        </button>
      </div>

      <div className="bg-brand-surface rounded-[1.5rem] shadow-soft border border-brand-muted/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-muted/10 text-brand-muted text-sm font-medium">
                <th className="py-4 px-6 font-medium">Driver Profile</th>
                <th className="py-4 px-6 font-medium">Contact</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-muted/10">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-brand-muted">Loading drivers...</td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Truck className="w-12 h-12 text-brand-muted/30 mb-3" />
                      <p className="text-brand-muted">No drivers found. Provision one to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                drivers.map((drv: any) => (
                  <tr key={drv.id} className="hover:bg-brand-bg/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold">
                          {drv.first_name[0]}{drv.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-brand-text">{drv.first_name} {drv.last_name}</p>
                          <p className="text-xs text-brand-muted">ID: DRV-{drv.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-brand-text">{drv.email}</p>
                      <p className="text-xs text-brand-muted">{drv.phone_number}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${drv.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {drv.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-brand-orange hover:text-[#A84F25] text-sm font-medium">Manage</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {provisioningStatus === 'success' && newCredentials ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-brand-text mb-2">Driver Provisioned!</h3>
                  <p className="text-brand-muted">Share these temporary credentials with the driver. They will use the Mobile App to log in.</p>
                </div>
                
                <div className="bg-brand-bg rounded-[1.2rem] p-6 text-left border border-brand-muted/10 relative group">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-1">Login Email</p>
                      <p className="font-medium text-brand-text">{newCredentials.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold mb-1">Temporary Password</p>
                      <p className="font-mono text-lg font-medium text-brand-orange">{newCredentials.password}</p>
                    </div>
                  </div>
                  <button 
                    onClick={copyCredentials}
                    className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-brand-muted/10 text-brand-muted hover:text-brand-orange transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                <button 
                  onClick={closeAndResetModal}
                  className="w-full bg-brand-bg text-brand-text font-medium py-3 rounded-[1.2rem] hover:bg-brand-muted/5 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-brand-muted/10 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-brand-text flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-brand-orange" />
                    Provision Driver Account
                  </h2>
                  <button onClick={closeAndResetModal} className="text-brand-muted hover:text-brand-text">
                    &times;
                  </button>
                </div>
                <div className="p-6">
                  <form onSubmit={handleProvision} className="space-y-5">
                    {provisionError && (
                      <div className="bg-red-50 text-red-500 px-4 py-3 rounded-[1rem] text-sm font-medium">
                        {provisionError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">First Name</label>
                        <div className="relative">
                          <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                          <input
                            type="text"
                            required
                            value={provisionData.first_name}
                            onChange={e => setProvisionData({...provisionData, first_name: e.target.value})}
                            className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 focus:outline-none focus:border-brand-orange"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Last Name</label>
                        <input
                          type="text"
                          value={provisionData.last_name}
                          onChange={e => setProvisionData({...provisionData, last_name: e.target.value})}
                          className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 px-4 focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Email Address</label>
                      <div className="relative">
                        <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                          type="email"
                          required
                          value={provisionData.email}
                          onChange={e => setProvisionData({...provisionData, email: e.target.value})}
                          className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                          type="tel"
                          value={provisionData.phone_number}
                          onChange={e => setProvisionData({...provisionData, phone_number: e.target.value})}
                          className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 focus:outline-none focus:border-brand-orange"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Driving License #</label>
                      <div className="relative">
                        <Hash className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                        <input
                          type="text"
                          required
                          value={provisionData.license_number}
                          onChange={e => setProvisionData({...provisionData, license_number: e.target.value})}
                          className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 focus:outline-none focus:border-brand-orange uppercase"
                          placeholder="e.g. MH0120231234567"
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={closeAndResetModal}
                        className="flex-1 py-3 rounded-[1.2rem] font-medium border border-brand-muted/20 hover:bg-brand-bg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={provisioningStatus === 'loading'}
                        className="flex-1 bg-[#C15B2B] text-white py-3 rounded-[1.2rem] font-medium hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(193,91,43,0.25)]"
                      >
                        {provisioningStatus === 'loading' ? 'Provisioning...' : 'Create Driver'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
