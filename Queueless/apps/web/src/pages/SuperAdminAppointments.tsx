import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import api from '../api/client';
import { getPlatformAppointments } from '../api/branch';

interface AppointmentRecord {
  id: string;
  scheduledTime: string;
  status: string;
  notes?: string;
  fee?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  branchName: string;
  organizationName: string;
  organizationId: string;
  branchId: string;
  createdAt: string;
}

interface SummaryData {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export const SuperAdminAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Selected item for read-only inspection
  const [inspectingAppt, setInspectingAppt] = useState<AppointmentRecord | null>(null);

  // Load organizations for filter
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/organizations/public');
        setOrganizations(res.data || []);
      } catch (err) {
        console.error('Failed to load organizations list:', err);
      }
    };
    fetchOrgs();
  }, []);

  const loadAppointments = async () => {
    try {
      setRefreshing(true);
      const params: any = {};
      if (selectedOrgId !== 'ALL') params.organizationId = selectedOrgId;
      if (selectedBranchId !== 'ALL') params.branchId = selectedBranchId;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (selectedDate) params.startDate = selectedDate;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getPlatformAppointments(params);
      setAppointments(res.appointments || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load platform appointments:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedOrgId, selectedBranchId, statusFilter, selectedDate]);

  // Derived available branches based on selected org
  const activeOrg = organizations.find((o) => o.id === selectedOrgId);
  const availableBranches = activeOrg?.branches || [];

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSelectedBranchId('ALL');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3 mr-1" /> Confirmed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-black tracking-wider uppercase">
              Platform Oversight
            </span>
            <span className="text-xs text-gray-400 font-semibold">• Read-Only Audit</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Appointments Directory</h1>
          <p className="text-sm text-gray-500">
            Platform-wide appointment scheduling telemetry, booking status audits, and cross-organization analytics
          </p>
        </div>

        <button
          onClick={loadAppointments}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Main KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Bookings</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{summary.total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Across all organizations</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Pending Requests</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{summary.pending}</p>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting branch action</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Confirmed</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{summary.confirmed}</p>
          <p className="text-[11px] text-blue-600/80 mt-0.5">Scheduled on calendar</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Completed</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{summary.completed}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Successfully served</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs col-span-2 lg:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Cancelled / Rejected</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{summary.cancelled}</p>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Not attended / declined</p>
        </div>
      </div>

      {/* Multi-Dimensional Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAppointments()}
              className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none w-full"
            />
          </div>

          {/* Organization Filter */}
          <div>
            <select
              value={selectedOrgId}
              onChange={(e) => handleOrgChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl text-xs py-2 px-3 bg-gray-50 text-gray-700 outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={selectedOrgId === 'ALL'}
              className="w-full border border-gray-200 rounded-xl text-xs py-2 px-3 bg-gray-50 text-gray-700 outline-none font-semibold cursor-pointer disabled:opacity-50"
            >
              <option value="ALL">All Branches</option>
              {availableBranches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-xl text-xs py-2 px-3 bg-gray-50 text-gray-700 outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl text-xs py-2 px-3 bg-gray-50 text-gray-700 outline-none w-full"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-gray-400 hover:text-gray-700 p-1"
                title="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments Audit Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Appointments Audit Records ({appointments.length})
          </h3>
          <span className="text-xs text-gray-400 font-medium">Platform-Wide Oversight Only</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/70 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Organization & Branch</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Fee / Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    <div className="flex items-center gap-1.5 text-gray-800">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {new Date(apt.scheduledTime).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-gray-400 pl-5">
                      {new Date(apt.scheduledTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-900">{apt.organizationName}</div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-gray-400" />
                      {apt.branchName}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                      {apt.serviceName}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-gray-800">{apt.customerName}</div>
                    <div className="text-[10px] text-gray-400">{apt.customerEmail}</div>
                    {apt.customerPhone && (
                      <div className="text-[10px] text-gray-400">{apt.customerPhone}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {apt.fee !== null && apt.fee !== undefined ? (
                      <span className="text-gray-700 font-mono font-bold">
                        GHS {Number(apt.fee).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">Free / Standard</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">{getStatusBadge(apt.status)}</td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setInspectingAppt(apt)}
                      className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}

              {appointments.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    No appointment records match the selected platform filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read-Only Inspection Modal (No Operational Buttons) */}
      {inspectingAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-gray-900">Appointment Audit Inspection</h3>
                  <p className="text-xs text-gray-400">ID: {inspectingAppt.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingAppt(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase">Status</span>
                  <span>{getStatusBadge(inspectingAppt.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase">Scheduled Time</span>
                  <span className="font-bold text-gray-800">
                    {new Date(inspectingAppt.scheduledTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase">Created On</span>
                  <span className="text-gray-600 font-medium">
                    {new Date(inspectingAppt.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-bold uppercase">Fee</span>
                  <span className="font-mono font-bold text-gray-800">
                    {inspectingAppt.fee ? `GHS ${Number(inspectingAppt.fee).toFixed(2)}` : 'GHS 0.00'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/50 p-3.5 rounded-2xl space-y-1.5 border border-blue-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Location Structure</p>
                <p className="font-bold text-gray-900 text-sm">{inspectingAppt.organizationName}</p>
                <p className="text-gray-600 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-500" /> {inspectingAppt.branchName} • Service: {inspectingAppt.serviceName}
                </p>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl space-y-1.5 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer Details</p>
                <p className="font-bold text-gray-900">{inspectingAppt.customerName}</p>
                <p className="text-gray-600">{inspectingAppt.customerEmail}</p>
                {inspectingAppt.customerPhone && <p className="text-gray-600">{inspectingAppt.customerPhone}</p>}
              </div>

              {inspectingAppt.notes && (
                <div className="bg-amber-50/50 p-3.5 rounded-2xl space-y-1 border border-amber-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Customer Notes</p>
                  <p className="text-gray-700 leading-relaxed">{inspectingAppt.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setInspectingAppt(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-colors"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminAppointments;
