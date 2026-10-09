import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRightLeft,
  Calendar,
  Activity,
  Zap,
  Table as TableIcon,
  Globe,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  DollarSign,
  AlertCircle,
  Building,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useActiveBranch } from '../context/ActiveBranchContext';
import { getDashboardAnalytics, downloadAnalyticsCsv } from '../api/analytics';
import { getAllOrganizations, getBranchDetails } from '../api/branch';
import {
  AnalyticsFilterParams,
  AnalyticsDateRange,
  ComprehensiveAnalyticsDashboardData,
  HourlyDemandMetric,
  DayOfWeekMetric,
  ServicePerformanceMetric,
  BranchPerformanceMetric,
  OrganizationPerformanceMetric,
  ChannelMetric,
  TransferFlowPattern,
  SystemQueueMetric,
  PlatformUserMetric,
  CounterAnalyticsMetric,
} from '../types/analytics';

type AnalyticsTab =
  | 'organizations'
  | 'branches'
  | 'queues'
  | 'staff'
  | 'appointments'
  | 'overview'
  | 'demand'
  | 'services'
  | 'channels'
  | 'table';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { activeBranchId } = useActiveBranch();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOrgAdmin = user?.role === 'ORG_ADMIN';
  const isBranchManager = user?.role === 'BRANCH_MANAGER';
  const isStaff = user?.role === 'STAFF';
  const isOrgOrSuperAdmin = isSuperAdmin || isOrgAdmin;

  // Filters State
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Tab state: default to 'organizations' for Super Admin looking across all organizations, or 'overview' for others
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(() => {
    if (isSuperAdmin) return 'organizations';
    return 'overview';
  });

  // Table search & role filters for Staff & Queues tabs
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>('ALL');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [queueSearchQuery, setQueueSearchQuery] = useState<string>('');

  // 1. Fetch organization details if admin
  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
    enabled: isOrgOrSuperAdmin,
  });

  // Effective Organization ID:
  // For Super Admin: if selectedOrgId is empty, effectiveOrgId is undefined (queries ALL orgs)
  // For Org Admin: user.organizationId
  const effectiveOrgId = isSuperAdmin
    ? (selectedOrgId || undefined)
    : (user?.organizationId || undefined);

  // Available branches based on selected org
  const currentOrg = isSuperAdmin
    ? orgs?.find((o: any) => o.id === selectedOrgId)
    : orgs?.find((o: any) => o.id === user?.organizationId);

  const availableBranches = isSuperAdmin
    ? (selectedOrgId ? currentOrg?.branches || [] : [])
    : (currentOrg?.branches || orgs?.[0]?.branches || []);

  // Default branch detection
  const effectiveBranchId = isOrgOrSuperAdmin
    ? (selectedBranchId || undefined)
    : (activeBranchId || user?.staffBranchId || user?.managedBranches?.[0]?.id);

  // 2. Fetch branch details for service dropdown
  const { data: branchDetails } = useQuery({
    queryKey: ['branch-details', effectiveBranchId],
    queryFn: () => getBranchDetails(effectiveBranchId!),
    enabled: !!effectiveBranchId,
  });

  // 3. Main Analytics Query
  const filterParams: AnalyticsFilterParams = {
    organizationId: effectiveOrgId,
    branchId: effectiveBranchId,
    serviceId: selectedServiceId || undefined,
    dateRange,
    startDate: dateRange === 'custom' && startDate ? new Date(startDate).toISOString() : undefined,
    endDate: dateRange === 'custom' && endDate ? new Date(endDate).toISOString() : undefined,
    channel: selectedChannel || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };

  const { data: analytics, isLoading, isError, error, refetch, isFetching } = useQuery<ComprehensiveAnalyticsDashboardData>({
    queryKey: ['analytics-dashboard', filterParams],
    queryFn: () => getDashboardAnalytics(filterParams),
    refetchInterval: 30000, // 30s auto-refresh
  });

  // Handle CSV Export
  const handleExportCsv = async () => {
    if (isStaff) return;
    try {
      setIsExporting(true);
      await downloadAnalyticsCsv(filterParams);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to generate CSV export. Please check permissions or try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Adjust active tab if current tab is not allowed for role
  useEffect(() => {
    if (isStaff) {
      if (activeTab !== 'overview' && activeTab !== 'demand' && activeTab !== 'services' && activeTab !== 'channels') {
        setActiveTab('overview');
      }
    } else if (isSuperAdmin && !effectiveOrgId && activeTab === 'branches') {
      setActiveTab('organizations');
    }
  }, [isStaff, isSuperAdmin, effectiveOrgId, activeTab]);

  if (user?.role === 'CUSTOMER') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-24">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 mt-2">Enterprise operational intelligence is reserved for branch personnel and system administrators.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center py-24">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-semibold text-sm">Aggregating real-time operational intelligence...</p>
      </div>
    );
  }

  if (isError) {
    const errorMsg = (error as any)?.response?.data?.error || (error as Error)?.message || 'An error occurred while fetching operational metrics.';
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-24">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Failed to load analytics</h2>
        <p className="text-gray-500 mt-2">{errorMsg}</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const overview = analytics?.overview;
  const congestion = analytics?.congestion;
  const realtime = analytics?.realtime;
  const orgList = analytics?.organizations || [];
  const branchList = analytics?.branches || [];
  const systemQueues = analytics?.systemQueues || [];
  const platformUsers = analytics?.platformUsers || [];
  const staffList = analytics?.staff || [];

  // Filtered users for Staff tab
  const filteredUsers = platformUsers.filter((u: PlatformUserMetric) => {
    const matchesRole = staffRoleFilter === 'ALL' || u.role === staffRoleFilter;
    const matchesSearch =
      !staffSearchQuery ||
      u.fullName.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.organizationName?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      u.branchName?.toLowerCase().includes(staffSearchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Filtered queues for Queues tab
  const filteredQueues = systemQueues.filter((q: SystemQueueMetric) => {
    return (
      !queueSearchQuery ||
      q.queueName.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
      q.serviceName.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
      q.branchName.toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
      q.organizationName.toLowerCase().includes(queueSearchQuery.toLowerCase())
    );
  });

  // Available tabs definition based on role and organization scope
  const availableTabs: Array<{ id: AnalyticsTab; label: string; icon: any; count?: number }> = [];

  if (isStaff) {
    availableTabs.push(
      { id: 'overview', label: 'Station Overview', icon: Activity },
      { id: 'demand', label: "Today's Rush Rhythm", icon: TrendingUp },
      { id: 'services', label: 'Service Lines', icon: Layers },
      { id: 'channels', label: 'Customer Channels', icon: ArrowRightLeft }
    );
  } else {
    // Super Admin viewing All Organizations gets Organizations tab
    if (isSuperAdmin && !effectiveOrgId) {
      availableTabs.push({ id: 'organizations', label: 'Organizations Network', icon: Globe, count: orgList.length });
    }
    // Org Admin (or Super Admin scoping into an organization) gets Branch Comparison tab
    if (effectiveOrgId && !selectedBranchId) {
      availableTabs.push({ id: 'branches', label: 'Branch Network', icon: Building2, count: branchList.length });
    }
    // All system queues
    availableTabs.push({ id: 'queues', label: isSuperAdmin && !effectiveOrgId ? 'All System Queues' : 'Branch Queues', icon: Layers, count: systemQueues.length });
    // Staff & admin performance roster
    availableTabs.push({ id: 'staff', label: isSuperAdmin && !effectiveOrgId ? 'Staff & Admins Roster' : 'Staff Productivity', icon: Users, count: platformUsers.length });
    // Appointment analytics
    availableTabs.push({ id: 'appointments', label: 'Appointments & Comms', icon: Calendar });
    // Operational overview
    availableTabs.push({ id: 'overview', label: isSuperAdmin && !effectiveOrgId ? 'Global Overview' : 'Executive Overview', icon: Activity });
    // Demand peak hours
    availableTabs.push({ id: 'demand', label: 'Demand & Peak Hours', icon: TrendingUp });
    // Services
    availableTabs.push({ id: 'services', label: 'Service Performance', icon: CheckCircle2 });
    // Channels & transfers
    availableTabs.push({ id: 'channels', label: 'Channels & Transfers', icon: ArrowRightLeft });
    // Detailed Table
    availableTabs.push({ id: 'table', label: 'Detailed Data Table', icon: TableIcon });
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 w-full min-w-0 overflow-x-hidden">
      {/* Header & Export Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-600 text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Globe className="w-3.5 h-3.5" /> Super Admin Global Intelligence
              </span>
            ) : isOrgAdmin ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Building2 className="w-3.5 h-3.5" /> Enterprise Executive Intelligence
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Activity className="w-3.5 h-3.5" /> Station Operations & Queue Pace
              </span>
            )}

            {congestion && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  congestion.status === 'NORMAL'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : congestion.status === 'BUSY'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                Queue Status: {congestion.status}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">
            {isSuperAdmin
              ? 'Platform Infrastructure & Multi-Tenant Analytics'
              : isOrgAdmin
              ? 'Organization Executive Analytics'
              : 'Desk & Service Operational Analytics'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 max-w-3xl">
            {isSuperAdmin
              ? 'Authoritative platform-wide intelligence: analyze all organizations, all queues, all staff & admin personnel, and appointment throughput across the entire network.'
              : isOrgAdmin
              ? 'Multi-branch performance metrics, departmental queues, staff productivity, service throughput, and wait-time distributions.'
              : 'Real-time queue congestion, waiting counts, counter activity, and customer arrival rhythm for your station.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>

          {!isStaff && (
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Generating CSV...' : 'Export CSV Report'}
            </button>
          )}
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Time Range Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Time Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as AnalyticsDateRange)}
              className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Previous Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Super Admin: Organization Scope */}
          {isSuperAdmin && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
                Organization Scope
              </label>
              <select
                value={selectedOrgId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedOrgId(val);
                  setSelectedBranchId('');
                  setSelectedServiceId('');
                  if (!val) {
                    setActiveTab('organizations');
                  } else {
                    setActiveTab('branches');
                  }
                }}
                className="w-full text-xs font-semibold bg-indigo-50/60 border border-indigo-200 rounded-xl px-3 py-2 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Organizations (Global Network)</option>
                {orgs?.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Branch Scope (for Super Admin & Org Admin) */}
          {isOrgOrSuperAdmin && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Branch Scope
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setSelectedServiceId('');
                }}
                className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {isSuperAdmin && !selectedOrgId ? 'All Network Branches (Aggregate)' : 'All Organization Branches (Aggregate)'}
                </option>
                {isSuperAdmin && !selectedOrgId ? (
                  orgs?.map((org: any) => (
                    <optgroup key={org.id} label={org.name}>
                      {org.branches?.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  availableBranches?.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Service Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Service Filter</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Services</option>
              {branchDetails?.services?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">Source Channel</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Channels</option>
              <option value="REMOTE">Mobile Remote Join</option>
              <option value="QR">Branch QR Code</option>
              <option value="WALK_IN">Walk-In Customer</option>
              <option value="KIOSK">Touchscreen Kiosk</option>
              <option value="STAFF_WALK_IN">Staff Walk-In</option>
              <option value="APPOINTMENT">Appointment</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 font-semibold bg-gray-50 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-0.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 font-semibold bg-gray-50 text-gray-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Live Operations Card (Platform/Branch Level) */}
      {realtime && (
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-sm border border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-700 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-base font-extrabold tracking-wide uppercase text-slate-200">
                {isSuperAdmin && !effectiveOrgId
                  ? 'Platform-Wide Live Queue Operations'
                  : 'Live Branch Counter Operations'}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Updated: {new Date(realtime.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waiting Now</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{realtime.currentlyWaiting}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Serving Now</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{realtime.currentlyServing}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Current Wait</p>
              <p className="text-2xl font-black text-slate-100 mt-1">{realtime.averageCurrentWaitMinutes} min</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Longest Wait</p>
              <p className="text-2xl font-black text-rose-400 mt-1">{realtime.longestCurrentWaitMinutes} min</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Counters</p>
              <p className="text-2xl font-black text-cyan-400 mt-1">{realtime.activeCounters} / {realtime.totalCounters}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacity Load</p>
              <p className="text-2xl font-black text-indigo-300 mt-1">{realtime.queueCapacityUtilization}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto space-x-6 text-sm font-bold">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB: ORGANIZATIONS NETWORK (SUPER ADMIN GLOBAL BENCHMARK) */}
      {/* ========================================================= */}
      {activeTab === 'organizations' && isSuperAdmin && (
        <div className="space-y-8">
          {/* Platform Multi-Tenant Summary Header */}
          <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-700/60 gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/30 text-indigo-200 uppercase tracking-wider border border-indigo-400/20">
                  Global Multi-Tenant Matrix
                </span>
                <h3 className="text-xl font-black mt-2">Platform Organizations Benchmarking</h3>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Comparative operational performance across all enterprise tenants on the Queueless infrastructure.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-indigo-300">Total Registered Tenants</span>
                <p className="text-3xl font-black text-white">{orgList.length}</p>
              </div>
            </div>

            {/* Quick Aggregate Stats across all orgs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <div>
                <p className="text-[11px] font-bold text-indigo-300 uppercase">Total Active Branches</p>
                <p className="text-2xl font-black text-white mt-1">
                  {orgList.reduce((acc: number, o: OrganizationPerformanceMetric) => acc + o.totalBranches, 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-indigo-300 uppercase">Total Platform Tickets</p>
                <p className="text-2xl font-black text-amber-300 mt-1">
                  {orgList.reduce((acc: number, o: OrganizationPerformanceMetric) => acc + o.totalTickets, 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-indigo-300 uppercase">Completed Tickets</p>
                <p className="text-2xl font-black text-emerald-300 mt-1">
                  {orgList.reduce((acc: number, o: OrganizationPerformanceMetric) => acc + o.completedTickets, 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-indigo-300 uppercase">Avg Platform Wait</p>
                <p className="text-2xl font-black text-cyan-300 mt-1">
                  {orgList.length > 0
                    ? Math.round(
                        (orgList.reduce((acc: number, o: OrganizationPerformanceMetric) => acc + o.avgWaitMinutes, 0) / orgList.length) * 10
                      ) / 10
                    : 0}{' '}
                  min
                </p>
              </div>
            </div>
          </div>

          {/* Comparative Table of All Organizations */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">All Registered Organizations</h3>
                <p className="text-xs text-gray-500">
                  Click &ldquo;Inspect Organization&rdquo; on any tenant to scope down and analyze branch details.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                {orgList.length} Organizations Analyzed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Organization</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Branches</th>
                    <th className="py-3 px-3">Volume</th>
                    <th className="py-3 px-3">Completed</th>
                    <th className="py-3 px-3">Avg Wait</th>
                    <th className="py-3 px-3">Median Wait</th>
                    <th className="py-3 px-3">Avg Service</th>
                    <th className="py-3 px-3">Completion Rate</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orgList.map((org: OrganizationPerformanceMetric) => (
                    <tr key={org.organizationId} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-gray-900">{org.organizationName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {org.organizationId.slice(0, 8)}...</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                          {org.organizationType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-gray-700">{org.totalBranches}</td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{org.totalTickets}</td>
                      <td className="py-3.5 px-3 font-bold text-emerald-600">{org.completedTickets}</td>
                      <td className="py-3.5 px-3 text-gray-700 font-mono">{org.avgWaitMinutes}m</td>
                      <td className="py-3.5 px-3 text-gray-700 font-mono">{org.medianWaitMinutes}m</td>
                      <td className="py-3.5 px-3 text-purple-600 font-mono font-semibold">{org.avgServiceMinutes}m</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, org.completionRate)}%` }}
                            />
                          </div>
                          <span className="font-bold text-emerald-600">{org.completionRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrgId(org.organizationId);
                            setSelectedBranchId('');
                            setActiveTab('branches');
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-xs"
                        >
                          Inspect <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: BRANCH NETWORK (ORG ADMIN & SUPER ADMIN DRILLDOWN)  */}
      {/* ========================================================= */}
      {activeTab === 'branches' && !isStaff && (
        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Branch Network Performance Matrix</h3>
              <p className="text-xs text-gray-500">
                Comparative throughput, wait duration, queue capacity utilization, and completion rates per branch.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
              {branchList.length} Branches Reported
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Queue Load</th>
                  <th className="py-3 px-3">Total Volume</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">Avg Wait</th>
                  <th className="py-3 px-3">Median Wait</th>
                  <th className="py-3 px-3">Avg Service</th>
                  <th className="py-3 px-3">Completion Rate</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branchList.map((b: BranchPerformanceMetric) => (
                  <tr key={b.branchId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-gray-900">{b.branchName}</td>
                    <td className="py-3.5 px-3 text-gray-500">{b.location}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.queueUtilization > 75
                            ? 'bg-rose-100 text-rose-700'
                            : b.queueUtilization > 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {b.queueUtilization}% Load
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-900">{b.totalTickets}</td>
                    <td className="py-3.5 px-3 text-emerald-600 font-bold">{b.completedTickets}</td>
                    <td className="py-3.5 px-3 text-gray-700 font-mono">{b.avgWaitMinutes}m</td>
                    <td className="py-3.5 px-3 text-gray-700 font-mono">{b.medianWaitMinutes}m</td>
                    <td className="py-3.5 px-3 text-purple-600 font-mono font-semibold">{b.avgServiceMinutes}m</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600">{b.completionRate}%</td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedBranchId(b.branchId);
                          setActiveTab('overview');
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-xs"
                      >
                        Filter <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: SYSTEM QUEUES (SUPER ADMIN & ORG ADMIN MANAGEMENT)   */}
      {/* ========================================================= */}
      {activeTab === 'queues' && !isStaff && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isSuperAdmin && !effectiveOrgId ? 'System-Wide Queue Inventory & Health' : 'Branch Queues'}
                </h3>
                <p className="text-xs text-gray-500">
                  Live status, queue capacities, waiting backlog, and capacity utilization across all service lines.
                </p>
              </div>

              {/* Queue Search Filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter queue or branch..."
                  value={queueSearchQuery}
                  onChange={(e) => setQueueSearchQuery(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Queue & Service</th>
                    {isSuperAdmin && !effectiveOrgId && <th className="py-3 px-3">Organization</th>}
                    <th className="py-3 px-3">Branch</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Capacity</th>
                    <th className="py-3 px-3">Waiting Now</th>
                    <th className="py-3 px-3">Serving Now</th>
                    <th className="py-3 px-3">Capacity Load</th>
                    <th className="py-3 px-3">Avg Current Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredQueues.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-400">
                        No queues match the current scope or search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredQueues.map((q: SystemQueueMetric) => (
                      <tr key={q.queueId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-gray-900">{q.queueName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Service: {q.serviceName}</p>
                        </td>
                        {isSuperAdmin && !effectiveOrgId && (
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              {q.organizationName}
                            </span>
                          </td>
                        )}
                        <td className="py-3.5 px-3 font-semibold text-gray-700">{q.branchName}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.status === 'OPEN'
                                ? 'bg-emerald-100 text-emerald-700'
                                : q.status === 'PAUSED'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-700 font-mono">{q.capacity} max</td>
                        <td className="py-3.5 px-3 font-bold text-amber-600 font-mono">{q.waitingCount}</td>
                        <td className="py-3.5 px-3 font-bold text-emerald-600 font-mono">{q.servingCount}</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  q.utilizationPercent > 75 ? 'bg-rose-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${Math.min(100, q.utilizationPercent)}%` }}
                              />
                            </div>
                            <span className="font-mono text-gray-700 font-semibold">{q.utilizationPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-gray-800">{q.avgWaitMinutes}m</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: STAFF & ADMINS ROSTER (SUPER ADMIN & ORG ADMIN)      */}
      {/* ========================================================= */}
      {activeTab === 'staff' && !isStaff && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {isSuperAdmin && !effectiveOrgId
                    ? 'Platform Administrators & Staff Roster'
                    : 'Organization Personnel & Productivity'}
                </h3>
                <p className="text-xs text-gray-500">
                  Administrative oversight, operational assignments, and tickets handled across service counters.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={staffRoleFilter}
                  onChange={(e) => setStaffRoleFilter(e.target.value)}
                  className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admins</option>
                  <option value="ORG_ADMIN">Org Admins</option>
                  <option value="BRANCH_MANAGER">Branch Managers</option>
                  <option value="STAFF">Counter Staff</option>
                </select>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Personnel</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Organization</th>
                    <th className="py-3 px-3">Branch Assignment</th>
                    <th className="py-3 px-3">Tickets Served</th>
                    <th className="py-3 px-3">Tickets Completed</th>
                    <th className="py-3 px-3">Member Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        No personnel match the selected role or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: PlatformUserMetric) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-gray-900">{u.fullName}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'ORG_ADMIN'
                                ? 'bg-blue-100 text-blue-800'
                                : u.role === 'BRANCH_MANAGER'
                                ? 'bg-cyan-100 text-cyan-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-gray-700 font-medium">
                          {u.organizationName || 'Platform Core'}
                        </td>
                        <td className="py-3.5 px-3 text-gray-500">
                          {u.branchName || 'Unassigned / Global'}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-blue-600 font-mono">
                          {u.ticketsServed || 0}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-600 font-mono">
                          {u.ticketsCompleted || 0}
                        </td>
                        <td className="py-3.5 px-3 text-gray-400 font-mono">
                          {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: APPOINTMENTS & COMMS (ADMIN & MANAGER)               */}
      {/* ========================================================= */}
      {activeTab === 'appointments' && !isStaff && analytics?.appointments && (
        <div className="space-y-8">
          {/* Appointment Lifecycle Metrics */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {isSuperAdmin && !effectiveOrgId
                ? 'Platform-Wide Appointment Lifecycle & Resolutions'
                : 'Appointment Consultations & Resolutions'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">Booking conversion, approval rates, and consultation follow-ups.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total Booked</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{analytics.appointments.totalAppointments}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Approval Rate</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.appointments.approvalRate}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Completion Rate</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{analytics.appointments.completionRate}%</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Follow-Up Resolved</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">{analytics.appointments.followUps.resolutionRate}%</p>
              </div>
            </div>
          </div>

          {/* Rejection Reasons */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">Appointment Rejection Reasons</h3>
            <p className="text-xs text-gray-500 mb-4">Direct factual measurements recorded during consultation triage.</p>

            {analytics.appointments.rejectionReasons.length === 0 ? (
              <p className="text-gray-400 text-center py-6 text-xs">No rejected appointments in this period.</p>
            ) : (
              <div className="space-y-2">
                {analytics.appointments.rejectionReasons.map((r: { reason: string; count: number }, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs border border-gray-100">
                    <span className="font-semibold text-gray-800">{r.reason}</span>
                    <span className="font-mono font-bold text-rose-600">{r.count} rejections</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Communication & Callback Effectiveness */}
          {analytics.communication && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">Notification Multi-Channel Delivery</h3>
                <div className="space-y-3">
                  {analytics.communication.notifications.byChannel.map((ch: { channel: string; total: number; delivered: number; opened: number; failed: number }) => (
                    <div key={ch.channel} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between text-xs border border-gray-100">
                      <span className="font-bold text-gray-700">{ch.channel}</span>
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>Sent: <strong>{ch.total}</strong></span>
                        <span>Delivered: <strong className="text-emerald-600">{ch.delivered}</strong></span>
                        <span>Opened: <strong className="text-blue-600">{ch.opened}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">Virtual Callback Responsiveness</h3>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center space-y-2">
                  <p className="text-xs text-gray-500">Callback Acknowledgement Rate</p>
                  <p className="text-3xl font-black text-blue-600">{analytics.communication.callbacks.acknowledgementRate}%</p>
                  <p className="text-xs text-gray-400">
                    {analytics.communication.callbacks.acknowledged} acknowledged out of {analytics.communication.callbacks.triggered} triggered.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: EXECUTIVE / STATION OVERVIEW                         */}
      {/* ========================================================= */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-8">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {isStaff ? 'Station Queue Volume' : 'Total Customer Tickets'}
                </p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{overview.totalTickets}</p>
                <p className="text-xs text-gray-500 mt-0.5">{overview.waitingTickets} waiting, {overview.servingTickets} serving</p>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Completed Tickets</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{overview.completedTickets}</p>
                <p className="text-xs text-emerald-600 font-bold mt-0.5">{overview.completionRate}% completion rate</p>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Avg Wait Time</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{overview.waitTimeMinutes.avg} min</p>
                <p className="text-xs text-gray-500 mt-0.5">Median: {overview.waitTimeMinutes.p50}m | P90: {overview.waitTimeMinutes.p90}m</p>
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3.5 rounded-2xl bg-purple-50 text-purple-600">
                <Zap className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total & Avg Service Time</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-gray-900">
                    {overview.serviceTimeMinutes.total ?? (Math.round((overview.serviceTimeMinutes.avg * (overview.serviceTimeMinutes.sampleSize || overview.completedTickets)) * 10) / 10)} min
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Total Served
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Avg: <strong>{overview.serviceTimeMinutes.avg}m / ticket</strong> • P50: {overview.serviceTimeMinutes.p50}m
                </p>
              </div>
            </div>
          </div>

          {/* STAFF-SCOPED VIEW: Active Desks & Operational Flow */}
          {isStaff ? (
            <div className="space-y-6">
              {/* Queue Congestion Station Card */}
              {congestion && (
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Activity className="w-4 h-4" />
                      </span>
                      <h3 className="text-base font-bold text-gray-900">Station Queue Congestion & Velocity</h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        congestion.status === 'NORMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : congestion.status === 'BUSY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {congestion.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">{congestion.thresholdExplanation}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Arrivals / Hour</p>
                      <p className="text-2xl font-black text-blue-600 mt-1">{congestion.arrivalRatePerHour}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Completions / Hour</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{congestion.completionRatePerHour}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Capacity Load</p>
                      <p className="text-2xl font-black text-indigo-600 mt-1">{congestion.capacityUtilization}%</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                      <p className="text-[10px] font-bold uppercase text-gray-400">Active Counters</p>
                      <p className="text-2xl font-black text-cyan-600 mt-1">{congestion.activeCounters}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Counters at Station */}
              {analytics.counters && analytics.counters.length > 0 && (
                <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Branch Counter Desks Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analytics.counters.map((c: CounterAnalyticsMetric) => (
                      <div key={c.counterId} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Counter #{c.counterNumber}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Tickets Served: <strong>{c.ticketsServed}</strong></p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            c.status === 'SERVING'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'OPEN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ADMIN VIEW: Percentile Breakdown */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              <div className="p-5 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">Wait-Time Percentile Outliers</h3>
                  <span className="text-xs text-gray-400 font-mono">Sample Size: {overview.waitTimeMinutes.sampleSize}</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  Percentiles reveal real customer wait experience without average skew.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center min-w-0">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P50 (Median)">P50 (Median)</p>
                    <p className="text-sm sm:text-base font-black text-blue-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.waitTimeMinutes.p50}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P75">P75</p>
                    <p className="text-sm sm:text-base font-black text-indigo-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.waitTimeMinutes.p75}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P90">P90</p>
                    <p className="text-sm sm:text-base font-black text-amber-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.waitTimeMinutes.p90}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P95 (Outliers)">P95 (Outliers)</p>
                    <p className="text-sm sm:text-base font-black text-rose-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.waitTimeMinutes.p95}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Fastest Called: <strong className="text-gray-900">{overview.waitTimeMinutes.min}m</strong></span>
                  <span>Longest Recorded: <strong className="text-gray-900">{overview.waitTimeMinutes.max}m</strong></span>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-white rounded-3xl border border-gray-100 shadow-sm min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900">Observed Service Duration Distribution</h3>
                  <span className="text-xs text-gray-400 font-mono">Sample Size: {overview.serviceTimeMinutes.sampleSize}</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  Actual elapsed counter consultation time recorded from staff service starts to completion.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center min-w-0">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P50 (Median)">P50 (Median)</p>
                    <p className="text-sm sm:text-base font-black text-purple-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.serviceTimeMinutes.p50}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P75">P75</p>
                    <p className="text-sm sm:text-base font-black text-purple-700 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.serviceTimeMinutes.p75}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P90">P90</p>
                    <p className="text-sm sm:text-base font-black text-amber-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.serviceTimeMinutes.p90}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-center items-center overflow-hidden min-w-0">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate w-full text-center" title="P95 (Outliers)">P95 (Outliers)</p>
                    <p className="text-sm sm:text-base font-black text-rose-600 mt-1 truncate max-w-full text-center tracking-tight leading-tight">
                      {overview.serviceTimeMinutes.p95}<span className="text-xs font-semibold ml-0.5">m</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Fastest Consult: <strong className="text-gray-900">{overview.serviceTimeMinutes.min}m</strong></span>
                  <span>Longest Consult: <strong className="text-gray-900">{overview.serviceTimeMinutes.max}m</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DEMAND & PEAK HOURS                                  */}
      {/* ========================================================= */}
      {activeTab === 'demand' && analytics && (
        <div className="space-y-8">
          {/* Hourly Demand Bar Chart */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {isStaff ? "Today's Hourly Customer Rush Rhythm" : "Hourly Customer Demand & Peak Volume"}
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Identifies peak operating hours based on recorded ticket arrival times throughout the day.
            </p>

            <div className="h-64 flex items-end gap-1.5 pt-8 pb-4 overflow-x-auto">
              {analytics.hourlyDemand.map((bucket: HourlyDemandMetric) => {
                const maxTickets = Math.max(...analytics.hourlyDemand.map((b: HourlyDemandMetric) => b.ticketCount), 1);
                const heightPercent = Math.max(5, (bucket.ticketCount / maxTickets) * 100);
                const isPeak = bucket.ticketCount === maxTickets && bucket.ticketCount > 0;

                return (
                  <div key={bucket.hour} className="flex-1 min-w-[32px] flex flex-col items-center h-full justify-end group relative">
                    <span className="text-[10px] font-bold text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {bucket.ticketCount}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all ${
                        isPeak ? 'bg-rose-500' : bucket.ticketCount > 0 ? 'bg-blue-600 group-hover:bg-blue-700' : 'bg-gray-100'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-gray-400 mt-2 truncate">
                      {String(bucket.hour).padStart(2, '0')}h
                    </span>

                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-slate-900 text-white text-[11px] p-2 rounded-xl shadow-lg whitespace-nowrap">
                      <p className="font-bold">{bucket.hourLabel}</p>
                      <p>Tickets: {bucket.ticketCount}</p>
                      <p>Completed: {bucket.completedCount}</p>
                      <p>Avg Wait: {bucket.avgWaitMinutes}m</p>
                      <p>Avg Service: {bucket.avgServiceMinutes}m</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day of Week Distribution */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">Day of Week Distribution</h3>
            <p className="text-xs text-gray-500 mb-6">Aggregate customer volume and wait metrics grouped across days of the week.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {analytics.dayOfWeek.map((day: DayOfWeekMetric) => (
                <div key={day.dayOfWeek} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-xs font-bold text-gray-500">{day.dayName}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1">{day.ticketCount}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Avg Wait: <strong className="text-gray-700">{day.avgWaitMinutes}m</strong></p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">{day.completionRate}% completed</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: SERVICE PERFORMANCE                                  */}
      {/* ========================================================= */}
      {activeTab === 'services' && analytics && (
        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">Service Performance Comparisons</h3>
              <p className="text-xs text-gray-500 mt-0.5">Factual measurements of customer demand, wait duration, and throughput per service line.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Service Line</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Volume</th>
                  <th className="py-3 px-3">Completed</th>
                  <th className="py-3 px-3">Avg Wait</th>
                  <th className="py-3 px-3">Median Wait</th>
                  <th className="py-3 px-3">P90 Wait</th>
                  <th className="py-3 px-3">Avg Service Time</th>
                  <th className="py-3 px-3">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analytics.services.map((s: ServicePerformanceMetric) => (
                  <tr key={s.serviceId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-gray-900">{s.serviceName}</td>
                    <td className="py-3.5 px-3 text-gray-500">{s.branchName}</td>
                    <td className="py-3.5 px-3 font-semibold text-gray-700">{s.totalTickets}</td>
                    <td className="py-3.5 px-3 text-emerald-600 font-semibold">{s.completedTickets}</td>
                    <td className="py-3.5 px-3 text-gray-700">{s.avgWaitMinutes} min</td>
                    <td className="py-3.5 px-3 text-gray-700">{s.medianWaitMinutes} min</td>
                    <td className="py-3.5 px-3 text-amber-600 font-bold">{s.p90WaitMinutes} min</td>
                    <td className="py-3.5 px-3 text-gray-700">{s.avgServiceMinutes} min</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600">{s.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: CHANNELS & TRANSFERS                                 */}
      {/* ========================================================= */}
      {activeTab === 'channels' && analytics && (
        <div className="space-y-8">
          {/* Channel Usage Breakdown */}
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">Customer Channel Acquisition</h3>
            <p className="text-xs text-gray-500 mb-6">How customers enter the queue system (Remote, Kiosk, Walk-In, QR scan).</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.channels.map((ch: ChannelMetric) => (
                <div key={ch.channel} className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900">{ch.label}</p>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {ch.percentage}%
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mt-2">{ch.volume} tickets</p>
                  <div className="mt-3 pt-3 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Avg Wait: <strong className="text-gray-800">{ch.avgWaitMinutes}m</strong></span>
                    <span>Completion: <strong className="text-emerald-600">{ch.completionRate}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfers Intelligence (Admins only) */}
          {!isStaff && analytics.transfers && (
            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Service Line Transfer Flow</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Identifies operational service re-routings and cross-department transfers.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {analytics.transfers.totalTransfers} Total Transfers ({analytics.transfers.transferRate}%)
                </span>
              </div>

              {analytics.transfers.flowPatterns.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-xs">No service transfers recorded in this period.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.transfers.flowPatterns.map((f: TransferFlowPattern, i: number) => (
                    <div key={i} className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{f.sourceServiceName}</span>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-bold text-blue-600">{f.destServiceName}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-200">
                        {f.transferCount} transfers
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DETAILED DATA TABLE (ADMIN ONLY)                     */}
      {/* ========================================================= */}
      {activeTab === 'table' && !isStaff && analytics && (
        <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Underlying Operational Metrics Table</h3>
              <p className="text-xs text-gray-500">Accessible representation of all core intelligence metrics for this reporting period.</p>
            </div>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-gray-600 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Metric Dimension</th>
                  <th className="py-2.5 px-3">Recorded Value</th>
                  <th className="py-2.5 px-3">Statistical Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">Total Customer Tickets</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{overview?.totalTickets}</td>
                  <td className="py-2.5 px-3 text-gray-500">All entries registered in reporting period</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">Completed Service Tickets</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{overview?.completedTickets}</td>
                  <td className="py-2.5 px-3 text-gray-500">Completion rate: {overview?.completionRate}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">Cancelled / Abandoned Tickets</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{overview?.cancelledTickets}</td>
                  <td className="py-2.5 px-3 text-gray-500">Cancellation rate: {overview?.cancellationRate}%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">Average Wait Duration</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{overview?.waitTimeMinutes.avg} minutes</td>
                  <td className="py-2.5 px-3 text-gray-500">Mean elapsed time from join to call</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">Median Wait Duration (P50)</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-800">{overview?.waitTimeMinutes.p50} minutes</td>
                  <td className="py-2.5 px-3 text-gray-500">50th percentile (typical customer experience)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">90th Percentile Wait (P90)</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-600">{overview?.waitTimeMinutes.p90} minutes</td>
                  <td className="py-2.5 px-3 text-gray-500">90% of customers waited less than this</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-bold text-gray-900">Average Service Consultation Duration</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-purple-600">{overview?.serviceTimeMinutes.avg} minutes</td>
                  <td className="py-2.5 px-3 text-gray-500">Mean counter consultation elapsed time</td>
                </tr>
                {analytics.transfers && (
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-gray-900">Service Line Transfers</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{analytics.transfers.totalTransfers}</td>
                    <td className="py-2.5 px-3 text-gray-500">{analytics.transfers.transferRate}% transfer rate</td>
                  </tr>
                )}
                {analytics.communication && (
                  <>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-gray-900">Virtual Callback Acknowledgements</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-600">{analytics.communication.callbacks.acknowledgementRate}%</td>
                      <td className="py-2.5 px-3 text-gray-500">{analytics.communication.callbacks.acknowledged} of {analytics.communication.callbacks.triggered} acknowledged</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-bold text-gray-900">Notification Delivery Success</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{analytics.communication.notifications.deliveryRate}%</td>
                      <td className="py-2.5 px-3 text-gray-500">Delivered notifications across configured channels</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
