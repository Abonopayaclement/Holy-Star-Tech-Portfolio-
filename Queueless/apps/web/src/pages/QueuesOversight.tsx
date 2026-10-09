import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Clock, 
  Search, 
  RefreshCw,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { getQueueOversight, getAllOrganizations } from '../api/branch';

export const QueuesOversight: React.FC = () => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('today');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Fetch Organizations for Filter Dropdowns
  const { data: orgs = [] } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: getAllOrganizations,
  });

  // Derived branches based on selected org
  const activeOrg = orgs.find((o: any) => o.id === selectedOrgId);
  const availableBranches = activeOrg 
    ? activeOrg.branches || []
    : orgs.flatMap((o: any) => (o.branches || []).map((b: any) => ({ ...b, organizationName: o.name })));

  // Derived services based on selected branch
  const activeBranch = availableBranches.find((b: any) => b.id === selectedBranchId);
  const availableServices = activeBranch 
    ? activeBranch.services || []
    : availableBranches.flatMap((b: any) => b.services || []);

  // 2. Fetch Queue Oversight Metrics and Entries
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      'queue-oversight',
      selectedOrgId,
      selectedBranchId,
      selectedServiceId,
      selectedStatus,
      dateRange,
    ],
    queryFn: () =>
      getQueueOversight({
        organizationId: selectedOrgId !== 'ALL' ? selectedOrgId : undefined,
        branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
        serviceId: selectedServiceId !== 'ALL' ? selectedServiceId : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        dateRange,
      }),
  });

  const summary = data?.summary || {
    currentlyWaiting: 0,
    currentlyServing: 0,
    joinedQueue: 0,
    served: 0,
    notServed: 0,
    leftOrCancelled: 0,
    completionRate: 0,
    cancellationRate: 0,
  };

  const queues = data?.queues || [];
  const entries = data?.recentEntries || [];

  // Filter entries by search query
  const filteredEntries = entries.filter((e: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.ticketNumber.toLowerCase().includes(q) ||
      e.customerName.toLowerCase().includes(q) ||
      e.serviceName.toLowerCase().includes(q) ||
      e.branchName.toLowerCase().includes(q) ||
      e.organizationName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Queue Oversight & Monitoring</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                  Read-Only Platform View
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Live platform-wide queue telemetry, waiting customer counts, and service completion audits
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-slate-500 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Oversight Guidance Callout */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-start space-x-3 shadow-md">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white font-bold">Executive Oversight Policy:</strong> Super Administrators observe and audit queue activity across organizations. Operational actions such as calling tickets, serving customers, skipping, or modifying queue counters are strictly reserved for authorized branch personnel.
        </div>
      </div>

      {/* KPI Cards (Summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Waiting Now</span>
          <p className="text-xl font-black text-amber-600 mt-1">{summary.currentlyWaiting}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Serving Now</span>
          <p className="text-xl font-black text-blue-600 mt-1">{summary.currentlyServing}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Joined</span>
          <p className="text-xl font-black text-slate-900 mt-1">{summary.joinedQueue}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Served</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{summary.served}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Not Served</span>
          <p className="text-xl font-black text-slate-600 mt-1">{summary.notServed}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cancelled</span>
          <p className="text-xl font-black text-rose-600 mt-1">{summary.leftOrCancelled}</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completion</span>
          <p className="text-xl font-black text-emerald-700 mt-1">{summary.completionRate}%</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cancellation</span>
          <p className="text-xl font-black text-rose-700 mt-1">{summary.cancellationRate}%</p>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Organization */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setSelectedBranchId('ALL');
                setSelectedServiceId('ALL');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Organizations</option>
              {orgs.map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Branch
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setSelectedServiceId('ALL');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Branches</option>
              {availableBranches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Service Desk
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Services</option>
              {availableServices.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Ticket Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="WAITING">WAITING</option>
              <option value="SERVING">SERVING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="SKIPPED">SKIPPED</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-5" />
          <input
            type="text"
            placeholder="Search ticket number, customer name, or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* SECTION 1: Active Service Queues Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">Active Queues Status</h3>
          </div>
          <span className="text-xs text-slate-400">{queues.length} Queues Configured</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading queue telemetry...</p>
          </div>
        ) : queues.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No queues match the selected filter.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {queues.map((q: any) => (
              <div key={q.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <strong className="text-xs font-black text-slate-900">{q.serviceName}</strong>
                    <p className="text-[11px] text-slate-500 truncate">{q.branchName} • {q.organizationName}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      q.status === 'OPEN'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-amber-700 font-bold">Waiting: {q.waitingCount}</span>
                  <span className="text-blue-700 font-bold">Serving: {q.servingCount}</span>
                  <span className="text-slate-400 text-[11px]">Cap: {q.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Live Entries Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">Recent Queue Entries Audit</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Showing {filteredEntries.length} records</span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-xs">Loading queue entry audits...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No queue entries found for this selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Service & Branch</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Joined At</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-black text-slate-900 text-sm">
                      {e.ticketNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800">{e.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{e.customerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800">{e.serviceName}</p>
                      <p className="text-[11px] text-slate-500">{e.branchName}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {e.organizationName}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {e.priority || 'NORMAL'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {new Date(e.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          e.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : e.status === 'SERVING' || e.status === 'CALLING'
                            ? 'bg-blue-100 text-blue-800'
                            : e.status === 'WAITING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueuesOversight;
