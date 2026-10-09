import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, getBranchDetails, getBranchAnalytics, getOrganizationAnalytics, getAllOrganizations, updateQueueStatus } from '../api/branch';
import { useAuth } from '../hooks/useAuth';
import CustomerPortal from './CustomerPortal';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  Layers,
  UserPlus,
  QrCode,
  Printer,
  Tv,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WalkInTicketModal from '../components/WalkInTicketModal';
import QrCodeManagerModal from '../components/QrCodeManagerModal';
import QueueClosureModal from '../components/QueueClosureModal';
import { useActiveBranch } from '../context/ActiveBranchContext';
import SuperAdminExecutiveConsole from '../components/SuperAdminExecutiveConsole';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // If customer, show Customer Portal directly
  if (user?.role === 'CUSTOMER') {
    return <CustomerPortal />;
  }

  // If Super Admin, show Executive Platform Console
  if (user?.role === 'SUPER_ADMIN') {
    return <SuperAdminExecutiveConsole />;
  }

  return <StaffAndAdminDashboard user={user} />;
};

const StaffAndAdminDashboard: React.FC<{ user: any }> = ({ user }) => {
  const [isWalkInOpen, setIsWalkInOpen] = React.useState(false);
  const [isQrOpen, setIsQrOpen] = React.useState(false);
  const [queueToClose, setQueueToClose] = React.useState<{ id: string; name: string } | null>(null);

  const { activeBranchId, canSwitchBranch, availableBranches, setActiveBranchId } = useActiveBranch();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const isOrgAdmin = user?.role === 'ORG_ADMIN';

  // 1. Fetch Organization List / Profile Org ID
  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
    enabled: isOrgAdmin,
  });

  const orgId = profile?.organizationId || orgs?.[0]?.id;

  // 2. Org Admin Analytics (Real DB Data)
  const { data: orgAnalytics, isLoading: orgLoading } = useQuery({
    queryKey: ['org-analytics', orgId],
    queryFn: () => getOrganizationAnalytics(orgId!),
    enabled: isOrgAdmin && !!orgId,
  });

  // 3. Staff / Branch Manager Branch Analytics (Real DB Data)
  const branchId = activeBranchId || profile?.staffBranchId || profile?.managedBranches?.[0]?.id;

  const { data: branch, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => getBranchDetails(branchId!),
    enabled: !isOrgAdmin && !!branchId,
  });

  const { data: branchAnalytics, isLoading: branchAnalyticsLoading } = useQuery({
    queryKey: ['branch-analytics', branchId],
    queryFn: () => getBranchAnalytics(branchId!),
    enabled: !isOrgAdmin && !!branchId,
  });

  const queryClient = useQueryClient();
  const [statusUpdatingQueueId, setStatusUpdatingQueueId] = React.useState<string | null>(null);

  const toggleQueueStatusMutation = useMutation({
    mutationFn: ({ queueId, nextStatus, closedReason }: { queueId: string; nextStatus: 'OPEN' | 'CLOSED'; closedReason?: string | null }) =>
      updateQueueStatus(queueId, nextStatus, closedReason),
    onMutate: ({ queueId }) => {
      setStatusUpdatingQueueId(queueId);
    },
    onSettled: () => {
      setStatusUpdatingQueueId(null);
      queryClient.invalidateQueries({ queryKey: ['branch', branchId] });
      queryClient.invalidateQueries({ queryKey: ['branch-analytics', branchId] });
    },
  });

  const handleToggleQueueStatus = (queueId: string, currentStatus: string, queueName: string) => {
    if (currentStatus === 'OPEN') {
      setQueueToClose({ id: queueId, name: queueName });
    } else {
      toggleQueueStatusMutation.mutate({ queueId, nextStatus: 'OPEN', closedReason: null });
    }
  };

  if (branchLoading || branchAnalyticsLoading || orgLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-24">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold">Loading real-time enterprise metrics...</p>
      </div>
    );
  }

  // A. Organization Admin Dashboard
  if (isOrgAdmin) {
    const adminStats = [
      { label: 'Total Branches', value: orgAnalytics?.totalBranches || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
      { label: 'Staff on Duty', value: orgAnalytics?.activeStaff || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100' },
      { label: 'Pending Waiting', value: orgAnalytics?.waitingEntries || 0, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50 border border-sky-100' },
      { label: 'In Processing', value: orgAnalytics?.activeServing || 0, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100' },
      { label: 'Successful Served', value: orgAnalytics?.servedToday || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
      { label: 'Cancelled / No-Show', value: orgAnalytics?.cancelledToday || 0, icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-100' },
    ];

    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live enterprise monitoring across all branch counters, staff agents, and virtual queue lines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Org Admin'}
            </span>
          </div>
        </div>

        {/* Hero Green Card (Solid, No Gradients) */}
        <div className="bg-emerald-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-white mb-3">
              <span className="text-sm font-extrabold">₵</span>
              <span>Enterprise Network Status</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                {orgAnalytics?.waitingEntries || 0}
              </span>
              <span className="text-xl md:text-2xl font-bold opacity-90">Live Waiting In Queue</span>
            </div>
            <p className="text-xs md:text-sm text-emerald-100 font-medium mt-2">
              Real-time virtual customer lines • {orgAnalytics?.totalBranches || 0} branches online
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['org-analytics'] });
                queryClient.invalidateQueries({ queryKey: ['organizations'] });
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-all backdrop-blur"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh All
            </button>
            <Link
              to="/live-queue"
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
            >
              Open Live Queues
              <ArrowRight className="w-4 h-4 text-emerald-900" />
            </Link>
          </div>
        </div>

        {/* Section: Statistics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">This Month's Statistics</h2>
            <span className="text-xs text-slate-500 font-medium">Auto-updated</span>
          </div>

          {/* 6-Card Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {adminStats.map((stat, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Cards (Solid Colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/live-queue"
            className="p-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Live Counters</p>
              <h3 className="text-lg font-extrabold mt-0.5">Open Live Queue</h3>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/appointments"
            className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Appointments</p>
              <h3 className="text-lg font-extrabold mt-0.5">Manage Bookings</h3>
            </div>
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>

          <Link
            to="/analytics"
            className="p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Analytics</p>
              <h3 className="text-lg font-extrabold mt-0.5">Operational BI</h3>
            </div>
            <BarChart2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Link>
        </div>

        {/* Real Live Audit Activity & Branch Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Real Audit Log Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Live Operation Stream</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database Audit</span>
            </div>

            {!orgAnalytics?.recentLogs || orgAnalytics.recentLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-12 text-sm">No operation logs recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {orgAnalytics.recentLogs.map((log: any) => (
                  <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl flex items-start justify-between border border-slate-200/80">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-600">{log.user?.fullName || 'System User'}</span>
                        <span className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded-full font-semibold text-slate-700">
                          {log.action}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-slate-500 mt-1 font-mono">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-4 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Management Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Tenant Management Controls</h3>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Directly configure organizational parameters, branch operating hours, service catalogs, and staff counter assignments.
              </p>

              <div className="space-y-3">
                <Link
                  to="/settings"
                  className="block p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all"
                >
                  <p className="font-bold text-slate-900 text-sm">Configure Branch Geofencing & Schedules</p>
                  <p className="text-xs text-slate-500 mt-0.5">Edit branch addresses, GPS coordinates, and daily hours.</p>
                </Link>
                <Link
                  to="/appointments"
                  className="block p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all"
                >
                  <p className="font-bold text-slate-900 text-sm">Scheduled Branch Consultations</p>
                  <p className="text-xs text-slate-500 mt-0.5">Review booked customer visits and daily confirmations.</p>
                </Link>
                <Link
                  to="/qr-management"
                  className="block p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all"
                >
                  <p className="font-bold text-slate-900 text-sm">QR Code Desk Management</p>
                  <p className="text-xs text-slate-500 mt-0.5">Generate dynamic service codes, print PDF slips, and track scans.</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // B. Staff Member / Branch Manager Dashboard
  const totalTicketsToday = (branchAnalytics?.servedToday || 0) + (branchAnalytics?.waitingEntries || 0);
  const staffStats = [
    { label: 'Total Tickets', value: totalTicketsToday, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
    { label: 'Active Desks', value: branch?.queues?.length || 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-100' },
    { label: 'Pending Waiting', value: branchAnalytics?.waitingEntries || 0, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-50 border border-sky-100' },
    { label: 'In Processing', value: branchAnalytics?.activeServing || 0, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100' },
    { label: 'Successful Served', value: branchAnalytics?.servedToday || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
    { label: 'Cancelled', value: branchAnalytics?.cancelledToday || 0, icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-100' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 overflow-x-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight truncate">Dashboard</h1>
          <div className="flex items-center text-slate-500 mt-0.5 text-xs font-medium truncate">
            <MapPin className="h-3.5 w-3.5 mr-1 text-indigo-600 shrink-0" />
            <span className="truncate">{branch?.name || 'Assigned Branch'} {branch?.location ? `— ${branch.location}` : ''}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {canSwitchBranch && (
            <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span className="text-xs font-bold text-indigo-950">Branch:</span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent border-0 text-indigo-950 font-extrabold text-xs focus:ring-0 cursor-pointer p-0 pr-2 max-w-[140px] truncate"
                title="Switch active branch dashboard"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            to={branchId ? `/kiosk/${branchId}` : '/kiosk'}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Launch Touchscreen Walk-In Kiosk"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            Kiosk
          </Link>
          <Link
            to={branchId ? `/display/${branchId}` : '/display'}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="Launch Lobby TV Display Screen"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-600" />
            Lobby TV
          </Link>
          <button
            onClick={() => setIsQrOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            QR
          </button>
        </div>
      </div>

      {/* Active Serving Session Notification Banner */}
      {(() => {
        const activeSessionEntry = branchAnalytics?.recentEntries?.find(
          (e: any) => e.status === 'SERVING' || e.status === 'CALLING'
        );
        if (!activeSessionEntry) return null;
        const isServing = activeSessionEntry.status === 'SERVING';
        return (
          <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  {isServing ? '● Active Serving Session in Progress' : '🔔 Customer Called to Desk'}
                </p>
                <p className="text-sm font-extrabold mt-0.5">
                  Ticket {activeSessionEntry.ticketNumber || `#${activeSessionEntry.position}`} — {activeSessionEntry.user?.fullName || 'Customer'} ({activeSessionEntry.queue?.service?.name})
                </p>
              </div>
            </div>
            <Link
              to="/live-queue"
              className="px-4 py-2 bg-white text-indigo-950 hover:bg-indigo-50 rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              Resume Counter Desk ➔
            </Link>
          </div>
        );
      })()}

      {/* Hero Green Card (Solid, No Gradients) */}
      <div className="bg-emerald-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold text-white mb-3">
            <span className="text-sm font-extrabold">₵</span>
            <span>Live Queue Balance</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {branchAnalytics?.waitingEntries || 0}
            </span>
            <span className="text-xl md:text-2xl font-bold opacity-90">Waiting In Line</span>
          </div>
          <p className="text-xs md:text-sm text-emerald-100 font-medium mt-2">
            Available for counter call • Est. avg wait ~{branchAnalytics?.avgWaitTimeMinutes || 10} mins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['branch'] });
              queryClient.invalidateQueries({ queryKey: ['branch-analytics'] });
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-all backdrop-blur"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh All
          </button>
          <Link
            to="/live-queue"
            className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
          >
            Call Next Customer
            <ArrowRight className="w-4 h-4 text-emerald-900" />
          </Link>
        </div>
      </div>

      {/* Section: This Month's Statistics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">This Month's Statistics</h2>
          <span className="text-xs text-slate-500 font-medium">Daily Counter Metrics</span>
        </div>

        {/* 6-Card Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {staffStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 truncate">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action Button Cards (Solid Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/live-queue"
          className="p-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Call Desk</p>
            <h3 className="text-lg font-extrabold mt-0.5">Call Next Customer</h3>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <button
          onClick={() => setIsWalkInOpen(true)}
          className="p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-between text-left group"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Ticket Issue</p>
            <h3 className="text-lg font-extrabold mt-0.5">+ Add Walk-In Ticket</h3>
          </div>
          <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <Link
          to={branchId ? `/display/${branchId}` : '/display'}
          className="p-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Display</p>
            <h3 className="text-lg font-extrabold mt-0.5">Lobby TV Screen</h3>
          </div>
          <Tv className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
      </div>

      {/* Branch Queues & Real Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Branch Active Services */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Active Service Counters</h3>
            <span className="text-xs text-slate-500 font-medium">{branch?.queues?.length || 0} Queues</span>
          </div>

          {!branch?.queues || branch.queues.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">No queues configured for this branch.</p>
          ) : (
            <div className="space-y-3">
              {branch.queues.map((q: any) => {
                const isClosed = q.status === 'CLOSED';
                const isUpdating = statusUpdatingQueueId === q.id;
                return (
                  <div key={q.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{q.service.name}</h4>
                        {isClosed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                            CLOSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            OPEN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Est. {q.service.duration || 15} mins per customer</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleQueueStatus(q.id, q.status, q.service?.name || 'Service Queue')}
                        disabled={isUpdating}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          isClosed
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdating ? '...' : isClosed ? 'Open' : 'Close'}
                      </button>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200">
                        {q._count?.entries || 0} waiting
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Customer Activity Feed from Database */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Branch Activity</h3>
            <span className="text-xs text-slate-500 font-medium">Live Feed</span>
          </div>

          {!branchAnalytics?.recentEntries || branchAnalytics.recentEntries.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">No customer queue activity recorded yet today.</p>
          ) : (
            <div className="space-y-3">
              {branchAnalytics.recentEntries.map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">
                      {entry.ticketNumber || `#${entry.position}`}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{entry.user?.fullName || 'Customer'}</p>
                      <p className="text-xs text-slate-500">{entry.queue?.service?.name}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    entry.status === 'WAITING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    entry.status === 'CALLING' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                    entry.status === 'SERVING' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Walk-In Ticket Modal */}
      {branch && (
        <WalkInTicketModal
          isOpen={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          branchId={branch.id}
          branchName={branch.name}
          services={branch.services || []}
        />
      )}

      {/* Organization QR Code Management Modal */}
      {branch && (
        <QrCodeManagerModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          branch={{
            id: branch.id,
            name: branch.name,
            qrCodeId: branch.qrCodeId,
            organizationName: branch.organization?.name,
          }}
          services={branch.services || []}
        />
      )}

      {/* Staff Queue Closure Modal with Predefined Reasons */}
      {queueToClose && (
        <QueueClosureModal
          isOpen={!!queueToClose}
          queueName={queueToClose.name}
          onClose={() => setQueueToClose(null)}
          onConfirm={async (reason) => {
            await toggleQueueStatusMutation.mutateAsync({
              queueId: queueToClose.id,
              nextStatus: 'CLOSED',
              closedReason: reason,
            });
            setQueueToClose(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
