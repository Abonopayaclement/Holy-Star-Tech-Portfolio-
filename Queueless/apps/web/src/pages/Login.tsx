import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Building2, User, Eye, EyeOff, ShieldCheck, CheckCircle2, Clock, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { registerOrganization } from '../api/branch';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

type AuthMode = 'LOGIN' | 'CUSTOMER_REGISTER' | 'ORG_REGISTER';

const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Login & Customer Register states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Organization Register states
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('HOSPITAL');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgContactEmail, setOrgContactEmail] = useState('');
  const [orgContactPhone, setOrgContactPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [orgRegistrationSuccess, setOrgRegistrationSuccess] = useState<{ orgName: string; adminEmail: string } | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'CUSTOMER_REGISTER') {
        // Register customer
        await axios.post(`${API_BASE_URL}/auth/register`, {
          email,
          password,
          fullName,
          phoneNumber,
          role: 'CUSTOMER',
        });
        await login(email, password);
        navigate('/');
      } else if (authMode === 'LOGIN') {
        await login(email, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrgRegistrationSuccess(null);

    try {
      await registerOrganization({
        name: orgName,
        type: orgType,
        description: orgDescription,
        contactEmail: orgContactEmail,
        contactPhone: orgContactPhone,
        address: orgAddress,
        adminName,
        adminEmail,
        adminPassword,
      });

      setOrgRegistrationSuccess({
        orgName,
        adminEmail,
      });

      // Clear form
      setOrgName('');
      setOrgDescription('');
      setOrgContactEmail('');
      setOrgContactPhone('');
      setOrgAddress('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to register organization');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'customer' || mode === 'register') {
      setAuthMode('CUSTOMER_REGISTER');
    } else if (mode === 'org' || mode === 'organization') {
      setAuthMode('ORG_REGISTER');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
            Q
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-black text-gray-900 tracking-tight">
          QueueLess
        </h2>
        <p className="mt-1 text-center text-sm font-medium text-gray-500">
          Enterprise Queue & Appointment Platform
        </p>
      </div>

      <div className={`mt-8 sm:mx-auto sm:w-full px-4 transition-all duration-200 ${authMode === 'ORG_REGISTER' ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-gray-100">
          {/* 3-Way Mode Switcher: Sign In, New Customer, Register Organization */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => { setAuthMode('LOGIN'); setError(''); setOrgRegistrationSuccess(null); }}
              className={`flex-1 py-2 px-1 rounded-xl transition-all text-center ${
                authMode === 'LOGIN' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('CUSTOMER_REGISTER'); setError(''); setOrgRegistrationSuccess(null); }}
              className={`flex-1 py-2 px-1 rounded-xl transition-all text-center ${
                authMode === 'CUSTOMER_REGISTER' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              New Customer
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('ORG_REGISTER'); setError(''); setOrgRegistrationSuccess(null); }}
              className={`flex-1 py-2 px-1 rounded-xl transition-all text-center ${
                authMode === 'ORG_REGISTER' ? 'bg-white text-blue-700 shadow-sm font-black' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Register Organization
            </button>
          </div>

          {/* Organization Registration Success Banner */}
          {orgRegistrationSuccess && (
            <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-2xl mb-6 text-left space-y-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-black text-amber-900 text-sm">Application Submitted: Pending Approval</h4>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-wider">
                    PENDING_APPROVAL
                  </span>
                </div>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your organization <strong>{orgRegistrationSuccess.orgName}</strong> has been registered. 
                QueueLess Super Admins review all incoming organizations for verification. 
                Once approved, your administrator account (<strong>{orgRegistrationSuccess.adminEmail}</strong>) will become active and ready for login.
              </p>
              <button
                type="button"
                onClick={() => { setAuthMode('LOGIN'); setOrgRegistrationSuccess(null); }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                Proceed to Sign In Screen
              </button>
            </div>
          )}

          {/* Form for Login or Customer Register */}
          {authMode !== 'ORG_REGISTER' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              {authMode === 'CUSTOMER_REGISTER' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Abena Osei"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+233 24 123 4567"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  'Processing...'
                ) : authMode === 'CUSTOMER_REGISTER' ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" /> Create Customer Account
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" /> Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form for Organization Registration */}
          {authMode === 'ORG_REGISTER' && (
            <form className="space-y-4" onSubmit={handleOrgRegister}>
              <div className="border-b border-gray-100 pb-3 mb-2">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" /> Organization Information
                </h3>
                <p className="text-[11px] text-gray-500">
                  New organizations start in <span className="font-bold text-amber-700">PENDING_APPROVAL</span> status until reviewed by platform admins.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Bolgatanga Regional Hospital"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sector / Type *
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50 font-medium"
                  >
                    <option value="HOSPITAL">Healthcare & Hospital</option>
                    <option value="BANK">Banking & Finance</option>
                    <option value="GOVERNMENT">Government Agency</option>
                    <option value="TELECOM">Telecommunications</option>
                    <option value="EDUCATION">Education & University</option>
                    <option value="RETAIL">Retail & Service Center</option>
                    <option value="OTHER">Other Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Description / Department Details
                </label>
                <input
                  type="text"
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Primary regional healthcare facility and outpatient center"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Official Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={orgContactEmail}
                    onChange={(e) => setOrgContactEmail(e.target.value)}
                    placeholder="contact@bolgahospital.org"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Official Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={orgContactPhone}
                    onChange={(e) => setOrgContactPhone(e.target.value)}
                    placeholder="+233 38 202 2441"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Physical Address / Headquarters *
                </label>
                <input
                  type="text"
                  required
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="Hospital Road, Bolgatanga, Upper East Region, Ghana"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                />
              </div>

              <div className="border-t border-gray-100 pt-3 mt-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> Designated Organization Administrator
                </h3>
                <p className="text-[11px] text-gray-500 mb-3">
                  This user will become the Organization Admin once your organization is verified and approved.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Administrator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Dr. Kwesi Mensah"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Administrator Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="kwesi.mensah@bolgahospital.org"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Administrator Password *
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit Organization Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
