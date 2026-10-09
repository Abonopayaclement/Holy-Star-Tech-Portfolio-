import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAllOrganizations } from '../api/branch';
import {
  getLobbyState,
  getLobbyConfig,
  LobbyNowServingItem,
  LobbyQueueOverviewItem,
} from '../api/lobby';
import { playCallChime } from '../utils/sound';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { CONFIG } from '../utils/config';
import {
  Building,
  Users,
  Maximize2,
  Minimize2,
  RefreshCw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';

const SOCKET_URL = CONFIG.SOCKET_URL;

export const PublicDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { branchId: urlBranchId } = useParams<{ branchId?: string }>();
  const [selectedBranchId, setSelectedBranchId] = useState<string>(urlBranchId || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<'NOW_SERVING' | 'QUEUE_OVERVIEW' | 'COMBINED'>('COMBINED');
  const [isConnected, setIsConnected] = useState(true);
  const [recentlyCalledTicket, setRecentlyCalledTicket] = useState<string | null>(null);

  const userOrgId = user?.organizationId || user?.staffBranch?.organizationId || (user as any)?.managedBranches?.[0]?.organizationId;

  const prevCalledTicketRef = useRef<string | null>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch organizations to let operator pick branch if not provided in URL
  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
    enabled: !urlBranchId,
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

  // Fetch lobby configuration (default display mode, voice announcement settings)
  const { data: lobbyConfig } = useQuery({
    queryKey: ['lobby-config', selectedBranchId],
    queryFn: () => getLobbyConfig(selectedBranchId),
    enabled: !!selectedBranchId,
  });

  useEffect(() => {
    if (lobbyConfig?.mode) {
      setDisplayMode(lobbyConfig.mode);
    }
    if (lobbyConfig?.voiceEnabled !== undefined) {
      setVoiceEnabled(lobbyConfig.voiceEnabled);
    }
  }, [lobbyConfig]);

  // Authoritative Lobby Display State (Part 18, 19, 32)
  const {
    data: lobbyState,
    refetch: refetchLobby,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['lobby-state', selectedBranchId],
    queryFn: () => getLobbyState(selectedBranchId),
    enabled: !!selectedBranchId,
    refetchInterval: 8000,
  });

  // Real-time Socket.IO synchronization with branch and lobby rooms (Part 17, 27, 34)
  useEffect(() => {
    if (!selectedBranchId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_lobby_room', selectedBranchId);
      socket.emit('join_branch_room', selectedBranchId);
      refetchLobby();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('reconnect', () => {
      setIsConnected(true);
      refetchLobby();
    });

    socket.on('lobby_updated', () => {
      refetchLobby();
    });

    socket.on('ticket_called', (data: any) => {
      if (data?.ticketNumber) {
        setRecentlyCalledTicket(data.ticketNumber);
      }
      refetchLobby();
    });

    socket.on('queue_updated', () => {
      refetchLobby();
    });

    socket.on('counter_updated', () => {
      refetchLobby();
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedBranchId, refetchLobby]);

  // Sound chime & speech announcement when a ticket is called (Part 20 & 21)
  const latestCalledItem =
    lobbyState?.nowServing?.find((item: LobbyNowServingItem) => item.status === 'CALLING') ||
    lobbyState?.nowServing?.[0];

  useEffect(() => {
    if (latestCalledItem && latestCalledItem.ticketNumber !== prevCalledTicketRef.current) {
      playCallChime();

      setRecentlyCalledTicket(latestCalledItem.ticketNumber);

      if (voiceEnabled && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const cleanTicket = latestCalledItem.ticketNumber.split('').join(' ');
          const counterText = latestCalledItem.counterNumber || 'the service desk';
          const text = `Ticket ${cleanTicket}, please proceed to ${counterText}`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.92;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('Speech synthesis exception:', e);
        }
      }

      prevCalledTicketRef.current = latestCalledItem.ticketNumber;
    }
  }, [latestCalledItem, voiceEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const branchName = lobbyState?.branch?.name || 'Branch Service Center';
  const orgName = lobbyState?.branch?.organizationName || 'QueueLess';
  const nowServingList = lobbyState?.nowServing || [];
  const queueOverviewList = lobbyState?.queueOverview || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans select-none overflow-x-hidden">
      {/* Top Header Bar */}
      <header className="px-8 py-5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shadow-2xl">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 shrink-0"
            title="Return to Previous Page"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 shrink-0">
            Q
          </div>

          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 truncate max-w-xs sm:max-w-md lg:max-w-xl"
              title={`${orgName} • ${branchName}`}
            >
              <span className="truncate">{orgName} • {branchName}</span>
            </h1>
            <p className="text-xs font-semibold text-slate-400 flex items-center mt-0.5 truncate">
              <Building className="w-3.5 h-3.5 mr-1 text-slate-500 shrink-0" />
              Lobby Queue Display System
            </p>
          </div>
        </div>

        {/* Center / Mode Switcher (Part 32: Mode A, B, C) */}
        <div className="hidden md:flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 space-x-1">
          <button
            onClick={() => setDisplayMode('NOW_SERVING')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              displayMode === 'NOW_SERVING'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Now Serving
          </button>
          <button
            onClick={() => setDisplayMode('QUEUE_OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              displayMode === 'QUEUE_OVERVIEW'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Queue Overview
          </button>
          <button
            onClick={() => setDisplayMode('COMBINED')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              displayMode === 'COMBINED'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Combined View
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-5">
          {!urlBranchId && scopedBranches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 outline-none hidden lg:block"
            >
              {scopedBranches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.location || 'Branch'})
                </option>
              ))}
            </select>
          )}

          {/* Connection status badge (Part 27: Offline / Reconnection handling) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isConnected ? 'LIVE SYNC' : 'RECONNECTING...'}</span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-wider text-blue-400">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 font-semibold">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-2xl border transition-colors ${
              voiceEnabled
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30'
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-400'
            }`}
            title={voiceEnabled ? 'Voice chime & announcements ON' : 'Voice announcements MUTED'}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Display Canvas */}
      <main className="flex-1 p-6 sm:p-10 flex flex-col justify-center">
        {isLoading ? (
          <div className="text-center py-24">
            <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-xl">Connecting to Branch Lobby Feed...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl max-w-lg mx-auto p-10">
            <p className="text-amber-400 text-lg font-bold mb-4">Lobby stream unavailable</p>
            <button
              onClick={() => refetchLobby()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* =========================================================================
               MODE A: NOW SERVING (Part 18 & Part 32)
               ========================================================================= */}
            {displayMode === 'NOW_SERVING' && (
              <div className="max-w-6xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="text-center">
                  <div className="inline-flex items-center px-6 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-black uppercase tracking-widest mb-3 animate-pulse">
                    <Sparkles className="w-4 h-4 mr-2" />
                    NOW SERVING
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                    Active Service Counters
                  </h2>
                </div>

                {nowServingList.length === 0 ? (
                  <div className="p-20 text-center bg-slate-900/80 border border-slate-800 rounded-3xl">
                    <p className="text-3xl font-bold text-slate-400">All Service Counters Available</p>
                    <p className="text-slate-500 text-lg mt-2">Waiting for next customer tickets...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {nowServingList.map((item: LobbyNowServingItem) => {
                      const isHighlighted = item.ticketNumber === recentlyCalledTicket;
                      return (
                        <div
                          key={item.entryId}
                          className={`p-8 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                            isHighlighted
                              ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-400 shadow-2xl shadow-emerald-500/20 scale-[1.02]'
                              : 'bg-slate-900/90 border-slate-800'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
                              {item.serviceName}
                            </span>
                            <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight my-2">
                              {item.ticketNumber}
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs uppercase font-bold text-slate-400 block">PROCEED TO</span>
                              <span className="text-2xl sm:text-3xl font-black text-amber-400 uppercase">
                                {item.counterNumber}
                              </span>
                            </div>

                            <span
                              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                                item.status === 'CALLING'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}
                            >
                              {item.status === 'CALLING' ? 'CALLED' : 'SERVING'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
               MODE B: QUEUE OVERVIEW (Part 32)
               ========================================================================= */}
            {displayMode === 'QUEUE_OVERVIEW' && (
              <div className="max-w-5xl w-full mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="text-center">
                  <div className="inline-flex items-center px-6 py-2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-black uppercase tracking-widest mb-3">
                    <Users className="w-4 h-4 mr-2" />
                    LIVE WAITING OVERVIEW
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                    Service Line Status
                  </h2>
                </div>

                <div className="bg-slate-900/90 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                  <div className="grid grid-cols-3 p-6 bg-slate-950/80 border-b border-slate-800 text-xs font-black uppercase tracking-wider text-slate-400">
                    <div>SERVICE CATEGORY</div>
                    <div className="text-center">CUSTOMERS WAITING</div>
                    <div className="text-right">ESTIMATED WAIT</div>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {queueOverviewList.map((q: LobbyQueueOverviewItem) => (
                      <div key={q.serviceId} className="grid grid-cols-3 p-8 items-center hover:bg-slate-850/50 transition-colors">
                        <div>
                          <h3 className="text-2xl font-black text-white">{q.serviceName}</h3>
                          <span className="text-xs text-slate-400 font-semibold">
                            {q.activeCountersCount} active counter{q.activeCountersCount > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="text-center">
                          <span className="text-4xl font-black font-mono text-white px-5 py-2 rounded-2xl bg-slate-800 border border-slate-700 inline-block">
                            {q.waitingCount}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-3xl font-black text-amber-400 font-mono">
                            ~{q.estimatedWaitMinutes} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
               MODE C: COMBINED VIEW (Part 32: Now Serving + Queue Overview)
               ========================================================================= */}
            {displayMode === 'COMBINED' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch w-full max-w-7xl mx-auto animate-in fade-in duration-300">
                {/* Left 2 Columns: Prominent Now Serving */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
                      <h2 className="text-2xl font-black uppercase tracking-wider text-white">
                        NOW SERVING
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      Proceed immediately to designated counter
                    </span>
                  </div>

                  {nowServingList.length === 0 ? (
                    <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl min-h-[360px] flex flex-col justify-center items-center">
                      <Clock className="w-14 h-14 text-slate-600 mb-3" />
                      <p className="text-2xl font-bold text-slate-400">Counters Ready For Next Customer</p>
                      <p className="text-sm text-slate-500 mt-1">Please watch this screen for your ticket number.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {nowServingList.slice(0, 6).map((item: LobbyNowServingItem) => {
                        const isHighlighted = item.ticketNumber === recentlyCalledTicket;
                        return (
                          <div
                            key={item.entryId}
                            className={`p-7 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                              isHighlighted
                                ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-400 shadow-2xl shadow-emerald-500/20 scale-[1.02]'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                {item.serviceName}
                              </span>
                              <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight my-2">
                                {item.ticketNumber}
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400 block">DESK / COUNTER</span>
                                <span className="text-xl sm:text-2xl font-black text-amber-400 uppercase">
                                  {item.counterNumber}
                                </span>
                              </div>

                              <span
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                                  item.status === 'CALLING'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {item.status === 'CALLING' ? 'CALLED' : 'SERVING'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Queue Overview */}
                <div className="space-y-6">
                  <div className="pb-2 border-b border-slate-800">
                    <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-400" />
                      QUEUE STATUS
                    </h2>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    {queueOverviewList.map((q: LobbyQueueOverviewItem) => (
                      <div
                        key={q.serviceId}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-base font-black text-white">{q.serviceName}</h4>
                          <span className="text-xs text-amber-400 font-bold">~{q.estimatedWaitMinutes}m wait</span>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black font-mono text-white px-3.5 py-1 rounded-xl bg-slate-800 border border-slate-700 inline-block">
                            {q.waitingCount}
                          </span>
                          <span className="text-[10px] block text-slate-400 font-semibold uppercase mt-0.5">waiting</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Announcement Banner */}
                  <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 block mb-1">
                      AUDIO ANNOUNCEMENTS ENABLED
                    </span>
                    <p className="text-xs text-slate-300">
                      When your ticket number is called, a chime will play and your counter will be announced.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Public Display Footer with privacy notice */}
      <footer className="px-8 py-4 border-t border-slate-900 bg-slate-950 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium">
        <span>Powered by QueueLess • Real-Time Digital Lobby System</span>
        <span>Ticket-Number Privacy Protected • No Personal Data Exposed</span>
      </footer>
    </div>
  );
};

export default PublicDisplay;
