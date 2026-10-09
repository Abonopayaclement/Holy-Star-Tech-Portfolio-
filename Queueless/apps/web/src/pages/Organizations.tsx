import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle,
  Phone,
  Mail,
  RefreshCw,
  ChevronRight,
  Filter,
  Check,
  X
} from 'lucide-react';
import { 
  getAllOrganizations, 
  getPendingOrganizations, 
  approveOrganization, 
  rejectOrganization, 
  getOrganizationDetailsForAdmin 
} from '../api/branch';

export const Organizations: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'pending' ? 'pending' : 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [rejectModalOrg, setRejectModalOrg] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // 1. Fetch All Organizations
  const { 
    data: allOrgs = [], 
    isLoading: allLoading, 
    refetch: refetchAll 
  } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: getAllOrganizations,
  });

  // 2. Fetch Pending Organizations
  const { 
    data: pendingOrgs = [], 
    isLoading: pendingLoading, 
    refetch: refetchPending 
  } = useQuery({
    queryKey: ['pending-organizations'],
    queryFn: getPendingOrganizations,
  });

  // 3. Organization Details for inspection modal
  const { data: orgDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['organization-detail', selectedOrgId],
    queryFn: () => getOrganizationDetailsForAdmin(selectedOrgId!),
    enabled: !!selectedOrgId,
  });

  // 4. Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (orgId: string) => approveOrganization(orgId),
    onSuccess: (data, orgId) => {
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['executive-analytics'] });
      setActionSuccessMessage('Organization has been approved and is now ACTIVE.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    },
  });

  // 5. Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ orgId, reason }: { orgId: string; reason?: string }) => rejectOrganization(orgId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['executive-analytics'] });
      setRejectModalOrg(null);
      setRejectReason('');
      setActionSuccessMessage('Organization registration was rejected.');
      setTimeout(() => setActionSuccessMessage(null), 5000);
    },
  });

  // Unique types for filtering
  const organizationTypes = Array.from(
    new Set(allOrgs.map((o: any) => o.type).filter(Boolean))
  ) as string[];

  // Filtered organizations
  const filteredOrgs = allOrgs.filter((org: any) => {
    const matchesSearch = 
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.branches?.some((b: any) => b.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || org.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleRefresh = () => {
    refetchAll();
    refetchPending();
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Organizations</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                High-level structure, active branch networks, and onboarding approvals
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 mr-2" />
          All Organizations ({allOrgs.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center relative ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 mr-2" />
          Pending Approvals
          {pendingOrgs.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
              {pendingOrgs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ALL ORGANIZATIONS */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search organizations by name, type, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              >
                <option value="ALL">All Types</option>
                {organizationTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Organizations Grid */}
          {allLoading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-sm font-semibold">Loading organizations...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No organizations found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or type filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrgs.map((org: any) => {
                const branches = org.branches || [];
                const staffCount = org.users ? org.users.filter((u: any) => u.role !== 'CUSTOMER').length : 0;
                const status = org.status || 'ACTIVE';

                return (
                  <div
                    key={org.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shrink-0">
                            {org.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                              {org.name}
                            </h3>
                            <span className="inline-block mt-0.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {org.type}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      {org.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                          {org.description}
                        </p>
                      )}

                      {/* Structural Branches List */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Branches Network ({branches.length})</span>
                          <span className="text-slate-500 font-medium">Staff: {staffCount}</span>
                        </p>

                        {branches.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No branches registered yet.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {branches.map((b: any) => (
                              <div
                                key={b.id}
                                className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg text-xs"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-bold text-slate-800 truncate">{b.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                                  {b.services ? `${b.services.length} services` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Registered: {new Date(org.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => setSelectedOrgId(org.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                      >
                        Inspect Details
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Organization Approval Workflow:</strong> Organizations registered through the public portal remain inactive until reviewed and verified by the Super Administrator. Once approved, the organization administrator receives full operational credentials.
            </div>
          </div>

          {pendingLoading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-sm font-semibold">Loading pending organizations...</p>
            </div>
          ) : pendingOrgs.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Pending Approvals</h3>
              <p className="text-xs text-slate-500 mt-1">All registered organizations are currently reviewed and active.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrgs.map((org: any) => {
                const admin = org.users?.[0] || {};

                return (
                  <div
                    key={org.id}
                    className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm hover:border-amber-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">{org.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {org.type}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                            PENDING APPROVAL
                          </span>
                        </div>

                        {org.description && (
                          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{org.description}</p>
                        )}

                        {/* Admin & Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs text-slate-600">
                          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Administrator</p>
                              <p className="font-bold text-slate-800 truncate">{admin.fullName || 'Admin'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Email</p>
                              <p className="font-bold text-slate-800 truncate">{org.contactEmail || admin.email || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Phone / Location</p>
                              <p className="font-bold text-slate-800 truncate">{org.contactPhone || org.address || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 pt-1">
                          Registration submitted on {new Date(org.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex md:flex-col items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveMutation.mutate(org.id)}
                          disabled={approveMutation.isPending}
                          className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Organization</span>
                        </button>

                        <button
                          onClick={() => setRejectModalOrg({ id: org.id, name: org.name })}
                          disabled={rejectMutation.isPending}
                          className="w-full px-5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* INSPECT ORGANIZATION DETAILS MODAL */}
      {selectedOrgId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {orgDetail?.name || 'Organization Inspection'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                    {orgDetail?.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registered: {orgDetail ? new Date(orgDetail.createdAt).toLocaleDateString() : '...'}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrgId(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                <p className="text-sm font-semibold">Loading organization details...</p>
              </div>
            ) : orgDetail ? (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Branches</p>
                    <p className="text-xl font-black text-slate-900">{orgDetail.stats?.totalBranches ?? 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Staff</p>
                    <p className="text-xl font-black text-slate-900">{orgDetail.stats?.totalStaff ?? 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Queues Served</p>
                    <p className="text-xl font-black text-emerald-600">{orgDetail.stats?.completedTickets ?? 0}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Appointments</p>
                    <p className="text-xl font-black text-indigo-600">{orgDetail.stats?.totalAppointments ?? 0}</p>
                  </div>
                </div>

                {/* Branches Hierarchy */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
                    Branch Locations & Services
                  </h4>
                  <div className="space-y-3">
                    {orgDetail.branches?.map((branch: any) => (
                      <div key={branch.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            <strong className="text-sm font-bold text-slate-900">{branch.name}</strong>
                          </div>
                          <span className="text-xs text-slate-500">{branch.location}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {branch.services?.map((svc: any) => (
                            <span
                              key={svc.id}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700"
                            >
                              {svc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff List */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">
                    Assigned Staff Members ({orgDetail.users?.length ?? 0})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {orgDetail.users?.map((u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
                      >
                        <div className="truncate">
                          <strong className="font-bold text-slate-900">{u.fullName}</strong>
                          <span className="text-slate-500 ml-2 font-mono">{u.email}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrgId(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Reject Organization</h3>
                <p className="text-xs text-slate-500">{rejectModalOrg.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Rejecting this organization will set its status to REJECTED. The organization administrators and staff will not be permitted to access or operate on the platform.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete credentials, unauthorized representative..."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectModalOrg(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ orgId: rejectModalOrg.id, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organizations;
