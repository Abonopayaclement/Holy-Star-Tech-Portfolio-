import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMyProfile, getBranchDetails, updateService } from '../api/branch';
import { getQueueStatus, callNext, startServing, completeEntry, skipEntry, recallSkippedEntry, cancelEntry, updateQueueStatus, transferTicket } from '../api/queue';
import { useQueueSocket } from '../hooks/useQueueSocket';
import QueueEntryCard from '../components/QueueEntryCard';
import CancellationReasonModal from '../components/CancellationReasonModal';
import QueueClosureModal from '../components/QueueClosureModal';
import TransferTicketModal from '../components/TransferTicketModal';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { useActiveBranch } from '../context/ActiveBranchContext';
import { 
  Users, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  SkipForward, 
  UserCheck,
  Building,
  Edit3,
  Check,
  X,
  ArrowRightLeft,
  Clock,
  RotateCcw,
  History,
  Ban
} from 'lucide-react';

const ServingTimer: React.FC<{ startTime?: string | Date; label: string }> = ({ startTime, label }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!startTime) return;
    const startMs = new Date(startTime).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 shadow-inner">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[11px] font-semibold text-white/90">{label}:</span>
      <span className="font-mono text-sm font-extrabold text-white tracking-wider">{formatted}</span>
    </div>
  );
};

