'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Lock, Mail, User, Building, ArrowRight, UserCircle, Phone, MapPin, Hash, Users, Navigation } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Owner Info
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    // Step 2: Company Info
    company_name: '',
    registration_number: '',
    gst_number: '',
    company_address: '',
    coverage_regions: '',
    // Step 3: Fleet Info
    fleet_size: 0,
    vehicle_types: '',
    number_of_drivers: 0,
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register/logistics/', formData);
      const { access, refresh, user } = response.data.data;
      
      // Log the user in immediately
      login(access, refresh, user);
      
      // Registration successful, redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to register organization.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-6 relative overflow-hidden pt-12 pb-12">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-orange/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-lg z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand-surface border border-brand-orange/20 rounded-[1.5rem] flex items-center justify-center shadow-soft">
            <Building className="w-8 h-8 text-brand-orange" strokeWidth={1.5} />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-brand-text mb-2 tracking-tight">Register Organization</h1>
          <p className="text-brand-muted">Logistics Portal Owner Setup</p>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-between mb-8 px-8 relative">
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-brand-muted/20 -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-10 h-0.5 bg-brand-orange -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(step - 1) * 50}%` }} />
          
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${step >= s ? 'bg-brand-orange text-white' : 'bg-brand-surface border-2 border-brand-muted/20 text-brand-muted'}`}>
              {s}
            </div>
          ))}
        </div>

        <div className="bg-brand-surface rounded-[2rem] p-6 sm:p-8 shadow-soft border border-brand-muted/10">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-500 px-4 py-3 rounded-[1rem] text-sm text-center font-medium">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-semibold mb-4 border-b border-brand-muted/10 pb-2">Owner Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">First Name</label>
                    <div className="relative">
                      <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        required
                        className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 px-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      required
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Secure Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={8}
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-semibold mb-4 border-b border-brand-muted/10 pb-2">Logistics Company</h2>
                
                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Company Name</label>
                  <div className="relative">
                    <Building className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      required
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Registration #</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={formData.registration_number}
                        onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                        className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-10 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">GST Number</label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={formData.gst_number}
                        onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                        className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-10 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Company Address</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-4 top-4 text-brand-muted" strokeWidth={1.5} />
                    <textarea
                      value={formData.company_address}
                      onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                      required
                      rows={2}
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Coverage Regions</label>
                  <div className="relative">
                    <Navigation className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                    <input
                      type="text"
                      value={formData.coverage_regions}
                      onChange={(e) => setFormData({...formData, coverage_regions: e.target.value})}
                      placeholder="e.g. Pan India, North India, Maharashtra"
                      className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-lg font-semibold mb-4 border-b border-brand-muted/10 pb-2">Fleet Information</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Fleet Size</label>
                    <div className="relative">
                      <Truck className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                      <input
                        type="number"
                        min="1"
                        value={formData.fleet_size || ''}
                        onChange={(e) => setFormData({...formData, fleet_size: parseInt(e.target.value) || 0})}
                        required
                        className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Total Drivers</label>
                    <div className="relative">
                      <Users className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" strokeWidth={1.5} />
                      <input
                        type="number"
                        min="1"
                        value={formData.number_of_drivers || ''}
                        onChange={(e) => setFormData({...formData, number_of_drivers: parseInt(e.target.value) || 0})}
                        required
                        className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 pl-12 pr-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-brand-muted text-[13px] font-medium ml-2 uppercase tracking-wider">Vehicle Types</label>
                  <input
                    type="text"
                    value={formData.vehicle_types}
                    onChange={(e) => setFormData({...formData, vehicle_types: e.target.value})}
                    placeholder="e.g. 20ft Container, Open Truck, Refrigerated"
                    required
                    className="w-full bg-brand-bg/50 border border-brand-muted/20 rounded-[1.2rem] py-3 px-4 text-brand-text placeholder-brand-muted/50 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3.5 rounded-[1.2rem] font-medium border border-brand-muted/20 text-brand-text hover:bg-brand-surface/80 transition-colors"
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#C15B2B] text-white font-medium py-3.5 rounded-[1.2rem] flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity shadow-[0_8px_20px_rgba(193,91,43,0.25)] active:scale-[0.98]"
              >
                <span>{step === 3 ? (isLoading ? 'Registering...' : 'Complete Registration') : 'Next Step'}</span>
                {!isLoading && step < 3 && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => router.push('/login')}
            className="text-brand-text font-semibold text-sm hover:text-brand-orange transition-colors"
          >
            Already have an account? Login here
          </button>
        </div>
      </div>
    </div>
  );
}
