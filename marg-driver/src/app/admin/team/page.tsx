'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Plus, UserCircle2, Settings2, Trash2, MoreVertical, ShieldCheck, X } from 'lucide-react';
import api from '@/lib/api';

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [teamData, setTeamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      const response = await api.get('/users/');
      setTeamData(response.data.results || response.data);
    } catch (error) {
      console.error("Failed to fetch team data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);
  //   { id: 'EMP-01', name: 'Rajesh Kumar', email: 'rajesh@marg.os', phone: '+91 9876543210', role: 'Driver', rating: 4.9, status: 'Active', trips: 142, joined: 'Mar 2024' },
  //   { id: 'EMP-02', name: 'Amit Singh', email: 'amit@marg.os', phone: '+91 8765432109', role: 'Driver', rating: 4.8, status: 'Active', trips: 128, joined: 'Feb 2024' },
  //   { id: 'EMP-03', name: 'Priya M.', email: 'priya@marg.os', phone: '+91 7654321098', role: 'Operations', rating: '-', status: 'Active', trips: '-', joined: 'Jan 2024' },
  //   { id: 'EMP-04', name: 'Suresh Patil', email: 'suresh@marg.os', phone: '+91 6543210987', role: 'Driver', rating: 4.8, status: 'On Leave', trips: 115, joined: 'Apr 2024' },
  // ]);

  const filteredTeam = teamData.filter(emp => {
    const name = emp.first_name + ' ' + (emp.last_name || '');
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || emp.role.toUpperCase() === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newEmp = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      email: formData.get('email') as string,
      phone_number: formData.get('phone_number') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as string,
      license_number: formData.get('license_number') as string,
    };

    try {
      await api.post('/users/', newEmp);
      setIsAddModalOpen(false);
      fetchTeam(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to create personnel", error);
      const msg = error.response?.data?.message || "Failed to create personnel.";
      alert(msg);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      await api.patch(`/users/${selectedUser.id}/`, {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        phone_number: formData.get('phone_number') as string,
        role: formData.get('role') as string,
      });
      setIsEditModalOpen(false);
      fetchTeam();
    } catch (error) {
      console.error("Failed to update personnel", error);
    }
  };

  const handleDelete = async () => {
    if (!adminPassword) {
      alert("Admin password is required.");
      return;
    }
    try {
      await api.delete(`/users/${selectedUser.id}/`, { data: { admin_password: adminPassword } });
      setIsDeleteModalOpen(false);
      setAdminPassword('');
      fetchTeam();
    } catch (error: any) {
      console.error("Failed to remove personnel", error);
      alert(error.response?.data?.message || "Failed to remove personnel.");
    }
  };

  return (
    <div className="w-full relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-text tracking-tight mb-2">Personnel Management</h1>
          <p className="text-brand-muted font-medium">Manage your drivers, operations staff, and permissions.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-text text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-orange transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Personnel
        </button>
      </div>

      <div className="bg-brand-surface rounded-[2rem] border border-black/[0.03] shadow-soft overflow-hidden">
        <div className="p-6 border-b border-black/[0.03] flex flex-col md:flex-row gap-4 justify-between items-center bg-brand-bg/30">
          <div className="flex gap-2 bg-black/5 p-1 rounded-xl">
            {['ALL', 'DRIVER', 'OPERATIONS'].map(role => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${filterRole === role ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-brand-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border border-black/[0.05] focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg/50">
                <th className="p-4 pl-6 text-xs font-semibold text-brand-muted uppercase tracking-wider">Employee</th>
                <th className="p-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Performance</th>
                <th className="p-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Status</th>
                <th className="p-4 pr-6 text-xs font-semibold text-brand-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-brand-muted">Loading team members...</td></tr>
              ) : filteredTeam.map(emp => (
                <tr key={emp.id} className="hover:bg-black/[0.01] transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                        <UserCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-brand-text">{emp.first_name} {emp.last_name}</div>
                        <div className="text-xs text-brand-muted font-medium">{emp.email} • {emp.phone_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide ${emp.role === 'DRIVER' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {emp.role === 'DRIVER' ? (
                      <div>
                        <div className="font-bold text-green-600">4.9 ★</div>
                        <div className="text-[10px] text-brand-muted font-bold uppercase tracking-wider mt-0.5">Mock Rating</div>
                      </div>
                    ) : (
                      <span className="text-brand-muted">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${emp.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-sm font-semibold text-brand-text">{emp.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedUser(emp); setIsPermissionModalOpen(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-black/5 transition-colors" title="Permissions">
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(emp); setIsEditModalOpen(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-black/5 transition-colors" title="Edit">
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedUser(emp); setIsDeleteModalOpen(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-brand-muted font-medium">No personnel found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Personnel Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 bg-brand-text text-white relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-bold tracking-tight">Add Personnel</h2>
              <p className="text-white/60 font-medium mt-1">Create a new account for a driver or ops employee.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 md:p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">First Name</label>
                  <input required name="first_name" type="text" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" placeholder="Vikram" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Last Name</label>
                  <input name="last_name" type="text" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" placeholder="Singh" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Email Address</label>
                  <input required name="email" type="email" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" placeholder="vikram@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Phone Number</label>
                  <input required name="phone_number" type="text" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" placeholder="+91 9876543210" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Role</label>
                  <select name="role" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50">
                    <option value="DRIVER">Driver</option>
                    <option value="EMPLOYEE">Operations Employee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Password</label>
                  <input required name="password" type="password" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" placeholder="Secure Password" />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-black/[0.03] mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-brand-muted hover:bg-black/5 transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 rounded-xl font-bold bg-brand-orange text-white hover:bg-[#C15B2B] transition-colors shadow-[0_8px_20px_rgba(255,123,71,0.25)]">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Personnel Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 bg-brand-text text-white relative">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-2xl font-bold tracking-tight">Edit Personnel</h2>
              <p className="text-white/60 font-medium mt-1">Update details for {selectedUser.name}.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 md:p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">First Name</label>
                  <input required name="first_name" defaultValue={selectedUser.first_name} type="text" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Last Name</label>
                  <input name="last_name" defaultValue={selectedUser.last_name} type="text" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Email</label>
                  <input readOnly defaultValue={selectedUser.email} type="email" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Phone</label>
                  <input required name="phone_number" defaultValue={selectedUser.phone_number} type="text" className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-muted uppercase tracking-widest mb-2">Role</label>
                  <select name="role" defaultValue={selectedUser.role} className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50">
                    <option value="DRIVER">Driver</option>
                    <option value="EMPLOYEE">Operations</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-black/[0.03] mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-brand-muted hover:bg-black/5 transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 rounded-xl font-bold bg-brand-orange text-white hover:bg-[#C15B2B] transition-colors shadow-[0_8px_20px_rgba(255,123,71,0.25)]">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-brand-text mb-2">Remove Personnel?</h2>
            <p className="text-sm font-medium text-brand-muted mb-6">Are you sure you want to permanently remove <strong>{selectedUser.first_name}</strong> from the organization?</p>
            <div className="mb-6">
              <label className="block text-left text-xs font-bold text-brand-text uppercase tracking-widest mb-2">Admin Password Required</label>
              <input 
                type="password" 
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                className="w-full bg-black/5 px-4 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-orange/50" 
                placeholder="Enter your password to confirm"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setIsDeleteModalOpen(false); setAdminPassword(''); }} className="flex-1 px-4 py-3 rounded-xl font-bold text-brand-muted bg-black/5 hover:bg-black/10 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal (Placeholder) */}
      {isPermissionModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-brand-surface w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-brand-text mb-2">Access Permissions</h2>
            <p className="text-sm font-medium text-brand-muted mb-6">Permission management for <strong>{selectedUser.first_name}</strong> is managed automatically via their assigned <strong>{selectedUser.role}</strong> role.</p>
            <button onClick={() => setIsPermissionModalOpen(false)} className="w-full px-4 py-3 rounded-xl font-bold text-brand-text bg-black/5 hover:bg-black/10 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
