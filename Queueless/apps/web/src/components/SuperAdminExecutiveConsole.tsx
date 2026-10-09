import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  BarChart2, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  UserCheck, 
  RefreshCw, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { getExecutiveAnalytics } from '../api/branch';

export const SuperAdminExecutiveConsole: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<string>('last_7_days');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['executive-analytics', selectedPeriod],
    queryFn: () => getExecutiveAnalytics(selectedPeriod),
  });

  const kpis = data?.kpis || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    pendingOrganizations: 0,
    totalBranches: 0,
    totalStaff: 0,
    totalCustomers: 0,
    totalQueues: 0,
    totalQueueEntries: 0,
    queuesServed: 0,
    queuesNotServed: 0,
    queuesCancelled: 0,
    customersCurrentlyWaiting: 0,
    customersCurrentlyServing: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    pendingAppointments: 0,
  };

  const usageTrends = data?.usageTrends || [];
  const topOrgs = data?.topOrganizations || [];
  const topBranches = data?.topBranches || [];
  const completionRates = data?.completionRates || {
    queueCompletionRate: 0,
    queueCancellationRate: 0,
    appointmentCompletionRate: 0,
  };
  const peakHours = data?.peakHours || [];
  const maxTrendQueues = Math.max(...usageTrends.map((t: any) => t.queuesCreated), 1);
  const maxPeakHour = Math.max(...peakHours.map((p: any) => p.count), 1);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Executive Platform Console
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                  Global Oversight
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Real-time enterprise metrics, multi-tenant branch distribution, and platform health telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex items-center text-xs font-bold">
            {[
              { id: 'today', label: 'Today' },
              { id: 'last_7_days', label: '7 Days' },
              { id: 'last_30_days', label: '30 Days' },
              { id: 'last_90_days', label: '90 Days' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm transition-all"
            title="Refresh Platform Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Pending Approvals Urgent Alert Banner */}
      {kpis.pendingOrganizations > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {kpis.pendingOrganizations} Organization{kpis.pendingOrganizations > 1 ? 's' : ''} Awaiting Approval
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                New enterprise tenants have registered and require Super Admin verification before activation.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/organizations?tab=pending')}
            className="px-4 py-2 bg-white text-amber-900 text-xs font-black rounded-xl hover:bg-amber-50 transition-all shadow-sm shrink-0 self-start sm:self-auto flex items-center space-x-1"
          >
            <span>Review Pending Organizations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Platform Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Organizations', count: `${kpis.totalOrganizations} Tenants`, to: '/organizations', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Branches', count: `${kpis.totalBranches} Locations`, to: '/organizations', icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Staff Roster', count: `${kpis.totalStaff} Personnel`, to: '/staff', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Queue Oversight', count: `${kpis.customersCurrentlyWaiting} Waiting`, to: '/queues', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Appointments', count: `${kpis.totalAppointments} Booked`, to: '/appointments', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Platform Analytics', count: 'BI Deep Dive', to: '/analytics', icon: BarChart2, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((action, i) => (
          <Link
            key={i}
            to={action.to}
            className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-xl ${action.bg} flex items-center justify-center ${action.color}`}>
                <action.icon className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{action.label}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{action.count}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main KPI Grid (14 Mandatory Platform KPIs) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Platform-Wide Key Performance Indicators
          </h2>
          <span className="text-xs text-slate-400 font-medium">Aggregated across all registered tenants</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* 1. Total Organizations */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Organizations</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalOrganizations}</p>
            <span className="text-[11px] text-slate-500 mt-1">Platform tenants</span>
          </div>

          {/* 2. Active Organizations */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Active Organizations</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">{kpis.activeOrganizations}</p>
            <span className="text-[11px] text-emerald-600/80 mt-1">Verified & running</span>
          </div>

          {/* 3. Total Branches */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Branches</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalBranches}</p>
            <span className="text-[11px] text-slate-500 mt-1">Operating centers</span>
          </div>

          {/* 4. Total Staff */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Staff</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalStaff}</p>
            <span className="text-[11px] text-slate-500 mt-1">Personnel accounts</span>
          </div>

          {/* 5. Total Customers */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Customers</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalCustomers}</p>
            <span className="text-[11px] text-slate-500 mt-1">Registered users</span>
          </div>

          {/* 6. Total Queues */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Queues</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalQueues}</p>
            <span className="text-[11px] text-slate-500 mt-1">Configured services</span>
          </div>

          {/* 7. Customers Currently Waiting */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Currently Waiting</span>
            <p className="text-2xl font-black text-amber-700 mt-2">{kpis.customersCurrentlyWaiting}</p>
            <span className="text-[11px] text-amber-600 mt-1">Live in queues</span>
          </div>

          {/* 8. Queues Served (Completed) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Queues Served</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">{kpis.queuesServed}</p>
            <span className="text-[11px] text-slate-500 mt-1">Completed tickets</span>
          </div>

          {/* 9. Queues Not Served */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Queues Not Served</span>
            <p className="text-2xl font-black text-slate-700 mt-2">{kpis.queuesNotServed}</p>
            <span className="text-[11px] text-slate-500 mt-1">Skipped / absent</span>
          </div>

          {/* 10. Queues Cancelled */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Queues Cancelled</span>
            <p className="text-2xl font-black text-rose-600 mt-2">{kpis.queuesCancelled}</p>
            <span className="text-[11px] text-rose-600/70 mt-1">Customer / timeout</span>
          </div>

          {/* 11. Total Appointments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Appointments</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{kpis.totalAppointments}</p>
            <span className="text-[11px] text-slate-500 mt-1">Total booked</span>
          </div>

          {/* 12. Completed Appointments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Completed Appts</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">{kpis.completedAppointments}</p>
            <span className="text-[11px] text-slate-500 mt-1">Finished sessions</span>
          </div>

          {/* 13. Cancelled Appointments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Cancelled Appts</span>
            <p className="text-2xl font-black text-rose-600 mt-2">{kpis.cancelledAppointments}</p>
            <span className="text-[11px] text-slate-500 mt-1">Rejections & cancels</span>
          </div>

          {/* 14. Pending Appointments */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Pending Appts</span>
            <p className="text-2xl font-black text-indigo-600 mt-2">{kpis.pendingAppointments}</p>
            <span className="text-[11px] text-slate-500 mt-1">Awaiting review</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section: Usage Trends & Operational Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Trends Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">Platform Usage Trends</h3>
              </div>
              <p className="text-xs text-slate-500">
                Tickets created, customers served, and active organizations over {selectedPeriod.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-1.5" />
                Created
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                Served
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                Appts
              </span>
            </div>
          </div>

          {/* Bar Trend Graph */}
          {usageTrends.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No trend data available for this range.</div>
          ) : (
            <div className="pt-6">
              <div className="h-56 flex items-end gap-2 sm:gap-4 overflow-x-auto pb-2">
                {usageTrends.map((t: any, idx: number) => {
                  const createdPct = Math.round((t.queuesCreated / maxTrendQueues) * 100);
                  const servedPct = Math.round((t.customersServed / maxTrendQueues) * 100);
                  const apptPct = Math.round((t.appointments / maxTrendQueues) * 100);

                  return (
                    <div key={idx} className="flex-1 min-w-[38px] flex flex-col items-center h-full justify-end group">
                      {/* Bar Group */}
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Created bar */}
                        <div
                          style={{ height: `${Math.max(createdPct, 4)}%` }}
                          className="w-2.5 sm:w-3.5 bg-indigo-600 rounded-t-md group-hover:bg-indigo-700 transition-all relative"
                          title={`Created: ${t.queuesCreated}`}
                        />
                        {/* Served bar */}
                        <div
                          style={{ height: `${Math.max(servedPct, 4)}%` }}
                          className="w-2.5 sm:w-3.5 bg-emerald-500 rounded-t-md group-hover:bg-emerald-600 transition-all"
                          title={`Served: ${t.customersServed}`}
                        />
                        {/* Appointments bar */}
                        <div
                          style={{ height: `${Math.max(apptPct, 4)}%` }}
                          className="w-2.5 sm:w-3.5 bg-amber-400 rounded-t-md group-hover:bg-amber-500 transition-all"
                          title={`Appointments: ${t.appointments}`}
                        />
                      </div>

                      {/* Label */}
                      <span className="text-[10px] font-bold text-slate-400 mt-2 truncate w-full text-center">
                        {t.label.split(',')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Platform Completion Ratios & Peak Hours */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight mb-4">
              Efficiency & Peak Telemetry
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Queue Completion Rate</span>
                  <span className="text-emerald-600">{completionRates.queueCompletionRate}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completionRates.queueCompletionRate}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Queue Cancellation Rate</span>
                  <span className="text-rose-600">{completionRates.queueCancellationRate}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completionRates.queueCancellationRate}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Appointment Completion Rate</span>
                  <span className="text-indigo-600">{completionRates.appointmentCompletionRate}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completionRates.appointmentCompletionRate}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Peak Hours summary */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Peak Traffic Hours
            </span>
            <div className="h-16 flex items-end gap-1">
              {peakHours.slice(7, 19).map((p: any) => {
                const heightPct = Math.round((p.count / maxPeakHour) * 100);
                return (
                  <div key={p.hour} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                      className="w-full bg-slate-300 hover:bg-indigo-600 rounded-t transition-colors"
                      title={`${p.label}: ${p.count} tickets`}
                    />
                    <span className="text-[8px] text-slate-400 mt-1 font-mono">{p.hour}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Top Organizations & Most Active Branches Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Organizations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">Organizations with Highest Activity</h3>
            </div>
            <Link to="/organizations" className="text-xs font-bold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {topOrgs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No organization records available.</p>
            ) : (
              topOrgs.map((org: any, i: number) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-black text-slate-900 truncate">{org.name}</p>
                      <p className="text-[10px] text-slate-500">{org.branchesCount} branches • {org.staffCount} staff</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs font-bold text-indigo-700">{org.ticketCount} Tickets</span>
                    <span className="block text-[10px] text-emerald-600 font-semibold">{org.completionRate}% finished</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Active Branches */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">Most Active Branches</h3>
            </div>
            <Link to="/queues" className="text-xs font-bold text-indigo-600 hover:underline">
              Monitor Queues
            </Link>
          </div>

          <div className="space-y-2.5">
            {topBranches.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No branch activity recorded yet.</p>
            ) : (
              topBranches.map((br: any, i: number) => (
                <div
                  key={br.branchId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-black text-slate-900 truncate">{br.branchName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{br.organizationName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span className="text-xs font-bold text-slate-900">{br.tickets} tickets</span>
                    <span className="block text-[10px] text-amber-600 font-semibold">{br.waiting} waiting</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminExecutiveConsole;