const LiveQueue: React.FC = () => {
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  const [deskTab, setDeskTab] = useState<'waiting' | 'skipped' | 'transferred' | 'completed' | 'cancelled'>('waiting');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [cancellingEntry, setCancellingEntry] = useState<any | null>(null);
  const [transferringEntry, setTransferringEntry] = useState<any | null>(null);
  const [messagingEntry, setMessagingEntry] = useState<any | null>(null);

  const { activeBranchId, canSwitchBranch, availableBranches, setActiveBranchId } = useActiveBranch();

  // 1. Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getMyProfile,
  });

  const branchId = activeBranchId || profile?.staffBranchId || profile?.managedBranches?.[0]?.id;

  const [editingDuration, setEditingDuration] = useState<boolean>(false);
  const [serviceDurationVal, setServiceDurationVal] = useState<number>(15);

  // 2. Fetch branch details
  const { data: branch, isLoading: branchLoading, refetch: refetchBranch } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => getBranchDetails(branchId!),
    enabled: !!branchId,
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ serviceId, duration }: { serviceId: string; duration: number }) =>
      updateService(serviceId, { duration }),
    onSuccess: () => {
      setActionFeedback('Service estimated baseline duration updated.');
      setEditingDuration(false);
      refetchBranch();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to update service duration.');
    },
  });

  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [activeCounter, setActiveCounter] = useState<string>(() => {
    return localStorage.getItem('queueless_staff_counter') || 'Counter 1';
  });

  const handleCounterChange = (newVal: string) => {
    setActiveCounter(newVal);
    localStorage.setItem('queueless_staff_counter', newVal);
  };

  const toggleQueueStatusMutation = useMutation({
    mutationFn: ({
      queueId,
      status,
      closedReason,
    }: {
      queueId: string;
      status: 'OPEN' | 'CLOSED';
      closedReason?: string | null;
    }) => updateQueueStatus(queueId, status, closedReason),
    onSuccess: (data) => {
      setActionFeedback(
        `Queue is now ${data.status}${data.closedReason ? ` (${data.closedReason})` : ''}`
      );
      refetchBranch();
      refetch();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to update queue status.');
    },
  });

  // Automatically select first queue if none selected or if current queue does not belong to branch
  React.useEffect(() => {
    if (branch?.queues && branch.queues.length > 0) {
      const exists = branch.queues.some((q: any) => q.id === selectedQueueId);
      if (!exists) {
        setSelectedQueueId(branch.queues[0].id);
      }
    } else {
      setSelectedQueueId('');
    }
  }, [branch, selectedQueueId]);

  // 3. Fetch selected queue entries
  const { data: entries, refetch } = useQuery({
    queryKey: ['queue-status', selectedQueueId],
    queryFn: () => getQueueStatus(selectedQueueId),
    enabled: !!selectedQueueId,
  });

  // Real-time socket updates
  useQueueSocket(selectedQueueId, () => {
    refetch();
  });

  // Mutations for all 5 actions
  const callNextMutation = useMutation({
    mutationFn: ({ queueId, counterNumber }: { queueId: string; counterNumber?: string }) => 
      callNext(queueId, { counterNumber }),
    onSuccess: (data) => {
      setActionFeedback(`Called ticket ${data.ticketNumber || data.position} to ${activeCounter}`);
      refetch();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'No customers in queue');
    },
  });

  const startServingMutation = useMutation({
    mutationFn: ({ entryId, counterNumber }: { entryId: string; counterNumber?: string }) => 
      startServing(entryId, { counterNumber }),
    onSuccess: (data) => {
      setActionFeedback(`Started serving ${data.ticketNumber || data.position}`);
      refetch();
    },
  });

  const completeMutation = useMutation({
    mutationFn: (entryId: string) => completeEntry(entryId),
    onSuccess: () => {
      setActionFeedback('Service completed.');
      refetch();
    },
  });

  const skipMutation = useMutation({
    mutationFn: (entryId: string) => skipEntry(entryId),
    onSuccess: () => {
      setActionFeedback('Customer skipped.');
      refetch();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ entryId, reason, reasonNote }: { entryId: string; reason: string; reasonNote?: string }) => 
      cancelEntry(entryId, { reason, reasonNote }),
    onSuccess: () => {
      setActionFeedback('Ticket cancelled with recorded reason.');
      setCancellingEntry(null);
      refetch();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to cancel ticket.');
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ entryId, destinationServiceId, reason, reasonNote }: { entryId: string; destinationServiceId: string; reason: string; reasonNote?: string }) =>
      transferTicket(entryId, { destinationServiceId, reason, reasonNote }),
    onSuccess: (data: any) => {
      setActionFeedback(data.message || 'Ticket successfully transferred.');
      setTransferringEntry(null);
      refetchBranch();
      refetch();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to transfer ticket.');
    },
  });

  const recallSkippedMutation = useMutation({
    mutationFn: ({ entryId, action }: { entryId: string; action: 'CALL' | 'RETURN_TO_WAITING' }) =>
      recallSkippedEntry(entryId, { action, counterNumber: activeCounter }),
    onSuccess: (data: any) => {
      setActionFeedback(`Ticket ${data.ticketNumber || data.position} recalled to ${activeCounter}`);
      refetch();
    },
    onError: (err: any) => {
      setActionFeedback(err.response?.data?.error || 'Failed to recall customer.');
    },
  });

  const activeQueue = branch?.queues?.find((q: any) => q.id === selectedQueueId);

  const activeServing = entries?.find((e: any) => e.status === 'SERVING' && e.queueId === selectedQueueId);
  const activeCalling = entries?.find((e: any) => e.status === 'CALLING' && e.queueId === selectedQueueId);
  const currentEntry = activeServing || activeCalling;

  const waitingEntries = entries?.filter((e: any) => e.status === 'WAITING' && e.queueId === selectedQueueId) || [];
  const skippedEntries = entries?.filter((e: any) => e.status === 'SKIPPED' && e.queueId === selectedQueueId) || [];
  const cancelledEntries = entries?.filter((e: any) => e.status === 'CANCELLED' && e.queueId === selectedQueueId) || [];
  const completedEntries = entries?.filter((e: any) => e.status === 'COMPLETED' && e.queueId === selectedQueueId) || [];
  const transferredEntries = entries?.filter((e: any) =>
    Boolean(e.transferredAt) && (e.queueId === selectedQueueId || e.originalServiceId === activeQueue?.service?.id)
  ) || [];

  if (branchLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading live branch queue station...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200 min-w-0">
        <div className="min-w-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 uppercase mb-2">
            Counter Station
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">Live Queue Management</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center truncate">
            <Building className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
            <span className="truncate">{branch?.name || 'Branch Office'} {branch?.location ? `(${branch.location})` : ''}</span>
          </p>
        </div>

        {/* Service Queue Selector, Status Toggle & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          {/* Manager Branch Quick Switcher */}
          {canSwitchBranch && (
            <div className="flex items-center space-x-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-sm">
              <Building className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span className="text-xs font-bold text-indigo-950">Branch:</span>
              <select
                value={activeBranchId}
                onChange={(e) => {
                  setActiveBranchId(e.target.value);
                  setSelectedQueueId('');
                }}
                className="bg-transparent border-0 text-indigo-950 font-extrabold text-xs focus:ring-0 cursor-pointer p-0 pr-2 max-w-[140px] truncate"
                title="Switch active branch queue"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Staff Counter Selector */}
          <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl shadow-sm">
            <span className="text-xs font-bold text-blue-900 flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-600 mr-1.5 animate-pulse" />
              Desk:
            </span>
            <select
              value={activeCounter}
              onChange={(e) => handleCounterChange(e.target.value)}
              className="bg-transparent border-0 text-blue-950 font-extrabold text-xs focus:ring-0 cursor-pointer p-0 pr-4"
            >
              <option value="Counter 1">Counter 1</option>
              <option value="Counter 2">Counter 2</option>
              <option value="Counter 3">Counter 3</option>
              <option value="Counter 4">Counter 4</option>
              <option value="Counter 5">Counter 5</option>
              <option value="Teller Desk A">Teller Desk A</option>
              <option value="Teller Desk B">Teller Desk B</option>
              <option value="Consultation Room 1">Consultation Room 1</option>
              <option value="Consultation Room 2">Consultation Room 2</option>
              <option value="Triage Window 1">Triage Window 1</option>
            </select>
          </div>

          <select
            className="bg-white border border-gray-300 text-gray-900 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-blue-500 block p-2.5 shadow-sm min-w-0 max-w-full sm:min-w-[180px]"
            value={selectedQueueId}
            onChange={(e) => setSelectedQueueId(e.target.value)}
          >
            {branch?.queues?.map((q: any) => (
              <option key={q.id} value={q.id}>
                {q.service.name} ({q._count?.entries || 0} in line) {q.status === 'CLOSED' ? '— CLOSED' : ''}
              </option>
            ))}
          </select>

          {activeQueue && (
            activeQueue.status === 'OPEN' ? (
              <button
                type="button"
                onClick={() => setClosureModalOpen(true)}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Close Queue</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  toggleQueueStatusMutation.mutate({
                    queueId: activeQueue.id,
                    status: 'OPEN',
                    closedReason: null,
                  })
                }
                disabled={toggleQueueStatusMutation.isPending}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Reopen Queue</span>
              </button>
            )
          )}

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
            title="Refresh Queue"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Closed Queue Banner Alert */}
      {activeQueue?.status === 'CLOSED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs font-semibold shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm text-amber-950">
                Queue Currently Closed: {activeQueue.service?.name} is not accepting new customers
              </p>
              <p className="text-amber-800 mt-0.5">
                Closure Reason: <span className="font-bold underline">{activeQueue.closedReason || 'Branch closing soon'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              toggleQueueStatusMutation.mutate({
                queueId: activeQueue.id,
                status: 'OPEN',
                closedReason: null,
              })
            }
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex-shrink-0"
          >
            Reopen Now
          </button>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-sm font-medium flex justify-between items-center">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-blue-500 hover:text-blue-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Queue Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Active Counter & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Ticket Card */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Current Counter Status
              </span>
              {currentEntry && (
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  currentEntry.status === 'SERVING'
                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {currentEntry.status === 'SERVING' ? '● SERVING NOW' : '🔔 CALLING CUSTOMER'}
                </span>
              )}
            </div>

            {currentEntry ? (
              <div className={`p-8 rounded-2xl text-white transition-all shadow-md ${
                currentEntry.status === 'SERVING'
                  ? 'bg-emerald-600'
                  : 'bg-blue-600'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black tracking-wider uppercase">
                        Ticket {currentEntry.ticketNumber || `#${currentEntry.position}`}
                      </span>
                      {currentEntry.status === 'SERVING' && (
                        <ServingTimer
                          startTime={currentEntry.servingAt || currentEntry.calledAt}
                          label="Elapsed Time"
                        />
                      )}
                      {currentEntry.status === 'CALLING' && (
                        <ServingTimer
                          startTime={currentEntry.calledAt}
                          label="Calling Time"
                        />
                      )}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black truncate">{currentEntry.user?.fullName}</h2>
                    <p className="text-white/80 text-sm mt-1 truncate">
                      {currentEntry.user?.phoneNumber || currentEntry.user?.email}
                    </p>
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold shrink-0">
                    {currentEntry.user?.fullName?.[0] || 'C'}
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentEntry.status === 'CALLING' && (
                    <button
                      onClick={() => startServingMutation.mutate({ entryId: currentEntry.id, counterNumber: activeCounter })}
                      disabled={startServingMutation.isPending}
                      className="py-2.5 px-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-md transition-all flex items-center justify-center text-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Start Serving
                    </button>
                  )}

                  <button
                    onClick={() => completeMutation.mutate(currentEntry.id)}
                    disabled={completeMutation.isPending}
                    className={`py-2.5 px-3 font-bold rounded-xl shadow-md transition-all flex items-center justify-center text-xs ${
                      currentEntry.status === 'SERVING'
                        ? 'bg-white text-emerald-800 hover:bg-emerald-50 col-span-2'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Complete
                  </button>

                  <button
                    onClick={() => setTransferringEntry(currentEntry)}
                    className="py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all flex items-center justify-center text-xs"
                    title="Transfer to another service"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> Transfer
                  </button>

                  {currentEntry.status === 'CALLING' && (
                    <button
                      onClick={() => skipMutation.mutate(currentEntry.id)}
                      disabled={skipMutation.isPending}
                      className="py-2.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all flex items-center justify-center text-xs col-span-2 sm:col-span-1"
                    >
                      <SkipForward className="w-3.5 h-3.5 mr-1.5" /> Skip
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-gray-700 text-lg">No Customer at Counter</h3>
                <p className="text-gray-500 text-sm mt-1 mb-6">
                  Ready to serve the next customer in the virtual queue at <span className="font-extrabold text-blue-600">{activeCounter}</span>.
                </p>
                <button
                  onClick={() => callNextMutation.mutate({ queueId: selectedQueueId, counterNumber: activeCounter })}
                  disabled={waitingEntries.length === 0 || callNextMutation.isPending}
                  className="inline-flex items-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 text-sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {callNextMutation.isPending ? 'Calling Next...' : `Call Next ➔ ${activeCounter}`}
                </button>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-400">Waiting Line</span>
              <p className="text-3xl font-black text-gray-900 mt-1">{waitingEntries.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">customers in line</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold uppercase text-gray-400">Est. Total Wait</span>
              <p className="text-3xl font-black text-gray-900 mt-1">
                {waitingEntries.length * (activeQueue?.service?.duration || 15)}m
              </p>
              <p className="text-xs text-gray-500 mt-0.5">service pipeline</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-gray-400">Baseline Duration</span>
                <button
                  type="button"
                  onClick={() => {
                    setServiceDurationVal(activeQueue?.service?.duration || 15);
                    setEditingDuration(!editingDuration);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Edit Service Baseline Duration"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-3xl font-black text-gray-900 mt-1">
                {activeQueue?.service?.duration || 15}m
              </p>
              <p className="text-xs text-gray-500 mt-0.5">configured baseline pace</p>

              {editingDuration && (
                <div className="absolute top-full left-0 right-0 z-30 mt-2 p-3.5 bg-white rounded-2xl shadow-xl border border-gray-200 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800">Edit Service Time</span>
                    <button
                      type="button"
                      onClick={() => setEditingDuration(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1 mb-2.5">
                    {[5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setServiceDurationVal(mins)}
                        className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                          serviceDurationVal === mins
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={serviceDurationVal}
                      onChange={(e) => setServiceDurationVal(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 text-xs font-bold border border-gray-300 rounded-lg text-center"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (activeQueue?.service?.id) {
                          updateServiceMutation.mutate({
                            serviceId: activeQueue.service.id,
                            duration: serviceDurationVal,
                          });
                        }
                      }}
                      disabled={updateServiceMutation.isPending}
                      className="flex-1 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      {updateServiceMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Tab Counter Line & History */}
        <div className="lg:col-span-1 space-y-3">
          {/* Desk Tabs Switcher */}
          <div className="bg-white p-1 rounded-2xl border border-gray-200 flex items-center gap-1 shadow-xs overflow-x-auto text-xs font-bold scrollbar-none">
            <button
              onClick={() => setDeskTab('waiting')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap ${
                deskTab === 'waiting'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Wait ({waitingEntries.length})</span>
            </button>
            <button
              onClick={() => setDeskTab('skipped')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap ${
                deskTab === 'skipped'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip ({skippedEntries.length})</span>
            </button>
            <button
              onClick={() => setDeskTab('transferred')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap ${
                deskTab === 'transferred'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Trans ({transferredEntries.length})</span>
            </button>
            <button
              onClick={() => setDeskTab('completed')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap ${
                deskTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Done ({completedEntries.length})</span>
            </button>
            <button
              onClick={() => setDeskTab('cancelled')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 whitespace-nowrap ${
                deskTab === 'cancelled'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel ({cancelledEntries.length})</span>
            </button>
          </div>

          {/* Tab Content List */}
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto space-y-2 pr-1">
            {deskTab === 'waiting' && (
              waitingEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm">No customers currently waiting</p>
                  <p className="text-xs text-gray-400 mt-1">New arrivals will appear here in real time.</p>
                </div>
              ) : (
                waitingEntries.map((entry: any, index: number) => (
                  <QueueEntryCard
                    key={entry.id}
                    entry={entry}
                    isNext={index === 0}
                    onCancel={() => setCancellingEntry(entry)}
                    onTransfer={() => setTransferringEntry(entry)}
                    onMessage={() => setMessagingEntry(entry)}
                  />
                ))
              )
            )}

            {deskTab === 'skipped' && (
              skippedEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400">
                  <SkipForward className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm">No skipped customers today</p>
                  <p className="text-xs text-gray-400 mt-1">Customers skipped during call will appear here.</p>
                </div>
              ) : (
                skippedEntries.map((entry: any) => (
                  <div key={entry.id} className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-xs flex items-center justify-center">
                          {entry.ticketNumber || `#${entry.position}`}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{entry.user?.fullName || 'Customer'}</p>
                          <p className="text-[11px] text-gray-500">{entry.user?.phoneNumber || entry.user?.email || 'No contact'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        SKIPPED
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => recallSkippedMutation.mutate({ entryId: entry.id, action: 'CALL' })}
                        disabled={recallSkippedMutation.isPending}
                        className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Re-Call to Desk
                      </button>
                      <button
                        onClick={() => recallSkippedMutation.mutate({ entryId: entry.id, action: 'RETURN_TO_WAITING' })}
                        disabled={recallSkippedMutation.isPending}
                        className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        title="Return customer to waiting queue line"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Return to Line
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {deskTab === 'transferred' && (
              transferredEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400">
                  <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm">No transferred customers recorded today</p>
                  <p className="text-xs text-gray-400 mt-1">Customers transferred to or from this service appear here.</p>
                </div>
              ) : (
                transferredEntries.map((entry: any) => (
                  <div key={entry.id} className="p-3.5 bg-white rounded-2xl border border-purple-200/80 shadow-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 font-black text-xs flex items-center justify-center">
                          {entry.ticketNumber || `#${entry.position}`}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{entry.user?.fullName || 'Customer'}</p>
                          <p className="text-xs font-semibold text-purple-700">
                            ➔ {entry.queue?.service?.name || 'Reassigned Service'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                        TRANSFERRED
                      </span>
                    </div>
                    {entry.transferReason && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <strong className="text-gray-700">Reason:</strong> {entry.transferReason}
                      </p>
                    )}
                    <span className="text-[10px] text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {entry.transferredAt ? new Date(entry.transferredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                ))
              )
            )}

            {deskTab === 'completed' && (
              completedEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm">No customers served yet today</p>
                  <p className="text-xs text-gray-400 mt-1">Completed tickets will be archived here for reference.</p>
                </div>
              ) : (
                completedEntries.map((entry: any) => {
                  const durationMins = entry.completedAt && (entry.servingAt || entry.calledAt)
                    ? Math.max(1, Math.round((new Date(entry.completedAt).getTime() - new Date(entry.servingAt || entry.calledAt).getTime()) / 60000))
                    : null;
                  return (
                    <div key={entry.id} className="p-3.5 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {entry.ticketNumber || `#${entry.position}`}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{entry.user?.fullName || 'Customer'}</p>
                          <p className="text-xs text-gray-500">
                            {entry.counterNumber || 'Counter'} {durationMins ? `• ${durationMins}m served` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                        SERVED
                      </span>
                    </div>
                  );
                })
              )
            )}

            {deskTab === 'cancelled' && (
              cancelledEntries.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 text-gray-400">
                  <Ban className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm">No cancelled tickets today</p>
                  <p className="text-xs text-gray-400 mt-1">Tickets cancelled by staff or customer appear here.</p>
                </div>
              ) : (
                cancelledEntries.map((entry: any) => (
                  <div key={entry.id} className="p-3.5 bg-white rounded-2xl border border-rose-200/80 shadow-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-black text-xs flex items-center justify-center">
                          {entry.ticketNumber || `#${entry.position}`}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{entry.user?.fullName || 'Customer'}</p>
                          <p className="text-xs text-rose-600 font-semibold">{entry.cancellationReason || 'Cancelled'}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                        CANCELLED
                      </span>
                    </div>
                    {entry.cancelledBy && (
                      <p className="text-[11px] text-gray-400">By: {entry.cancelledBy}</p>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Staff Cancellation Reason Modal */}
      <CancellationReasonModal
        isOpen={!!cancellingEntry}
        onClose={() => setCancellingEntry(null)}
        ticketNumber={cancellingEntry?.ticketNumber || `#${cancellingEntry?.position}`}
        customerName={cancellingEntry?.user?.fullName}
        isLoading={cancelMutation.isPending}
        onConfirm={(reason, reasonNote) => {
          if (cancellingEntry) {
            cancelMutation.mutate({
              entryId: cancellingEntry.id,
              reason,
              reasonNote,
            });
          }
        }}
      />

      {/* Staff Queue Closure Modal with Predefined Reasons */}
      <QueueClosureModal
        isOpen={closureModalOpen}
        queueName={activeQueue?.service?.name}
        onClose={() => setClosureModalOpen(false)}
        onConfirm={async (reason) => {
          if (activeQueue) {
            await toggleQueueStatusMutation.mutateAsync({
              queueId: activeQueue.id,
              status: 'CLOSED',
              closedReason: reason,
            });
          }
        }}
      />

      {/* Staff Service Transfer Modal */}
      <TransferTicketModal
        isOpen={!!transferringEntry}
        onClose={() => setTransferringEntry(null)}
        ticketNumber={transferringEntry?.ticketNumber || `#${transferringEntry?.position}`}
        customerName={transferringEntry?.user?.fullName}
        currentServiceName={activeQueue?.service?.name}
        availableServices={
          branch?.services
            ?.filter((s: any) => s.id !== activeQueue?.service?.id && s.isActive !== false)
            ?.map((s: any) => ({ id: s.id, name: s.name })) || []
        }
        isLoading={transferMutation.isPending}
        onConfirm={(destinationServiceId, reason, reasonNote) => {
          if (transferringEntry) {
            transferMutation.mutate({
              entryId: transferringEntry.id,
              destinationServiceId,
              reason,
              reasonNote,
            });
          }
        }}
      />

      {/* Staff Contact Customer Modal */}
      <ContactCustomerModal
        isOpen={!!messagingEntry}
        onClose={() => setMessagingEntry(null)}
        queueEntryId={messagingEntry?.id}
        customerName={messagingEntry?.user?.fullName || 'Customer'}
        contextTitle={`Ticket ${messagingEntry?.ticketNumber || `#${messagingEntry?.position}`} • Service Communication`}
      />
    </div>
  );
};

export default LiveQueue;
