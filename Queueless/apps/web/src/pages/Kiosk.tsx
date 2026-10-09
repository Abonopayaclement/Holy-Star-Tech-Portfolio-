import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAllOrganizations } from '../api/branch';
import { getKioskServices, issueKioskTicket, KioskServiceItem, PrintableTicket } from '../api/kiosk';
import ThermalTicketSlip from '../components/ThermalTicketSlip';
import { useAuth } from '../hooks/useAuth';
import {
  Building,
  Printer,
  CheckCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Smartphone,
  Sparkles,
  RefreshCw,
  Users,
  ChevronRight,
} from 'lucide-react';

export const Kiosk: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branchId: paramBranchId } = useParams<{ branchId?: string }>();
  const [selectedBranchId, setSelectedBranchId] = useState<string>(paramBranchId || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const userOrgId = user?.organizationId || user?.staffBranch?.organizationId || (user as any)?.managedBranches?.[0]?.organizationId;

  // Ticket creation flow states: 'SELECT_SERVICE' | 'CONFIRM_SERVICE' | 'TICKET_ISSUED'
  const [selectedService, setSelectedService] = useState<KioskServiceItem | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<PrintableTicket | null>(null);
  const [autoResetSeconds, setAutoResetSeconds] = useState(15);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inactivity timeout ref
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch organizations to pick branch if not provided in URL
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
    enabled: !paramBranchId,
  });

  const scopedBranches = React.useMemo(() => {
    if (!organizations) return [];
    const filteredOrgs = userOrgId ? organizations.filter((o: any) => o.id === userOrgId) : organizations;
    return filteredOrgs.flatMap((org: any) =>
      (org.branches || []).map((b: any) => ({
        ...b,
        orgName: org.name,
      }))
    );
  }, [organizations, userOrgId]);

  useEffect(() => {
    if (!selectedBranchId && scopedBranches.length > 0) {
      setSelectedBranchId(scopedBranches[0].id);
    }
  }, [scopedBranches, selectedBranchId]);

  // Fetch branch kiosk services from public kiosk endpoint (Part 6 & 8)
  const {
    data: kioskData,
    isLoading: isKioskLoading,
    error: kioskError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['kiosk-services', selectedBranchId],
    queryFn: () => getKioskServices(selectedBranchId),
    enabled: !!selectedBranchId,
    refetchInterval: 12000,
  });

  // Issue ticket mutation with duplicate submission protection (Part 26)
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBranchId || !selectedService) {
        throw new Error('Please select a service first.');
      }
      return await issueKioskTicket({
        branchId: selectedBranchId,
        serviceId: selectedService.id,
        phoneNumber: phoneNumber.trim() || undefined,
        fullName: fullName.trim() || undefined,
      });
    },
    onMutate: () => {
      setIsSubmitting(true);
      setErrorMessage(null);
    },
    onSuccess: (ticketData) => {
      setIsSubmitting(false);
      setIssuedTicket(ticketData);
      setAutoResetSeconds(15);
      // Auto trigger printable thermal slip
      setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Print trigger note:', e);
        }
      }, 500);
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "We couldn't issue your ticket. Please try again or ask a staff member for assistance.";
      setErrorMessage(msg);
    },
  });

  // Inactivity auto-reset: resets to Step 1 after 45s of user inactivity on Step 2
  useEffect(() => {
    if (selectedService && !issuedTicket) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        resetKiosk();
      }, 45000);
    }
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [selectedService, issuedTicket]);

  // Success screen auto-reset timer (Part 31: safe timeout)
  useEffect(() => {
    if (!issuedTicket) return;

    const timer = setInterval(() => {
      setAutoResetSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetKiosk();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [issuedTicket]);

  const resetKiosk = () => {
    setIssuedTicket(null);
    setSelectedService(null);
    setPhoneNumber('');
    setFullName('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const branchInfo = kioskData?.branch;
  const services = kioskData?.services || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans select-none overflow-x-hidden">
      {/* Top Touch Kiosk Bar */}
      <header className="px-6 py-4 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 border border-slate-700/80"
            title="Exit Kiosk"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Exit Kiosk</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
            Q
          </div>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {branchInfo?.organizationName || 'QueueLess'} • {branchInfo?.name || 'Self-Service Kiosk'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center font-medium mt-0.5 truncate">
              <Building className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
              {branchInfo?.location || 'Physical Service Center'}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {!paramBranchId && scopedBranches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 outline-none hidden md:block"
            >
              {scopedBranches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.location || 'Branch'})
                </option>
              ))}
            </select>
          )}

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-blue-400 tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Kiosk Touch Surface */}
      <main className="flex-1 p-6 sm:p-12 max-w-5xl w-full mx-auto flex flex-col justify-center">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/80 border-2 border-red-500/80 text-red-200 flex items-center justify-between text-sm sm:text-base font-semibold shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-3 py-1 bg-red-800/60 hover:bg-red-700 rounded-lg text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {isKioskLoading ? (
          <div className="text-center py-24">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-bold text-xl">Loading Available Services...</p>
          </div>
        ) : kioskError ? (
          <div className="text-center py-16 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-lg mx-auto">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white">Service Center Unavailable</h3>
            <p className="text-sm text-slate-400 mt-2">
              This branch or kiosk is currently unreachable. Please check with service desk staff.
            </p>
            <button
              onClick={() => refetchServices()}
              className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : issuedTicket ? (
          /* =========================================================================
             SCREEN 3: TICKET ISSUED SUCCESS (Part 5 & Part 10)
             ========================================================================= */
          <div className="bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-full">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle className="w-12 h-12" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">
              YOUR TICKET IS READY
            </span>

            {/* Ticket Card */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl py-8 px-6 my-6 shadow-inner">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">YOUR TICKET NUMBER</span>
              <div className="text-7xl sm:text-8xl font-black text-white tracking-wider my-3 font-mono">
                {issuedTicket.ticketNumber}
              </div>
              <div className="inline-block px-5 py-2 rounded-full bg-blue-600/30 text-blue-300 font-extrabold text-base border border-blue-500/40">
                {issuedTicket.serviceName}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center my-6">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block uppercase">Customers Ahead</span>
                <span className="text-3xl font-black text-white mt-1 block font-mono">
                  {issuedTicket.peopleAhead}
                </span>
              </div>
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-slate-400 text-xs font-bold block uppercase">Estimated Wait</span>
                <span className="text-3xl font-black text-amber-400 mt-1 block font-mono">
                  {issuedTicket.estimatedWaitMinutes} min
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-300 mb-6">
              Please wait for your number to be called on the Lobby TV screen.
            </p>

            {/* Thermal Ticket Slip component for print */}
            <div className="hidden print:block my-4">
              <ThermalTicketSlip
                ticketNumber={issuedTicket.ticketNumber}
                serviceName={issuedTicket.serviceName}
                branchName={issuedTicket.branchName}
                organizationName={issuedTicket.organizationName}
                branchLocation={issuedTicket.branchLocation}
                position={issuedTicket.position}
                peopleAhead={issuedTicket.peopleAhead}
                estimatedWaitMinutes={issuedTicket.estimatedWaitMinutes}
                formattedDate={issuedTicket.formattedDate}
                formattedTime={issuedTicket.formattedTime}
                counterNumber={issuedTicket.counterNumber}
                instruction={issuedTicket.instruction}
                reprintCount={issuedTicket.reprintCount}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center text-lg active:scale-95"
              >
                <Printer className="w-6 h-6 mr-2" />
                Print Slip Again
              </button>

              <button
                onClick={resetKiosk}
                className="w-full sm:w-auto px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center text-lg active:scale-95"
              >
                Done
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-6 font-medium">
              Screen returns to start in <span className="font-bold text-amber-400">{autoResetSeconds}s</span>
            </p>
          </div>
        ) : selectedService ? (
          /* =========================================================================
             SCREEN 2: CONFIRMATION & "GET TICKET" (Part 5)
             ========================================================================= */
          <div className="bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-8 sm:p-12 max-w-lg mx-auto shadow-2xl animate-in zoom-in-95 duration-150 w-full text-center">
            <span className="text-xs font-black uppercase tracking-widest text-blue-400 block mb-1">
              SERVICE SELECTED
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-1 mb-2">
              {selectedService.name}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Estimated wait: ~{selectedService.estimatedWaitMinutes} minutes • {selectedService.waitingCount} in line
            </p>

            <div className="text-left bg-slate-950/90 p-5 rounded-2xl border border-slate-800 mb-8 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center">
                  <Smartphone className="w-4 h-4 mr-1.5 text-blue-400" />
                  Mobile Phone (Optional for SMS notifications)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +233 24 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium text-base focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Visitor Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ama Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium text-base focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => issueMutation.mutate()}
                disabled={isSubmitting || selectedService.isFull}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center text-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-7 h-7 mr-3 animate-spin" />
                    Generating Ticket...
                  </>
                ) : (
                  <>
                    <Printer className="w-7 h-7 mr-3" />
                    GET TICKET
                  </>
                )}
              </button>

              <button
                onClick={() => setSelectedService(null)}
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all text-base border border-slate-700 active:scale-95"
              >
                Back to Services
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             SCREEN 1: WELCOME & TOUCH SERVICE TILES (Part 5 & Part 6)
             ========================================================================= */
          <div>
            <div className="text-center mb-10">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black uppercase tracking-widest mb-3">
                <Sparkles className="w-4 h-4 mr-2" />
                WELCOME TO QUEUELESS
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                Select a Service
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mt-3 max-w-xl mx-auto">
                Touch a service category below to get your ticket and join the queue.
              </p>
            </div>

            {services.length === 0 ? (
              <div className="p-16 text-center bg-slate-900/80 rounded-3xl border border-slate-800 max-w-lg mx-auto">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-white">No Walk-In Services Open</h3>
                <p className="text-sm text-slate-400 mt-2">
                  All service queues are currently closed or at full capacity. Please speak with a staff member.
                </p>
                <button
                  onClick={() => refetchServices()}
                  className="mt-6 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm"
                >
                  Refresh Status
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service: KioskServiceItem) => {
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      disabled={service.isFull}
                      className="group relative p-7 rounded-3xl bg-slate-900 border-2 border-slate-800 hover:border-blue-500 hover:bg-slate-850 hover:shadow-2xl hover:shadow-blue-500/10 text-left transition-all duration-200 flex flex-col justify-between min-h-[220px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xl">
                            {service.name[0]}
                          </span>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            ~{service.duration || 15}m duration
                          </span>
                        </div>

                        <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="flex items-center text-slate-400 font-semibold">
                            <Users className="w-4 h-4 mr-1 text-slate-500" />
                            {service.waitingCount} waiting
                          </span>
                          <span className="text-amber-400 font-bold">
                            ~{service.estimatedWaitMinutes}m wait
                          </span>
                        </div>

                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="px-6 py-4 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-600 font-medium">
        QueueLess Physical Kiosk System • Real-Time Synchronization Enabled
      </footer>
    </div>
  );
};

export default Kiosk;
