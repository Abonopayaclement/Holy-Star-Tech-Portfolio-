import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import SuperAdminAppointments from './SuperAdminAppointments';
import {
  getMyProfile,
  getBranchAppointments,
  getBranchRemoteRequests,
  approveRemoteAppointment,
  rejectRemoteAppointment,
  startRemoteAppointment,
  completeRemoteAppointment,
  staffAppointmentFollowUpAction,
  updateAppointmentStatus,
} from '../api/branch';
import { CONFIG } from '../utils/config';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Play,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  X,
  Phone,
  Mail,
  HelpCircle,
  FileText,
  Eye,
  AlertTriangle,
  Building,
  DollarSign,
  Tag,
  MessageSquare,
} from 'lucide-react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { useActiveBranch } from '../context/ActiveBranchContext';

const PREDEFINED_REJECTION_REASONS = [
  'Service requires physical branch visit (biometrics / physical documents required)',
  'Customer identity could not be verified',
  'Service not supported remotely',
  'Duplicate request submitted',
  'Other operational reason',
];

const Appointments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REMOTE' | 'PHYSICAL'>('REMOTE');
  const [remoteFilter, setRemoteFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { activeBranchId, canSwitchBranch, availableBranches, setActiveBranchId } = useActiveBranch();

  // Selected appointment for detail & action modal
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [messagingAppointment, setMessagingAppointment] = useState<any | null>(null);
  const [pendingActionTab, setPendingActionTab] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [feeInput, setFeeInput] = useState<string>('10.00');
  const [rejectionReason, setRejectionReason] = useState<string>(PREDEFINED_REJECTION_REASONS[0]);
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [followUpInstruction, setFollowUpInstruction] = useState<string>('');

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 1. Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const branchId = activeBranchId || profile?.staffBranchId || profile?.managedBranches?.[0]?.id;

  // 2. Fetch Remote Service Requests
  const {
    data: remoteRequests,
    isLoading: remoteLoading,
    refetch: refetchRemote,
  } = useQuery({
    queryKey: ['remote-requests', branchId, remoteFilter],
    queryFn: () => getBranchRemoteRequests(branchId!, remoteFilter),
    enabled: !!branchId,
  });

  // 3. Fetch Physical Calendar Appointments
  const {
    data: physicalAppointments,
    isLoading: physicalLoading,
    refetch: refetchPhysical,
  } = useQuery({
    queryKey: ['physical-appointments', branchId, selectedDate],
    queryFn: () => getBranchAppointments(branchId!, selectedDate),
    enabled: !!branchId && activeTab === 'PHYSICAL',
  });

  // Socket updates for live appointments
  useEffect(() => {
    if (!branchId) return;
    try {
      const socket = io(CONFIG.SOCKET_URL, { transports: ['websocket', 'polling'] });
      socket.emit('join_branch_room', branchId);
      socket.on('appointment_updated', () => {
        refetchRemote();
        if (activeTab === 'PHYSICAL') refetchPhysical();
      });
      return () => {
        socket.disconnect();
      };
    } catch (err) {
      console.warn('Socket error in appointments page:', err);
    }
  }, [branchId, activeTab, refetchPhysical, refetchRemote]);

  // Open detail modal helper
  const handleOpenDetailModal = (appt: any) => {
    setSelectedAppointment(appt);
    setPendingActionTab('APPROVE');
    setFeeInput(appt.fee !== null && appt.fee !== undefined ? String(appt.fee) : '10.00');
    setRejectionReason(PREDEFINED_REJECTION_REASONS[0]);
    setRejectionNote('');
    setFollowUpInstruction(appt.staffInstruction || '');
  };

  // Close modal helper
  const handleCloseModal = () => {
    setSelectedAppointment(null);
  };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: ({ id, fee }: { id: string; fee: number }) => approveRemoteAppointment(id, fee),
    onSuccess: (data) => {
      const feeNum = Number(data.fee);
      setActionFeedback(
        feeNum === 0
          ? 'Request approved as Free Service (GHS 0.00). Ready to start.'
          : `Request approved with fee GHS ${feeNum.toFixed(2)}. Customer notified to pay.`
      );
      handleCloseModal();
      refetchRemote();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to approve request.');
    },
  });

  const followUpMutation = useMutation({
    mutationFn: ({
      id,
      action,
      instruction,
    }: {
      id: string;
      action: 'DIRECT_TO_BRANCH' | 'CREATE_FOLLOWUP_ATTEMPT' | 'MARK_RESOLVED';
      instruction?: string;
    }) => staffAppointmentFollowUpAction(id, { action, instruction }),
    onSuccess: () => {
      setActionFeedback('Follow-up action recorded and customer notified.');
      handleCloseModal();
      refetchRemote();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to process follow-up action.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason, note }: { id: string; reason: string; note?: string }) =>
      rejectRemoteAppointment(id, reason, note),
    onSuccess: () => {
      setActionFeedback('Request declined and customer notified.');
      handleCloseModal();
      refetchRemote();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to decline request.');
    },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startRemoteAppointment(id),
    onSuccess: () => {
      setActionFeedback('Service started. Customer notified in real time.');
      handleCloseModal();
      refetchRemote();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to start service.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeRemoteAppointment(id),
    onSuccess: () => {
      setActionFeedback('Service completed. Feedback prompt sent to customer.');
      handleCloseModal();
      refetchRemote();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to complete service.');
    },
  });

  const updatePhysicalStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointmentStatus(id, status),
    onSuccess: () => refetchPhysical(),
  });

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black';
      case 'IN_PROGRESS':
        return 'bg-cyan-50 text-cyan-700 border-cyan-300 animate-pulse';
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Super Admin Platform Oversight View (rendered after all hooks)
  if (profile?.role === 'SUPER_ADMIN') {
    return <SuperAdminAppointments />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200 min-w-0">
        <div className="min-w-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase mb-2">
            Service Station
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">Appointments & Remote Services</h1>
          <p className="text-gray-500 text-sm mt-0.5 truncate">
            Click any request to inspect problem description, assess service fees, or process workflow
          </p>
        </div>

        {/* Branch Switcher & Primary Tabs */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {canSwitchBranch && (
            <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-sm self-start">
              <Building className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span className="text-xs font-bold text-indigo-950">Branch:</span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent border-0 text-indigo-950 font-extrabold text-xs focus:ring-0 cursor-pointer p-0 pr-2 max-w-[150px] truncate"
                title="Switch active branch appointments"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 self-start">
            <button
              onClick={() => setActiveTab('REMOTE')}
              className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === 'REMOTE'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Remote Problem Requests
            </button>
            <button
              onClick={() => setActiveTab('PHYSICAL')}
              className={`px-3 sm:px-4 py-2 text-xs font-black rounded-xl transition-all ${
                activeTab === 'PHYSICAL'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In-Branch Calendar Visits
            </button>
          </div>
        </div>
      </div>

      {/* Action Toast */}
      {actionFeedback && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-sm font-semibold flex justify-between items-center shadow-sm">
          <span>{actionFeedback}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-blue-500 hover:text-blue-700 text-xs font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: REMOTE SERVICE PROBLEM REQUESTS */}
      {activeTab === 'REMOTE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
              {[
                { id: 'ALL', label: 'All Requests' },
                { id: 'PENDING', label: 'Pending Review' },
                { id: 'APPROVED', label: 'Approved (Unpaid)' },
                { id: 'PAID', label: 'Paid & Ready' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'COMPLETED', label: 'Completed' },
                { id: 'REJECTED', label: 'Declined' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRemoteFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl transition-colors ${
                    remoteFilter === f.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetchRemote()}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
            >
              Refresh Requests
            </button>
          </div>

          {/* Requests Table with Clickable Rows */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {remoteLoading ? (
              <div className="p-12 text-center text-gray-400 font-medium">Loading remote requests...</div>
            ) : !remoteRequests || remoteRequests.length === 0 ? (
              <div className="p-16 text-center text-gray-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-gray-700">No remote requests in this category</p>
                <p className="text-xs text-gray-400 mt-1">
                  Customer problem requests submitted from the mobile app will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Category & Problem Stated
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Desk & Fee
                      </th>
                      <th className="px-6 py-3.5 text-left text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Status & Feedback
                      </th>
                      <th className="px-6 py-3.5 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {remoteRequests.map((req: any) => (
                      <tr
                        key={req.id}
                        onClick={() => handleOpenDetailModal(req)}
                        className="group hover:bg-blue-50/50 cursor-pointer transition-colors duration-150"
                        title="Click to view full problem description and take action"
                      >
                        {/* Customer */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm shrink-0">
                              {req.user?.fullName?.[0] || 'C'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                                {req.user?.fullName || 'Customer'}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center truncate max-w-[150px] sm:max-w-[200px]">
                                <Phone className="w-3 h-3 mr-1 shrink-0" />
                                <span className="truncate">{req.user?.phoneNumber || req.user?.email || 'N/A'}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category & Problem Stated */}
                        <td className="px-6 py-4 max-w-md">
                          <div className="flex items-center space-x-1.5 mb-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-800 border border-blue-200">
                              {req.problemType || 'General Request'}
                            </span>
                            {req.createdAt && (
                              <span className="text-[11px] text-gray-400">
                                • {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {req.notes ? (
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50/80 p-2 rounded-xl border border-gray-100 font-medium">
                              "{req.notes}"
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No additional note provided</span>
                          )}
                        </td>

                        {/* Desk & Fee */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-gray-800">{req.service?.name}</p>
                          <div className="mt-1">
                            {req.fee !== null && req.fee !== undefined ? (
                              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block">
                                GHS {Number(req.fee).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                                Fee pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status & Feedback */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                              req.status
                            )}`}
                          >
                            {req.status}
                          </span>

                          {/* Customer Problem Resolution Feedback Display */}
                          {req.status === 'COMPLETED' && (
                            <div className="mt-1.5">
                              {req.isProblemSolved === true ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-green-100 text-green-800">
                                  <ThumbsUp className="w-3 h-3 mr-1" /> Solved
                                </span>
                              ) : req.isProblemSolved === false ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-red-100 text-red-800 animate-pulse">
                                    <ThumbsDown className="w-3 h-3 mr-1" /> Unsolved
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">Awaiting feedback</span>
                              )}
                            </div>
                          )}

                          {req.status === 'REJECTED' && req.rejectionReason && (
                            <p className="text-[10px] text-red-600 mt-1 max-w-xs truncate" title={req.rejectionReason}>
                              {req.rejectionReason}
                            </p>
                          )}
                        </td>

                        {/* Action column with button hint */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-bold">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailModal(req);
                            }}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {req.status === 'PENDING'
                                ? 'Review & Act'
                                : req.status === 'PAID'
                                ? 'Start Service'
                                : req.status === 'IN_PROGRESS'
                                ? 'Complete'
                                : 'View Details'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IN-BRANCH CALENDAR VISITS */}
      {activeTab === 'PHYSICAL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800">Physical In-Branch Appointments</h2>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm space-x-4">
              <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2 font-bold text-gray-700 text-xs">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                <span>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <button onClick={() => changeDate(1)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[600px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {physicalLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Loading appointments...
                    </td>
                  </tr>
                ) : !physicalAppointments || physicalAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No in-branch appointments scheduled for this day.
                    </td>
                  </tr>
                ) : (
                  physicalAppointments.map((apt: any) => (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                            {apt.user?.fullName?.[0] || 'C'}
                          </div>
                          <div className="ml-4 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{apt.user?.fullName}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">{apt.user?.phoneNumber || apt.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200 truncate inline-block max-w-[160px]">
                          {apt.service?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {apt.scheduledTime
                            ? new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                            apt.status
                          )}`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {apt.status === 'PENDING' && (
                            <button
                              onClick={() => updatePhysicalStatusMutation.mutate({ id: apt.id, status: 'CONFIRMED' })}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirm Visit"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updatePhysicalStatusMutation.mutate({ id: apt.id, status: 'COMPLETED' })}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Complete Consultation"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                          )}
                          {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                            <button
                              onClick={() => updatePhysicalStatusMutation.mutate({ id: apt.id, status: 'CANCELLED' })}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                        </div>
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

      {/* COMPREHENSIVE APPOINTMENT DETAIL & ACTION MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md shadow-blue-500/20 shrink-0">
                  {selectedAppointment.user?.fullName?.[0] || 'C'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-black text-gray-900">
                      {selectedAppointment.user?.fullName || 'Customer Request'}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                        selectedAppointment.status
                      )}`}
                    >
                      {selectedAppointment.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center space-x-3 mt-0.5">
                    <span className="flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-gray-400" />
                      {selectedAppointment.user?.phoneNumber || 'No phone'}
                    </span>
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1 text-gray-400" />
                      {selectedAppointment.user?.email || 'No email'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setMessagingAppointment(selectedAppointment)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors border border-blue-200"
                  title="Message Customer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Message Customer</span>
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-2xl hover:bg-gray-200/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* 1. PROMINENT CUSTOMER STATED PROBLEM SECTION */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Customer's Stated Problem Description
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Tag className="w-3 h-3 mr-1" />
                    {selectedAppointment.problemType || 'General Problem'}
                  </span>
                </div>

                <div className="bg-white/95 rounded-xl p-4 border border-amber-200/60 shadow-inner">
                  {selectedAppointment.notes ? (
                    <p className="text-sm font-semibold text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {selectedAppointment.notes}
                    </p>
                  ) : (
                    <p className="text-sm italic text-gray-400">
                      No additional problem details were provided by the customer.
                    </p>
                  )}
                </div>
              </div>

              {/* 2. REQUEST & SERVICE METADATA GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Service Desk
                  </span>
                  <p className="text-sm font-bold text-gray-800 flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                    {selectedAppointment.service?.name || 'General Desk'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Assessed Fee
                  </span>
                  <p className="text-sm font-black text-gray-900 flex items-center">
                    <DollarSign className="w-3.5 h-3.5 mr-0.5 text-emerald-600" />
                    {selectedAppointment.fee !== null && selectedAppointment.fee !== undefined ? (
                      <span className="text-emerald-700">GHS {Number(selectedAppointment.fee).toFixed(2)}</span>
                    ) : (
                      <span className="text-amber-600 font-semibold text-xs">Not set yet</span>
                    )}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Submitted Date
                  </span>
                  <p className="text-xs font-bold text-gray-700 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {selectedAppointment.createdAt
                      ? new Date(selectedAppointment.createdAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {/* 3. STATUS BANNERS & FEEDBACK */}
              {selectedAppointment.status === 'APPROVED' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3 text-blue-900">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">Awaiting Customer Payment</p>
                    <p className="text-blue-700">
                      The customer has been notified to review and pay the assessed fee of{' '}
                      <strong>GHS {Number(selectedAppointment.fee).toFixed(2)}</strong> via their mobile app.
                    </p>
                  </div>
                </div>
              )}

              {selectedAppointment.status === 'PAID' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">Payment Confirmed — Ready for Service</p>
                    <p className="text-emerald-700">
                      The customer has completed payment of GHS {Number(selectedAppointment.fee).toFixed(2)}. Click
                      "Start Service" below to notify the customer that you are now attending to them.
                    </p>
                  </div>
                </div>
              )}

              {selectedAppointment.status === 'IN_PROGRESS' && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-start space-x-3 text-cyan-900">
                  <Clock className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5 animate-spin" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">Service Currently In Progress</p>
                    <p className="text-cyan-700">
                      You are actively assisting this customer. When resolved, click "Complete Service" below to close
                      the ticket and prompt the customer for satisfaction feedback.
                    </p>
                  </div>
                </div>
              )}

              {selectedAppointment.status === 'COMPLETED' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Service Status</span>
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                      Resolved & Closed
                    </span>
                  </div>
                  {/* Feedback display */}
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Customer Resolution Feedback
                    </span>
                    {selectedAppointment.isProblemSolved === true ? (
                      <div className="flex items-center text-xs font-bold text-green-800 bg-green-50 p-2.5 rounded-xl border border-green-200">
                        <ThumbsUp className="w-4 h-4 mr-1.5 text-green-600" />
                        <span>Customer marked: Problem Solved</span>
                      </div>
                    ) : selectedAppointment.isProblemSolved === false ? (
                      <div className="space-y-1 text-xs text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200">
                        <div className="flex items-center font-bold">
                          <ThumbsDown className="w-4 h-4 mr-1.5 text-red-600" />
                          <span>Customer marked: Problem Not Solved</span>
                        </div>
                        {selectedAppointment.feedbackNotes && (
                          <p className="text-red-700 text-xs italic pl-5.5">
                            "{selectedAppointment.feedbackNotes}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No feedback submitted yet by customer</p>
                    )}
                  </div>
                </div>
              )}

              {selectedAppointment.status === 'REJECTED' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 space-y-1">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-black">Request Declined</p>
                  </div>
                  <p className="text-xs text-red-800">
                    <strong>Reason:</strong> {selectedAppointment.rejectionReason || 'Declined by staff'}
                  </p>
                  {selectedAppointment.rejectionNote && (
                    <p className="text-xs text-red-700 italic">
                      <strong>Staff Note:</strong> "{selectedAppointment.rejectionNote}"
                    </p>
                  )}
                </div>
              )}

              {/* 4. ACTIONS SECTION (FOR PENDING, PAID, IN_PROGRESS) */}
              <div className="pt-3 border-t border-gray-100">
                {/* FOR PENDING: APPROVE & ASSIGN FEE OR REJECT */}
                {selectedAppointment.status === 'PENDING' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                        Select Action for this Request
                      </span>
                      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setPendingActionTab('APPROVE')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            pendingActionTab === 'APPROVE'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Approve & Set Fee
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingActionTab('REJECT')}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            pendingActionTab === 'REJECT'
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Decline Request
                        </button>
                      </div>
                    </div>

                    {pendingActionTab === 'APPROVE' && (
                      <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                            Assessed Service Fee (GHS)
                          </label>
                          <div className="relative max-w-xs">
                            <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">GHS</span>
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              value={feeInput}
                              onChange={(e) => setFeeInput(e.target.value)}
                              className="w-full pl-14 pr-4 py-2.5 text-sm font-bold rounded-xl border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                              placeholder="10.00"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Enter GHS 0.00 for free services (no customer payment required). For paid services, customer will be notified to confirm and pay.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const feeVal = parseFloat(feeInput);
                            if (isNaN(feeVal) || feeVal < 0) {
                              alert('Please enter a valid non-negative fee amount (GHS 0.00 or higher)');
                              return;
                            }
                            approveMutation.mutate({
                              id: selectedAppointment.id,
                              fee: feeVal,
                            });
                          }}
                          disabled={approveMutation.isPending}
                          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {approveMutation.isPending
                              ? 'Approving...'
                              : (parseFloat(feeInput) === 0
                                  ? 'Approve (Free Service — GHS 0.00)'
                                  : `Approve & Request GHS ${Number(feeInput || 0).toFixed(2)} Payment`)}
                          </span>
                        </button>
                      </div>
                    )}

                    {pendingActionTab === 'REJECT' && (
                      <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 space-y-3">
                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-2">
                            Select Reason for Declining
                          </label>
                          <div className="space-y-1.5">
                            {PREDEFINED_REJECTION_REASONS.map((reason) => (
                              <label
                                key={reason}
                                className={`flex items-start p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                  rejectionReason === reason
                                    ? 'border-red-500 bg-red-50 text-red-900 font-bold'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="rejectionReason"
                                  checked={rejectionReason === reason}
                                  onChange={() => setRejectionReason(reason)}
                                  className="mt-0.5 mr-2 text-red-600 focus:ring-red-500"
                                />
                                <span>{reason}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-1.5">
                            Additional Explanation Note (Optional)
                          </label>
                          <textarea
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            placeholder="e.g. Please bring an original valid Ghana Card to counter 2"
                            rows={2}
                            className="w-full text-xs p-3 rounded-xl border border-gray-200 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            rejectMutation.mutate({
                              id: selectedAppointment.id,
                              reason: rejectionReason,
                              note: rejectionNote.trim() || undefined,
                            })
                          }
                          disabled={rejectMutation.isPending}
                          className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/20 flex items-center justify-center space-x-2 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{rejectMutation.isPending ? 'Declining...' : 'Confirm Decline'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* FOR PAID OR FREE APPROVED: START SERVICE */}
                {(selectedAppointment.status === 'PAID' ||
                  (selectedAppointment.status === 'APPROVED' && Number(selectedAppointment.fee) === 0)) && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                    <div>
                      <p className="text-xs font-black text-emerald-900">
                        {Number(selectedAppointment.fee) === 0
                          ? 'Free Service — Ready to Start'
                          : 'Customer Ready — Payment Confirmed'}
                      </p>
                      <p className="text-xs text-emerald-700">
                        {Number(selectedAppointment.fee) === 0
                          ? 'No payment required (GHS 0.00). Staff can proceed with service directly.'
                          : `Payment of GHS ${Number(selectedAppointment.fee).toFixed(2)} has been cleared.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startMutation.mutate(selectedAppointment.id)}
                      disabled={startMutation.isPending}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all shrink-0"
                    >
                      <Play className="w-4 h-4" />
                      <span>{startMutation.isPending ? 'Starting...' : 'Start Service Now'}</span>
                    </button>
                  </div>
                )}

                {/* FOR IN_PROGRESS: COMPLETE SERVICE */}
                {selectedAppointment.status === 'IN_PROGRESS' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cyan-50/70 p-4 rounded-2xl border border-cyan-200">
                    <div>
                      <p className="text-xs font-black text-cyan-900">Service Active</p>
                      <p className="text-xs text-cyan-700">
                        Wrap up assistance and prompt customer for problem resolution feedback.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeMutation.mutate(selectedAppointment.id)}
                      disabled={completeMutation.isPending}
                      className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-500/20 flex items-center justify-center space-x-2 transition-all shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{completeMutation.isPending ? 'Completing...' : 'Complete Service'}</span>
                    </button>
                  </div>
                )}

                {/* FOR COMPLETED & UNSOLVED: STAFF FOLLOW-UP ACTIONS */}
                {selectedAppointment.status === 'COMPLETED' && selectedAppointment.isProblemSolved === false && (
                  <div className="space-y-3 bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                          Unresolved Case Follow-Up
                        </span>
                      </div>
                      {selectedAppointment.followUpStatus && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                          Status: {selectedAppointment.followUpStatus.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    {selectedAppointment.staffInstruction && (
                      <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs">
                        <span className="font-bold text-gray-700 block mb-0.5">Current Staff Instruction to Customer:</span>
                        <p className="text-gray-800 italic">"{selectedAppointment.staffInstruction}"</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                        Staff Follow-Up Note / Guidance to Customer
                      </label>
                      <textarea
                        value={followUpInstruction}
                        onChange={(e) => setFollowUpInstruction(e.target.value)}
                        placeholder="e.g. Please bring an original valid Ghana Card to counter 2 at the branch, or note steps for remote follow-up"
                        rows={2}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          followUpMutation.mutate({
                            id: selectedAppointment.id,
                            action: 'DIRECT_TO_BRANCH',
                            instruction: followUpInstruction,
                          })
                        }
                        disabled={followUpMutation.isPending}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>Direct Customer to Visit Branch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          followUpMutation.mutate({
                            id: selectedAppointment.id,
                            action: 'CREATE_FOLLOWUP_ATTEMPT',
                            instruction: followUpInstruction,
                          })
                        }
                        disabled={followUpMutation.isPending}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Schedule Follow-Up (Covered / No Charge)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          followUpMutation.mutate({
                            id: selectedAppointment.id,
                            action: 'MARK_RESOLVED',
                            instruction: followUpInstruction,
                          })
                        }
                        disabled={followUpMutation.isPending}
                        className="px-3.5 py-2 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Follow-Up Handled</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Contact Customer Modal */}
      <ContactCustomerModal
        isOpen={!!messagingAppointment}
        onClose={() => setMessagingAppointment(null)}
        appointmentId={messagingAppointment?.id}
        customerName={messagingAppointment?.user?.fullName || 'Customer'}
        contextTitle={`Appointment #${messagingAppointment?.id?.slice(0, 8)?.toUpperCase()} • Service Communication`}
      />
    </div>
  );
};

export default Appointments;

