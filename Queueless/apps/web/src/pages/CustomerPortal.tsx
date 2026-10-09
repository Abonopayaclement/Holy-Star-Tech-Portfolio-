import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getMyActiveTicket, cancelEntry, joinQueue, getMyQueueHistory } from '../api/queue';
import { 
  getAllOrganizations, 
  getMyAppointments, 
  createAppointment, 
  cancelAppointment, 
  rescheduleAppointment,
  getAvailableAppointmentSlots 
} from '../api/branch';
import { useQueueSocket } from '../hooks/useQueueSocket';
import { playCallChime } from '../utils/sound';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Ticket, 
  X, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  Volume2,
  CalendarCheck,
  RefreshCw,
  History
} from 'lucide-react';

/**
 * Real-time digital clock hook.
 * Uses system local timezone via Intl.DateTimeFormat and updates every second.
 */
const useRealtimeClock = () => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(time);

  const dateString = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(time);

  return { timeString, dateString };
};

const CustomerPortal: React.FC = () => {
  const { timeString: liveTime, dateString: liveDate } = useRealtimeClock();
  const [activeTab, setActiveTab] = useState<'ticket' | 'join_or_book' | 'appointments' | 'history'>('ticket');
  const [historySubTab, setHistorySubTab] = useState<'queues' | 'appointments'>('queues');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [actionChoice, setActionChoice] = useState<'queue' | 'appointment'>('queue');
  
  // Appointment form state
  const [appointmentDate, setAppointmentDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // If tomorrow is Sunday, advance to Monday
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');
  
  // Rescheduling modal state
  const [reschedulingAppointment, setReschedulingAppointment] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlotTime, setRescheduleSlotTime] = useState<string>('');

  // Confirmation dialog state
  const [confirmCancelTicketId, setConfirmCancelTicketId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audio chime state
  const prevStatusRef = useRef<string | null>(null);

  // Multi-ticket selection state
  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number>(0);

  // 1. Fetch active ticket (with 10s fallback polling)
  const { data: activeTicketData, refetch: refetchTicket, isLoading: ticketLoading } = useQuery({
    queryKey: ['my-active-ticket'],
    queryFn: getMyActiveTicket,
    refetchInterval: 10000,
  });

  // Track active tickets array
  const activeTickets: any[] = activeTicketData?.activeTickets || (activeTicketData?.entry ? [activeTicketData] : []);
  const safeTicketIndex = selectedTicketIndex < activeTickets.length ? selectedTicketIndex : 0;
  const currentTicketData = activeTickets[safeTicketIndex] || activeTicketData;

  // Track status transitions to trigger chime when called
  useEffect(() => {
    const currentStatus = currentTicketData?.status || currentTicketData?.entry?.status;
    if (currentStatus === 'CALLING' && prevStatusRef.current !== 'CALLING') {
      playCallChime();
    }
    prevStatusRef.current = currentStatus || null;
  }, [currentTicketData]);

  // Real-time socket updates if customer has an active ticket
  useQueueSocket(currentTicketData?.entry?.queueId, () => {
    refetchTicket();
  });

  // 2. Fetch all organizations with branches & services
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
  });

  // 3. Fetch customer appointments
  const { data: appointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: getMyAppointments,
  });

  // 4. Fetch customer queue history
  const { data: queueHistory, refetch: refetchQueueHistory, isLoading: queueHistoryLoading } = useQuery({
    queryKey: ['my-queue-history'],
    queryFn: getMyQueueHistory,
  });

  // Auto-select first org/branch/service if not selected
  useEffect(() => {
    if (organizations && organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  const selectedOrg = organizations?.find((o: any) => o.id === selectedOrgId) || organizations?.[0];
  
  useEffect(() => {
    if (selectedOrg?.branches && selectedOrg.branches.length > 0) {
      const branchExists = selectedOrg.branches.some((b: any) => b.id === selectedBranchId);
      if (!branchExists) {
        setSelectedBranchId(selectedOrg.branches[0].id);
      }
    }
  }, [selectedOrg, selectedBranchId]);

  const selectedBranch = selectedOrg?.branches?.find((b: any) => b.id === selectedBranchId) || selectedOrg?.branches?.[0];

  useEffect(() => {
    if (selectedBranch?.services && selectedBranch.services.length > 0) {
      const serviceExists = selectedBranch.services.some((s: any) => s.id === selectedServiceId);
      if (!serviceExists) {
        setSelectedServiceId(selectedBranch.services[0].id);
      }
    }
  }, [selectedBranch, selectedServiceId]);

  const selectedService = selectedBranch?.services?.find((s: any) => s.id === selectedServiceId) || selectedBranch?.services?.[0];

  // 4. Fetch dynamic appointment slots for booking
  const { data: availableSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['available-slots', selectedBranch?.id, selectedService?.id, appointmentDate],
    queryFn: () => getAvailableAppointmentSlots(selectedBranch!.id, selectedService!.id, appointmentDate),
    enabled: !!selectedBranch?.id && !!selectedService?.id && !!appointmentDate && activeTab === 'join_or_book' && actionChoice === 'appointment',
  });

  // Auto-select first available slot
  useEffect(() => {
    if (availableSlots && availableSlots.length > 0) {
      const firstAvailable = availableSlots.find((s: any) => s.available);
      if (firstAvailable) {
        setSelectedSlotTime(firstAvailable.time);
      } else {
        setSelectedSlotTime('');
      }
    }
  }, [availableSlots]);

  // 5. Fetch dynamic appointment slots for rescheduling modal
  const { data: rescheduleSlots, isLoading: rescheduleSlotsLoading } = useQuery({
    queryKey: ['reschedule-slots', reschedulingAppointment?.branchId, reschedulingAppointment?.serviceId, rescheduleDate],
    queryFn: () => getAvailableAppointmentSlots(reschedulingAppointment.branchId, reschedulingAppointment.serviceId, rescheduleDate),
    enabled: !!reschedulingAppointment && !!rescheduleDate,
  });

  // Mutations
  const cancelTicketMutation = useMutation({
    mutationFn: (entryId: string) => cancelEntry(entryId),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Ticket successfully cancelled.' });
      setConfirmCancelTicketId(null);
      refetchTicket();
    },
    onError: (err: any) => {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to cancel ticket' });
      setConfirmCancelTicketId(null);
    },
  });

  const joinQueueMutation = useMutation({
    mutationFn: (queueId: string) => joinQueue(queueId),
    onSuccess: (data) => {
      setActionMessage({ type: 'success', text: `Joined queue! Your ticket number is ${data.ticketNumber || data.position}` });
      setActiveTab('ticket');
      refetchTicket();
    },
    onError: (err: any) => {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to join queue' });
    },
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: (data: any) => createAppointment(data),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setActiveTab('appointments');
      refetchAppointments();
    },
    onError: (err: any) => {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to book appointment' });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Appointment cancelled.' });
      refetchAppointments();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledTime }: { id: string; scheduledTime: string }) => 
      rescheduleAppointment(id, scheduledTime),
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
      setReschedulingAppointment(null);
      refetchAppointments();
    },
    onError: (err: any) => {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to reschedule appointment' });
    },
  });

  const handleJoinQueue = () => {
    setActionMessage(null);
    const queueId = selectedService?.queues?.[0]?.id;
    if (!queueId) {
      setActionMessage({ type: 'error', text: 'No active queue found for this service at the selected branch.' });
      return;
    }
    joinQueueMutation.mutate(queueId);
  };

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    if (!selectedBranch?.id || !selectedService?.id || !appointmentDate || !selectedSlotTime) {
      setActionMessage({ type: 'error', text: 'Please select a branch, service, date, and available time slot.' });
      return;
    }

    const scheduledTime = new Date(`${appointmentDate}T${selectedSlotTime}:00`).toISOString();
    bookAppointmentMutation.mutate({
      branchId: selectedBranch.id,
      serviceId: selectedService.id,
      scheduledTime,
      notes: appointmentNotes,
    });
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingAppointment || !rescheduleDate || !rescheduleSlotTime) {
      return;
    }
    const scheduledTime = new Date(`${rescheduleDate}T${rescheduleSlotTime}:00`).toISOString();
    rescheduleMutation.mutate({
      id: reschedulingAppointment.id,
      scheduledTime,
    });
  };

  const hasActiveTicket = activeTickets.length > 0;
  const currentTicket = currentTicketData?.entry;
  const ticketStatus = currentTicketData?.status || currentTicket?.status;
  const isCalling = ticketStatus === 'CALLING';
  const isServing = ticketStatus === 'SERVING';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Customer Portal
          </span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            QueueLess Service Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time virtual counter tickets and branch appointment scheduling.
          </p>
        </div>

        {/* Real-Time Live Clock Widget */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-white text-slate-800 px-4 py-2.5 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-mono font-black text-sm tracking-wider leading-tight text-slate-900">
              {liveTime}
            </p>
            <p className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 inline" />
              {liveDate}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${
              activeTab === 'ticket' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Ticket className="w-4 h-4 mr-2" />
            {activeTickets.length > 1 ? `My Tickets (${activeTickets.length})` : 'My Ticket'}
            {hasActiveTicket && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-black ${
                activeTickets.some((t: any) => t.status === 'CALLING') 
                  ? 'bg-amber-400 text-amber-950 animate-bounce' 
                  : 'bg-blue-200 text-blue-900'
              }`}>
                {activeTickets.some((t: any) => t.status === 'CALLING') 
                  ? 'CALLING' 
                  : activeTickets.length > 1 
                  ? `${activeTickets.length} ACTIVE` 
                  : 'ACTIVE'}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('join_or_book')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${
              activeTab === 'join_or_book' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Join Queue / Book Visit
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${
              activeTab === 'appointments' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <CalendarCheck className="w-4 h-4 mr-2" />
            Appointments ({appointments?.length || 0})
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              refetchQueueHistory();
              refetchAppointments();
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            History ({ (queueHistory?.length || 0) + (appointments?.length || 0) })
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl flex items-center justify-between border ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center space-x-3">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold text-sm">{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)} 
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: CURRENT LIVE TICKET EXPERIENCE */}
      {activeTab === 'ticket' && (
        <div>
          {ticketLoading ? (
            <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-semibold">Retrieving your live counter ticket...</p>
            </div>
          ) : hasActiveTicket ? (
            <div className="space-y-6">
              {/* Calling Alert Banner */}
              {isCalling && (
                <div className="p-4 md:p-6 bg-amber-400 border border-amber-500 rounded-3xl text-amber-950 flex flex-col sm:flex-row items-center justify-between shadow-lg animate-pulse gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-950 text-amber-300 flex items-center justify-center font-black">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight">YOUR TICKET IS BEING CALLED!</h3>
                      <p className="text-sm font-semibold text-amber-900">Please approach the counter immediately.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => playCallChime()}
                    className="px-4 py-2 bg-amber-950 text-amber-200 text-xs font-bold rounded-xl shadow hover:bg-black transition-all flex items-center"
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" /> Replay Chime
                  </button>
                </div>
              )}

              {/* Cancellation Reason Alert Banner */}
              {(ticketStatus === 'CANCELLED' || currentTicketData?.cancellationReason) && (
                <div className="p-4 md:p-6 bg-rose-600 border border-rose-700 rounded-3xl text-white shadow-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight">TICKET CANCELLED</h3>
                      <p className="text-xs text-rose-100">
                        {currentTicketData?.cancelledBy
                          ? `Cancelled by ${currentTicketData.cancelledBy}`
                          : 'This ticket has been cancelled.'}
                        {currentTicketData?.cancelledAt
                          ? ` on ${new Date(currentTicketData.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  {currentTicketData?.cancellationReason && (
                    <div className="p-3.5 bg-black/20 rounded-2xl border border-white/10">
                      <span className="text-[11px] font-bold text-rose-200 uppercase tracking-wider block">
                        Official Cancellation Reason:
                      </span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {currentTicketData.cancellationReason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Active Queues Switcher */}
              {activeTickets.length > 1 && (
                <div className="bg-white p-4 rounded-3xl border border-blue-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                        You have {activeTickets.length} Active Queue Tickets
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Select a ticket below to view its live status and counter position
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {activeTickets.map((t: any, idx: number) => {
                      const isSelected = safeTicketIndex === idx;
                      const isItemCalling = t.status === 'CALLING';
                      return (
                        <button
                          key={t.entry?.id || idx}
                          onClick={() => setSelectedTicketIndex(idx)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <span>{t.ticketNumber}</span>
                          <span className="text-[10px] opacity-80">
                            • {t.branchName || t.serviceName}
                          </span>
                          {isItemCalling && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Primary Ticket Card */}
                <div className="lg:col-span-2 bg-blue-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div>
                    {/* Header Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/20">
                      <div>
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                          YOUR TICKET
                        </span>
                        <h2 className="text-2xl font-black mt-2">
                          {currentTicketData?.branchName || currentTicket?.queue?.branch?.name}
                        </h2>
                        <p className="text-blue-100 text-xs sm:text-sm flex items-center mt-1">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-blue-300" />
                          {currentTicketData?.branchLocation || currentTicket?.queue?.branch?.location}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-xs text-blue-200 block uppercase font-bold">Status</span>
                        <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mt-1 ${
                          isCalling
                            ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-300/40 animate-pulse'
                            : isServing
                            ? 'bg-emerald-400 text-emerald-950'
                            : 'bg-white/20 text-white'
                        }`}>
                          {ticketStatus}
                        </span>
                      </div>
                    </div>

                    {/* Big Bold Ticket Number */}
                    <div className="my-8 text-center py-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">
                        TICKET NUMBER
                      </p>
                      <h1 className="text-6xl md:text-7xl font-black tracking-wider my-2 text-white">
                        {currentTicketData?.ticketNumber || currentTicket?.ticketNumber || `#${currentTicket?.position}`}
                      </h1>
                      <div className="inline-flex items-center px-3 py-1 bg-white/15 rounded-full text-xs font-bold text-blue-100 mt-1">
                        Service: {currentTicketData?.serviceName || currentTicket?.queue?.service?.name}
                      </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <p className="text-blue-200 text-[11px] font-bold uppercase">Position</p>
                        <p className="text-3xl font-black mt-1">
                          {currentTicketData?.position ?? ((currentTicketData?.customersAhead ?? 0) + 1)}
                        </p>
                        <p className="text-[11px] text-blue-200">in line</p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-blue-200 text-[11px] font-bold uppercase">Estimated Wait</p>
                            {currentTicketData?.isDynamic && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-400 text-emerald-950 uppercase tracking-wider">
                                Dynamic
                              </span>
                            )}
                          </div>
                          <p className="text-3xl font-black mt-1">
                            {currentTicketData?.estimatedWaitTimeMinutes ?? 0}
                          </p>
                          <p className="text-[11px] text-blue-200">minutes</p>
                        </div>
                        <p className="text-[10px] text-blue-200/80 font-medium mt-1">
                          {currentTicketData?.isDynamic
                            ? `~${currentTicketData.dynamicPaceMinutes}m pace (${currentTicketData.completedSampleCount} recent)`
                            : `~${currentTicketData?.baselineDurationMinutes || 15}m standard pace`}
                        </p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <p className="text-blue-200 text-[11px] font-bold uppercase">Customers Ahead</p>
                        <p className="text-3xl font-black mt-1">
                          {currentTicketData?.customersAhead ?? currentTicketData?.peopleAhead ?? 0}
                        </p>
                        <p className="text-[11px] text-blue-200">waiting</p>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                        <p className="text-blue-200 text-[11px] font-bold uppercase">Now Serving</p>
                        <p className="text-2xl font-black mt-2 text-amber-300">
                          {currentTicketData?.nowServing?.ticketNumber || '—'}
                        </p>
                        <p className="text-[11px] text-blue-200">at counter</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-8 pt-6 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center text-xs text-blue-200">
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin text-blue-300" style={{ animationDuration: '6s' }} />
                      <span>Live WebSocket synchronized</span>
                    </div>

                    <button
                      onClick={() => setConfirmCancelTicketId(currentTicket.id)}
                      className="px-4 py-2 bg-rose-500/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Leave / Cancel Ticket
                    </button>
                  </div>
                </div>

                {/* Sidebar Guidelines Card */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-blue-600" /> Counter Etiquette
                    </h3>
                    <ul className="space-y-3.5 text-sm text-gray-600">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 shrink-0" />
                        <span>Please stay in or near the lobby when you have 1-2 customers ahead.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 shrink-0" />
                        <span>Have valid identification and supporting paperwork ready.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2.5 mt-0.5 shrink-0" />
                        <span>When your number chimes, proceed immediately to the counter desk.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-3xl p-6 text-center">
                    <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-bold text-gray-900 text-sm">Need a guaranteed future time?</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Schedule a fixed appointment slot for another day.
                    </p>
                    <button
                      onClick={() => {
                        setActionChoice('appointment');
                        setActiveTab('join_or_book');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center shadow"
                    >
                      Book an Appointment <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* No active ticket state */
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-2xl mx-auto my-8">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Ticket className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">No Active Ticket</h2>
              <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
                Select your organization, branch, and service to join a virtual queue or schedule an advance appointment.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => {
                    setActionChoice('queue');
                    setActiveTab('join_or_book');
                  }}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center"
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Join Branch Queue
                </button>
                <button
                  onClick={() => {
                    setActionChoice('appointment');
                    setActiveTab('join_or_book');
                  }}
                  className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center"
                >
                  <Calendar className="w-4 h-4 mr-2" /> Schedule Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRIMARY USER JOURNEY (SELECT ORG -> BRANCH -> SERVICE -> CHOOSE QUEUE OR APPOINTMENT) */}
      {activeTab === 'join_or_book' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              Start Your Service Request
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Follow the steps below to join a live counter line or schedule a visit.
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Select Organization */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                1. Select Organization
              </label>
              <select
                value={selectedOrgId || selectedOrg?.id || ''}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-semibold"
              >
                {organizations?.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Branch */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                2. Select Branch Location
              </label>
              <select
                value={selectedBranchId || selectedBranch?.id || ''}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-semibold"
              >
                {selectedOrg?.branches?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.location} ({b.operatingHours || '08:00 - 18:00'})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Select Service */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                3. Select Service
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedBranch?.services?.map((s: any) => {
                  const isSelected = (selectedServiceId || selectedBranch?.services?.[0]?.id) === s.id;
                  return (
                    <label
                      key={s.id}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="radio"
                          name="selected_service"
                          value={s.id}
                          checked={isSelected}
                          onChange={() => setSelectedServiceId(s.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          ~{s.duration || 15}m
                        </span>
                      </div>
                      <span className="font-bold text-gray-900 mt-2 text-sm">{s.name}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{s.description || 'Standard counter service'}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Choose Option (Join Queue vs Book Appointment) */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                4. Choose Service Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActionChoice('queue')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    actionChoice === 'queue'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold mb-3">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">Join Live Queue Now</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Get an instant digital ticket and monitor your counter position in real time.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActionChoice('appointment')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    actionChoice === 'appointment'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">Schedule Appointment</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Reserve a guaranteed future time slot with double-booking prevention.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* If actionChoice === 'queue' */}
            {actionChoice === 'queue' && (
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-gray-500">
                  You will receive a ticket for <strong className="text-gray-800">{selectedService?.name}</strong> at <strong className="text-gray-800">{selectedBranch?.name}</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleJoinQueue}
                  disabled={joinQueueMutation.isPending}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm flex items-center justify-center"
                >
                  {joinQueueMutation.isPending ? 'Joining Queue...' : 'Confirm & Get Ticket'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}

            {/* If actionChoice === 'appointment' */}
            {actionChoice === 'appointment' && (
              <form onSubmit={handleBookAppointment} className="space-y-5 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Available Time Slots
                    </label>
                    {slotsLoading ? (
                      <div className="p-3 text-xs text-gray-500 flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Checking slot availability...
                      </div>
                    ) : !availableSlots || availableSlots.length === 0 ? (
                      <p className="text-xs text-rose-500 font-semibold p-3">
                        No available slots on this date (operating hours Monday - Saturday).
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                        {availableSlots.map((slot: any) => (
                          <button
                            type="button"
                            key={slot.time}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlotTime(slot.time)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all text-center border ${
                              selectedSlotTime === slot.time
                                ? 'bg-blue-600 text-white border-blue-600 shadow'
                                : slot.available
                                ? 'bg-white hover:bg-blue-50 text-gray-800 border-gray-200'
                                : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                            }`}
                            title={slot.reason || 'Available'}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Notes or Reason for Visit (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    placeholder="Specify any questions, special assistance, or service account details..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-medium"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={bookAppointmentMutation.isPending || !selectedSlotTime}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    {bookAppointmentMutation.isPending ? 'Booking Slot...' : 'Confirm Appointment'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER APPOINTMENTS WITH RESCHEDULE & CANCEL */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Scheduled Appointments</h2>
              <p className="text-gray-500 text-sm mt-0.5">Manage and reschedule upcoming branch consultations.</p>
            </div>
            <button
              onClick={() => {
                setActionChoice('appointment');
                setActiveTab('join_or_book');
              }}
              className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-xl text-xs flex items-center self-start"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" /> Book Another Visit
            </button>
          </div>

          {!appointments || appointments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-base text-gray-700">No appointments scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Book your first branch appointment in seconds.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt: any) => {
                const canModify = apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
                return (
                  <div
                    key={apt.id}
                    className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-gray-900 text-base">{apt.service?.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {apt.branch?.name} ({apt.branch?.location})
                      </p>
                      {apt.notes && (
                        <p className="text-xs text-gray-400 italic">"{apt.notes}"</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="sm:text-right">
                        <p className="text-sm font-black text-gray-800">
                          {new Date(apt.scheduledTime).toLocaleDateString(undefined, { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                        <p className="text-xs text-blue-600 font-bold flex items-center sm:justify-end mt-0.5">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {canModify && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setReschedulingAppointment(apt);
                              setRescheduleDate(new Date(apt.scheduledTime).toISOString().split('T')[0]);
                              setRescheduleSlotTime('');
                            }}
                            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => cancelAppointmentMutation.mutate(apt.id)}
                            disabled={cancelAppointmentMutation.isPending}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITY & HISTORY (QUEUES & APPOINTMENTS) */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Activity & Visit History</h2>
              <p className="text-gray-500 text-sm mt-0.5">Comprehensive audit trail of your virtual counter tickets and appointment visits.</p>
            </div>

            {/* Sub-tab pills */}
            <div className="flex bg-gray-100 p-1 rounded-2xl self-start text-xs font-bold">
              <button
                type="button"
                onClick={() => setHistorySubTab('queues')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center ${
                  historySubTab === 'queues' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 mr-1.5" />
                Queue Tickets ({queueHistory?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setHistorySubTab('appointments')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center ${
                  historySubTab === 'appointments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Appointments ({appointments?.length || 0})
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Queue Tickets History */}
          {historySubTab === 'queues' && (
            <div>
              {queueHistoryLoading ? (
                <div className="p-12 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold text-sm">Loading queue ticket history...</p>
                </div>
              ) : !queueHistory || queueHistory.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-base text-gray-700">No past queue tickets found</p>
                  <p className="text-xs text-gray-400 mt-1">Tickets you take at any branch will appear here in chronological order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queueHistory.map((item: any) => {
                    const joinedTime = item.joinedAt ? new Date(item.joinedAt) : null;
                    const calledTime = item.calledAt ? new Date(item.calledAt) : null;
                    const completedTime = item.completedAt ? new Date(item.completedAt) : null;
                    const isTicketCompleted = item.status === 'COMPLETED';
                    const isTicketCancelled = item.status === 'CANCELLED';
                    const isTicketSkipped = item.status === 'SKIPPED';
                    const isTicketActive = item.status === 'WAITING' || item.status === 'CALLING' || item.status === 'SERVING';

                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-black text-blue-600 font-mono">
                              {item.ticketNumber || `#${item.position}`}
                            </span>
                            <span className="font-black text-gray-900 text-base">
                              {item.queue?.service?.name}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                              isTicketCompleted ? 'bg-emerald-100 text-emerald-800' :
                              isTicketCancelled ? 'bg-rose-100 text-rose-800' :
                              isTicketSkipped ? 'bg-amber-100 text-amber-800' :
                              item.status === 'CALLING' ? 'bg-amber-400 text-amber-950 animate-pulse' :
                              item.status === 'SERVING' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            {item.queue?.branch?.organization?.name} — {item.queue?.branch?.name} ({item.queue?.branch?.location})
                          </p>

                          {/* Cancellation Details in History */}
                          {item.cancellationReason && (
                            <div className="mt-1.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                              <div>
                                <span className="font-bold">Cancellation Reason: </span>
                                <span>{item.cancellationReason}</span>
                                {item.cancelledBy && (
                                  <span className="text-rose-600 text-[11px] block mt-0.5 font-medium">
                                    Cancelled by: {item.cancelledBy}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-bold text-gray-700 block">Joined</span>
                            <span>{joinedTime?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {joinedTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          {calledTime && (
                            <div>
                              <span className="font-bold text-gray-700 block">Called</span>
                              <span>{calledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}

                          {completedTime && (
                            <div>
                              <span className="font-bold text-emerald-700 block">Completed</span>
                              <span>{completedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}

                          {isTicketActive && (
                            <button
                              onClick={() => setActiveTab('ticket')}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-blue-700 transition-all"
                            >
                              View Active
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Appointments History */}
          {historySubTab === 'appointments' && (
            <div>
              {!appointments || appointments.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-base text-gray-700">No appointment records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt: any) => {
                    const isUpcoming = new Date(apt.scheduledTime) >= new Date() && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
                    return (
                      <div
                        key={apt.id}
                        className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white hover:shadow-sm transition-all"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-gray-900 text-base">{apt.service?.name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                              apt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                              apt.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {apt.status}
                            </span>
                            {isUpcoming && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black uppercase">
                                UPCOMING
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                            {apt.branch?.organization?.name || apt.branch?.name} — {apt.branch?.name} ({apt.branch?.location})
                          </p>

                          {apt.notes && (
                            <p className="text-xs text-gray-400 italic">"{apt.notes}"</p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="sm:text-right">
                            <p className="text-sm font-black text-gray-800">
                              {new Date(apt.scheduledTime).toLocaleDateString(undefined, { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                            <p className="text-xs text-blue-600 font-bold flex items-center sm:justify-end mt-0.5">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {isUpcoming && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setReschedulingAppointment(apt);
                                  setRescheduleDate(new Date(apt.scheduledTime).toISOString().split('T')[0]);
                                  setRescheduleSlotTime('');
                                }}
                                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => cancelAppointmentMutation.mutate(apt.id)}
                                disabled={cancelAppointmentMutation.isPending}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR LEAVING TICKET */}
      {confirmCancelTicketId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-gray-900">Cancel Queue Ticket?</h3>
              <p className="text-sm text-gray-500 mt-1">
                You will lose your current position in line. This cannot be undone.
              </p>
            </div>
            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancelTicketId(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
              >
                Keep My Place
              </button>
              <button
                type="button"
                onClick={() => cancelTicketMutation.mutate(confirmCancelTicketId)}
                disabled={cancelTicketMutation.isPending}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md"
              >
                {cancelTicketMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" /> Reschedule Appointment
              </h3>
              <button
                onClick={() => setReschedulingAppointment(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium">
                Service: <strong className="text-gray-800">{reschedulingAppointment.service?.name}</strong> at <strong className="text-gray-800">{reschedulingAppointment.branch?.name}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Available Consultation Slots
                </label>
                {rescheduleSlotsLoading ? (
                  <p className="text-xs text-gray-500 flex items-center p-2">
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Checking slot availability...
                  </p>
                ) : !rescheduleSlots || rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-rose-500 font-semibold p-2">
                    No slots available on this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                    {rescheduleSlots.map((slot: any) => (
                      <button
                        type="button"
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setRescheduleSlotTime(slot.time)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all text-center border ${
                          rescheduleSlotTime === slot.time
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : slot.available
                            ? 'bg-white hover:bg-blue-50 text-gray-800 border-gray-200'
                            : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReschedulingAppointment(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={rescheduleMutation.isPending || !rescheduleSlotTime}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50"
              >
                {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
