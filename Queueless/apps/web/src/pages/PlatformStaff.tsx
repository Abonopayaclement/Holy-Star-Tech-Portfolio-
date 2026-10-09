import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserCheck, 
  Search, 
  RefreshCw,
  Shield
} from 'lucide-react';
import api from '../api/client';
import { getAllOrganizations } from '../api/branch';

export const PlatformStaff: React.FC = () => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: orgs = [] } = useQuery({
    queryKey: ['all-organizations'],
    queryFn: getAllOrganizations,
  });

  const { data: usersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['platform-users', selectedOrgId],
    queryFn: async () => {
      const params: any = {};
      if (selectedOrgId !== 'ALL') {
        params.organizationId = selectedOrgId;
      }
      const res = await api.get('/analytics/users', { params });
      return res.data;
    },
  });

  const staffMembers = (usersData || []).filter((u: any) => u.role !== 'CUSTOMER');

  const filteredStaff = staffMembers.filter((s: any) => {
    const matchesSearch =
      !searchQuery ||
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.organizationName && s.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.branchName && s.branchName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Personnel Directory</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Comprehensive directory of Organization Admins, Branch Managers, and Staff across all tenants
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 text-slate-500 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search staff by name, email, branch, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="ALL">All Organizations</option>
            {orgs.map((o: any) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="ORG_ADMIN">Organization Admin</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="STAFF">Staff Operator</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">Personnel Roster</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Total: {filteredStaff.length} members</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <p className="text-sm font-semibold">Loading personnel directory...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No personnel records found</h4>
            <p className="text-xs text-slate-400 mt-1">Try modifying your organization or role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Assigned Branch</th>
                  <th className="px-5 py-3">Service Statistics</th>
                  <th className="px-5 py-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {s.fullName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{s.fullName}</p>
                          <p className="text-[11px] text-slate-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          s.role === 'ORG_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : s.role === 'BRANCH_MANAGER'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-bold">
                      {s.organizationName || 'Global'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {s.branchName || 'All Branches / Headquarters'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-700 font-bold">{s.ticketsCompleted ?? 0}</span>
                      <span className="text-slate-400 text-[11px]"> tickets served</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Verified
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

export default PlatformStaff;
