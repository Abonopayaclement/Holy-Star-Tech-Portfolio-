import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  LogOut, 
  Ticket,
  Menu,
  X,
  Building2,
  UserCheck,
  Tv,
  QrCode,
  BarChart2,
  Settings
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActiveBranch } from '../context/ActiveBranchContext';
import NotificationBellPopover from './NotificationBellPopover';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activeBranchId, activeBranch, availableBranches, canSwitchBranch, setActiveBranchId } = useActiveBranch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCustomer = user?.role === 'CUSTOMER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOrgAdmin = user?.role === 'ORG_ADMIN';

  // Role-appropriate navigation
  const navItems = isCustomer
    ? [
        { to: '/', icon: Ticket, label: 'Tickets & Bookings' },
      ]
    : isSuperAdmin
    ? [
        { to: '/', icon: LayoutDashboard, label: 'Executive Console' },
        { to: '/organizations', icon: Building2, label: 'Organizations' },
        { to: '/queues', icon: Users, label: 'Queues Oversight' },
        { to: '/appointments', icon: Calendar, label: 'Appointments' },
        { to: '/staff', icon: UserCheck, label: 'Personnel' },
        { to: '/analytics', icon: BarChart2, label: 'Platform Analytics' },
      ]
    : isOrgAdmin
    ? [
        { to: '/', icon: LayoutDashboard, label: 'Organization Console' },
        { to: '/live-queue', icon: Users, label: 'Queue Operations' },
        { to: '/appointments', icon: Calendar, label: 'Appointments' },
        { to: '/qr-management', icon: QrCode, label: 'QR Management' },
        { to: '/analytics', icon: BarChart2, label: 'Organization Analytics' },
        { to: '/settings', icon: Settings, label: 'Settings' },
      ]
    : [
        { to: '/', icon: LayoutDashboard, label: 'Branch Dashboard' },
        { to: '/live-queue', icon: Users, label: 'Live Queue Counter' },
        { to: '/qr-management', icon: QrCode, label: 'Branch QR Codes' },
        { to: '/appointments', icon: Calendar, label: 'Appointments' },
        { to: '/display', icon: Tv, label: 'Lobby TV Display' },
        { to: '/analytics', icon: BarChart2, label: 'Operational Analytics' },
      ];

  const roleLabel = isCustomer
    ? 'Customer'
    : isSuperAdmin
    ? 'Super Admin'
    : isOrgAdmin
    ? 'Organization Admin'
    : user?.role === 'BRANCH_MANAGER'
    ? 'Branch Manager'
    : 'Staff Member';

  const userInitial = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="flex h-screen w-full max-w-full bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sleek White Sidebar for Desktop */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col select-none shrink-0">
        {/* Brand Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/20">
              Q
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">QueueLess</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise Platform</p>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="mt-6 flex flex-col items-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm ring-4 ring-indigo-500/10 mb-2.5">
              {userInitial}
            </div>
            <p className="text-sm font-bold text-slate-900 tracking-tight text-center truncate w-full">
              {user?.fullName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium text-center truncate w-full mt-0.5">
              {user?.email}
            </p>
            <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              {roleLabel}
            </span>
            {activeBranch && !isSuperAdmin && (
              <div className="mt-2 w-full pt-2 border-t border-slate-200 flex items-center justify-center text-[11px] font-bold text-indigo-700 truncate px-1">
                <Building2 className="w-3 h-3 mr-1 text-indigo-500 shrink-0" />
                <span className="truncate">{activeBranch.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm scale-[1.01]' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Sign Out */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden bg-slate-50">
        {/* Top Navbar */}
        <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0 z-10 min-w-0">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="md:hidden flex items-center space-x-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                Q
              </div>
              <span className="font-black text-slate-900">QueueLess</span>
            </div>
            <div className="hidden md:flex items-center space-x-3 min-w-0 truncate">
              <span className="text-sm font-medium text-slate-600 truncate">
                Welcome back, <strong className="text-slate-900 font-bold">{user?.fullName || user?.email?.split('@')[0]}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink-0">
            {/* Branch Switcher for Managers (Super Admin is platform-wide and does not operate a branch) */}
            {!isCustomer && !isSuperAdmin && canSwitchBranch && (
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1 shadow-sm hover:border-slate-300 transition-colors">
                <Building2 className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Active Branch</span>
                  <select
                    value={activeBranchId}
                    onChange={(e) => setActiveBranchId(e.target.value)}
                    className="bg-transparent border-0 p-0 text-xs font-bold text-slate-900 focus:ring-0 cursor-pointer outline-none max-w-[120px] sm:max-w-[190px] truncate"
                    title="Switch active branch"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Static Branch Badge for Ordinary Staff */}
            {!isCustomer && !isSuperAdmin && !canSwitchBranch && activeBranch && (
              <div className="hidden sm:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1 shadow-sm">
                <Building2 className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Branch</span>
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[120px] md:max-w-[180px]">
                    {activeBranch.name}
                  </span>
                </div>
              </div>
            )}

            <NotificationBellPopover />

            <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-indigo-500/20 shrink-0">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shadow-xl z-20">
            {canSwitchBranch && !isSuperAdmin && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3">
                <div className="flex items-center mb-1 text-slate-500 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  <span>Switch Branch</span>
                </div>
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900"
                >
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
