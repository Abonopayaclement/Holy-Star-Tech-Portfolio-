import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useActiveBranch } from '../context/ActiveBranchContext';
import { updateQueueStatus } from '../api/queue';
import {
  QrCode,
  PlusCircle,
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Eye,
  X,
  Building2,
  Copy,
  Check,
  RotateCw,
  Layers,
  Sparkles,
  Info,
  Loader2,
  Power,
  Trash2,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  duration?: number;
}

interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  duration: number;
  queueId?: string | null;
  queueStatus?: 'OPEN' | 'CLOSED';
  activeQrCount: number;
  totalQrCount: number;
  hasActiveQr: boolean;
  activeQr: QrRecord | null;
}

interface QrRecord {
  id: string;
  token: string;
  type: 'SERVICE' | 'BRANCH';
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiresAt: string | null;
  createdAt: string;
  revokedAt?: string | null;
  createdBy?: string | null;
  revokedBy?: string | null;
  service?: { id: string; name: string; duration?: number };
  branch?: { id: string; name: string; location?: string };
  organization?: { id: string; name: string };
}

interface QrStats {
  totalQrCodes: number;
  activeQrCodes: number;
  expiredQrCodes: number;
  revokedQrCodes: number;
  serviceBreakdown: ServiceBreakdown[];
  recentActivity: any[];
}

export const QrManagement: React.FC = () => {
  const { user } = useAuth();
  const { activeBranchId, setActiveBranchId } = useActiveBranch();

  // Branch & data states
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [stats, setStats] = useState<QrStats | null>(null);
  const [qrList, setQrList] = useState<QrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');

  // Role permissions: Only Org Admin & Branch Managers view aggregated QR stats & generate/revoke
  const isOrgAdminOrManager = user?.role === 'ORG_ADMIN' || user?.role === 'BRANCH_MANAGER';

  // Generation Modal states
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [targetServiceId, setTargetServiceId] = useState<string>('');
  const [validity, setValidity] = useState<string>('24_HOURS');
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // View / Print / Standee Modal states
  const [viewingQr, setViewingQr] = useState<QrRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Revoke Confirmation states
  const [revokingQr, setRevokingQr] = useState<QrRecord | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [closeQueueOnRevoke, setCloseQueueOnRevoke] = useState(true);

  // Queue status toggle state
  const [togglingQueueId, setTogglingQueueId] = useState<string | null>(null);

  // User feedback notice
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Keep selected branch synced with global active branch
  useEffect(() => {
    if (activeBranchId && activeBranchId !== selectedBranchId) {
      setSelectedBranchId(activeBranchId);
    }
  }, [activeBranchId, selectedBranchId]);

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
    setActiveBranchId(newBranchId);
  };

  // Fetch branches accessible to this user (strictly scoped to user's organization)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await api.get('/organizations/public');
        const userOrgId = user?.organizationId || user?.staffBranch?.organizationId || (user as any)?.managedBranches?.[0]?.organizationId;

        const filteredOrgs = userOrgId
          ? res.data.filter((org: any) => org.id === userOrgId)
          : res.data;

        const allBranches: any[] = [];
        filteredOrgs.forEach((org: any) => {
          if (org.branches) {
            org.branches.forEach((b: any) => {
              allBranches.push({ ...b, organizationName: org.name, organizationId: org.id });
            });
          }
        });
        setBranches(allBranches);
        if (allBranches.length > 0) {
          const matchedBranch =
            (activeBranchId && allBranches.find((b) => b.id === activeBranchId)) ||
            allBranches.find((b) => b.id === user?.staffBranchId) ||
            allBranches[0];
          setSelectedBranchId(matchedBranch.id);
        }
      } catch (err) {
        console.error('Failed to load branches:', err);
      }
    };

    fetchBranches();
  }, [user, activeBranchId]);

  // Load branch statistics, QR list, and services
  const loadBranchData = useCallback(async (branchId: string) => {
    if (!branchId) return;
    try {
      setRefreshing(true);
      if (isOrgAdminOrManager) {
        const [statsRes, listRes, branchRes] = await Promise.all([
          api.get(`/organizations/branch/${branchId}/qr-stats`),
          api.get(`/organizations/branch/${branchId}/qr-list`),
          api.get(`/organizations/branch/${branchId}`),
        ]);

        setStats(statsRes.data);
        setQrList(listRes.data || []);
        if (branchRes.data?.services) {
          setServices(branchRes.data.services);
          if (!targetServiceId && branchRes.data.services.length > 0) {
            setTargetServiceId(branchRes.data.services[0].id);
          }
        }
      } else {
        const [listRes, branchRes] = await Promise.all([
          api.get(`/organizations/branch/${branchId}/qr-list`),
          api.get(`/organizations/branch/${branchId}`),
        ]);

        setStats(null);
        setQrList(listRes.data || []);
        if (branchRes.data?.services) {
          setServices(branchRes.data.services);
          if (!targetServiceId && branchRes.data.services.length > 0) {
            setTargetServiceId(branchRes.data.services[0].id);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load QR data:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [targetServiceId, isOrgAdminOrManager]);

  useEffect(() => {
    if (selectedBranchId) {
      loadBranchData(selectedBranchId);
    }
  }, [selectedBranchId, loadBranchData]);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || {
    name: 'Selected Branch',
    organizationName: 'Organization',
  };

  // Generate QR handler
  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId || !targetServiceId) {
      setNotice({ type: 'error', message: 'Please select a valid service for this QR code.' });
      return;
    }

    setGenerating(true);
    setNotice(null);
    try {
      const payload: any = {
        serviceId: targetServiceId,
        validity,
      };
      if (validity === 'CUSTOM' && customExpiresAt) {
        payload.customExpiresAt = new Date(customExpiresAt).toISOString();
      }

      const res = await api.post(`/organizations/branch/${selectedBranchId}/qr`, payload);
      setNotice({
        type: 'success',
        message: `Service QR code generated successfully for ${res.data.qr?.service?.name || 'service'}!`,
      });
      setIsGenerateModalOpen(false);
      await loadBranchData(selectedBranchId);
      setViewingQr(res.data.qr);
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.response?.data?.error || 'Failed to generate QR code.',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Revoke QR handler
  const handleRevokeQr = async () => {
    if (!revokingQr) return;
    setRevoking(true);
    try {
      await api.post(`/organizations/qr/${revokingQr.id}/revoke`, {
        closeQueue: closeQueueOnRevoke,
      });
      setNotice({
        type: 'success',
        message: `QR code for ${revokingQr.service?.name || 'service'} revoked.${closeQueueOnRevoke ? ' Service queue was also closed.' : ' Service queue remains unaffected.'}`,
      });
      setRevokingQr(null);
      await loadBranchData(selectedBranchId);
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.response?.data?.error || 'Failed to revoke QR code.',
      });
    } finally {
      setRevoking(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Delete expired/revoked QR handler
  const handleDeleteQr = async (qrId: string, token: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete this expired/revoked QR code (${token})?`)) {
      return;
    }
    setDeletingId(qrId);
    try {
      await api.delete(`/organizations/qr/${qrId}`);
      setNotice({
        type: 'success',
        message: `QR code (${token}) was permanently deleted.`,
      });
      await loadBranchData(selectedBranchId);
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete QR code.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle service queue OPEN / CLOSED status
  const handleToggleQueueStatus = async (queueId: string, currentStatus: 'OPEN' | 'CLOSED', serviceName: string) => {
    const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    setTogglingQueueId(queueId);
    try {
      await updateQueueStatus(queueId, nextStatus);
      setNotice({
        type: 'success',
        message: `Queue for ${serviceName} is now ${nextStatus === 'OPEN' ? 'OPEN (accepting remote & on-site customers)' : 'CLOSED (new joins paused)'}.`,
      });
      await loadBranchData(selectedBranchId);
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update queue status.',
      });
    } finally {
      setTogglingQueueId(null);
    }
  };

  // Filtered QR history list
  const filteredQrs = qrList.filter((qr) => {
    // Search query match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      qr.token.toLowerCase().includes(q) ||
      qr.service?.name.toLowerCase().includes(q) ||
      qr.createdBy?.toLowerCase().includes(q);

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || qr.status === statusFilter;

    // Service filter
    const matchesService = serviceFilter === 'ALL' || qr.service?.id === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const activeQrs = qrList.filter((qr) => qr.status === 'ACTIVE');

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Standee PNG helper
  const handleDownloadStandee = async (qr: QrRecord) => {
    setDownloading(true);
    try {
      const baseUrl = `${window.location.origin}${process.env.PUBLIC_URL || ''}`;
      const webUrl = `${baseUrl}/join/${qr.token}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(webUrl)}&margin=10`;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrImageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 440;
      canvas.height = 620;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Card Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 440, 620);

      // Header Banner
      const grad = ctx.createLinearGradient(0, 0, 440, 0);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 440, 100);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QueueLess', 220, 44);

      ctx.font = '13px sans-serif';
      ctx.fillText('Official Service Queue Standee', 220, 70);

      // Organization & Branch
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(activeBranch.organizationName || 'QueueLess Partner', 220, 140);

      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText(activeBranch.name || 'Branch Desk', 220, 165);

      // Service Specific Destination Badge
      ctx.fillStyle = '#eff6ff';
      ctx.fillRect(40, 185, 360, 46);
      ctx.strokeStyle = '#bfdbfe';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 185, 360, 46);

      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(qr.service?.name ? `Service: ${qr.service.name}` : 'Dedicated Queue', 220, 214);

      // Draw QR Code
      ctx.drawImage(img, 70, 245, 300, 300);

      // Instructions Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(40, 560, 360, 40);
      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText('Scan to join this exact service queue immediately', 220, 585);

      const link = document.createElement('a');
      link.download = `QueueLess-${(qr.service?.name || 'Service').replace(/\s+/g, '-')}-QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setNotice({ type: 'success', message: 'QR Code Standee downloaded successfully.' });
    } catch (err) {
      console.error('Failed to download standee:', err);
      setNotice({ type: 'error', message: 'Could not render standee image. Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  // Helper for remaining validity
  const getValidityBadge = (expiresAt: string | null, status: string) => {
    if (status === 'REVOKED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          Revoked
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Expired
        </span>
      );
    }
    if (!expiresAt) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          Permanent Active
        </span>
      );
    }

    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Expired
        </span>
      );
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <Clock className="w-3 h-3 mr-1" /> {days}d {hours % 24}h remaining
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        <Clock className="w-3 h-3 mr-1" /> {hours}h remaining
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h3 className="text-base font-bold text-gray-800">Loading QR Code Management...</h3>
        <p className="text-xs text-gray-500 mt-1">Fetching live branch services, active standees, and history</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 font-sans w-full min-w-0 overflow-x-hidden">
      {/* Page Header - Cleaned up: Branch Selector & Refresh only */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20 shrink-0">
              <QrCode className="w-6 h-6" />
            </span>
            <div className="min-w-0 truncate">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight truncate">QR Code Management</h1>
              <p className="text-sm text-gray-500 truncate">
                Service-specific QR standees and complete branch lifecycle
              </p>
            </div>
          </div>
        </div>

        {/* Branch Selector & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {branches.length > 0 && (
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
              <Building2 className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent outline-none cursor-pointer max-w-[200px] truncate"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.organizationName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadBranchData(selectedBranchId)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Product Architecture Clarification Callout */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-bold uppercase tracking-wider text-blue-800">
            Rule: One QR Code = One Specific Service
          </p>
          <p className="leading-relaxed text-blue-700">
            Every QR code generated below is permanently tied to an exact service desk (e.g. SIM Registration or Teller
            Services). When scanned by a customer, QueueLess immediately opens that exact service and bypasses service
            selection. Manual mobile joining remains available for all open queues.
          </p>
        </div>
      </div>

      {/* 1. Summary Cards & Coverage Table - Restricted to Org Admin and Branch Managers */}
      {isOrgAdminOrManager && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total QR Codes</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalQrCodes ?? 0}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Ever generated</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active QR Codes</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{stats.activeQrCodes ?? 0}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Currently usable</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Expired QR Codes</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{stats.expiredQrCodes ?? 0}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Validity passed</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600">Revoked / Closed</p>
                <p className="text-2xl font-black text-red-700 mt-1">{stats.revokedQrCodes ?? 0}</p>
                <p className="text-[11px] text-red-600 mt-0.5">Closed by staff</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Service-Level Breakdown Table */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">Service-Specific QR Coverage</h2>
                <p className="text-xs text-gray-500">
                  Immediate visibility into which branch services currently have active QR codes
                </p>
              </div>
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-xl">
                {stats.serviceBreakdown.filter((s) => s.hasActiveQr).length ?? 0} of{' '}
                {stats.serviceBreakdown.length ?? 0} Services Active
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Service Name</th>
                    <th className="py-3.5 px-6">Est. Duration</th>
                    <th className="py-3.5 px-6 text-center">Queue Status</th>
                    <th className="py-3.5 px-6 text-center">Active QR Codes</th>
                    <th className="py-3.5 px-6 text-center">Total Generated</th>
                    <th className="py-3.5 px-6">Current Coverage</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {stats.serviceBreakdown.map((svc) => (
                    <tr key={svc.serviceId} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          {svc.serviceName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-500 text-xs">~{svc.duration} mins</td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            svc.queueStatus === 'OPEN'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              svc.queueStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                            }`}
                          />
                          {svc.queueStatus === 'OPEN' ? 'Queue Open' : 'Queue Closed'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                            svc.activeQrCount > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {svc.activeQrCount} Active
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-600 font-bold">{svc.totalQrCount}</td>
                      <td className="py-4 px-6">
                        {svc.hasActiveQr ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Live QR Standee Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-bold">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            No Active QR Code
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {svc.queueId && (
                            <button
                              type="button"
                              onClick={() => handleToggleQueueStatus(svc.queueId!, svc.queueStatus || 'CLOSED', svc.serviceName)}
                              disabled={togglingQueueId === svc.queueId}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 ${
                                svc.queueStatus === 'OPEN'
                                  ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title={svc.queueStatus === 'OPEN' ? 'Close queue (pauses customer joins)' : 'Open queue (allows remote & on-site joins)'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {togglingQueueId === svc.queueId
                                ? '...'
                                : svc.queueStatus === 'OPEN'
                                ? 'Close Queue'
                                : 'Open Queue'}
                            </button>
                          )}

                          {svc.activeQr ? (
                            <button
                              type="button"
                              onClick={() => setViewingQr(svc.activeQr)}
                              className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View QR
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              setTargetServiceId(svc.serviceId);
                              setIsGenerateModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            {svc.hasActiveQr ? 'Add Another QR' : 'Generate QR'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {(!stats || stats.serviceBreakdown.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                        No services found for this branch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 2. Active QR Codes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Active QR Codes</h2>
            <p className="text-xs text-gray-500">Currently active and scannable by visiting customers</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
              {activeQrs.length} Active Standees
            </span>
            {isOrgAdminOrManager && (
              <button
                onClick={() => {
                  setTargetServiceId(services[0]?.id || '');
                  setIsGenerateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Generate Service QR
              </button>
            )}
          </div>
        </div>

        {activeQrs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Active QR Codes</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
              {isOrgAdminOrManager
                ? 'Generate a service-specific QR code so customers can scan and land directly in that service queue.'
                : 'No active QR standees deployed for this branch yet. Contact your Branch Manager or Organization Admin to generate QR codes.'}
            </p>
            {isOrgAdminOrManager && (
              <button
                onClick={() => {
                  setTargetServiceId(services[0]?.id || '');
                  setIsGenerateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Generate Service QR Code
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeQrs.map((qr) => {
              const webLink = `${window.location.origin}${process.env.PUBLIC_URL || ''}/join/${qr.token}`;
              const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                webLink
              )}&margin=8`;

              return (
                <div
                  key={qr.id}
                  className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Service Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600">
                          {qr.branch?.name || activeBranch.name}
                        </span>
                        <h3 className="text-base font-black text-gray-900 leading-snug">
                          {qr.service?.name || 'Dedicated Service'}
                        </h3>
                      </div>
                      {getValidityBadge(qr.expiresAt, qr.status)}
                    </div>

                    {/* QR Code Preview */}
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center relative group">
                      <img
                        src={qrImageUrl}
                        alt={`QR for ${qr.service?.name}`}
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                      <button
                        onClick={() => setViewingQr(qr)}
                        className="absolute inset-0 bg-black/40 text-white font-bold text-xs opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center gap-1.5 transition-opacity backdrop-blur-xs"
                      >
                        <Eye className="w-4 h-4" /> Expand Preview
                      </button>
                    </div>

                    {/* Metadata Details */}
                    <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Token:</span>
                        <span className="font-mono font-bold text-gray-800 text-[11px]">{qr.token}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Created:</span>
                        <span className="font-medium text-gray-700">
                          {new Date(qr.createdAt).toLocaleDateString()} at{' '}
                          {new Date(qr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Expires:</span>
                        <span className="font-medium text-gray-700">
                          {qr.expiresAt
                            ? new Date(qr.expiresAt).toLocaleDateString() +
                              ' ' +
                              new Date(qr.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Permanent'}
                        </span>
                      </div>
                      {qr.createdBy && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Created By:</span>
                          <span className="font-medium text-gray-700 truncate max-w-[170px]">{qr.createdBy}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadStandee(qr)}
                        disabled={downloading}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Download Standee PNG"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setViewingQr(qr);
                          setTimeout(() => window.print(), 300);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Print Standee"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(webLink)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Copy Join URL"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {isOrgAdminOrManager && (
                      <button
                        onClick={() => setRevokingQr(qr)}
                        className="px-3 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors inline-flex items-center gap-1"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Revoke QR
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Complete QR History Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">QR Code Lifecycle History</h2>
            <p className="text-xs text-gray-500">
              Complete audit trail of all previous and current QR codes. Historical records are preserved permanently.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search token, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none w-48"
              />
            </div>

            {/* Service filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="border border-gray-200 rounded-xl text-xs py-1.5 px-3 bg-gray-50 text-gray-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-200 rounded-xl text-xs py-1.5 px-3 bg-gray-50 text-gray-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked / Closed</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/60 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">QR Token</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4">Closed / Revoked</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredQrs.map((qr) => (
                <tr key={qr.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{qr.token}</td>
                  <td className="py-3 px-4 font-bold text-blue-900">{qr.service?.name || 'Service'}</td>
                  <td className="py-3 px-4 text-gray-600">{qr.branch?.name || activeBranch.name}</td>
                  <td className="py-3 px-4 text-gray-600">
                    <div>{new Date(qr.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-gray-400">
                      {new Date(qr.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {qr.expiresAt ? (
                      <>
                        <div>{new Date(qr.expiresAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(qr.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    ) : (
                      'Permanent'
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {qr.revokedAt ? (
                      <>
                        <div className="text-red-700 font-bold">{new Date(qr.revokedAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                          By: {qr.revokedBy || 'Staff'}
                        </div>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4">{getValidityBadge(qr.expiresAt, qr.status)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingQr(qr)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Standee"
                      >
                        View
                      </button>

                      {/* Replacement Generator Button for Expired/Revoked - Restricted to Managers/Org Admins */}
                      {isOrgAdminOrManager && qr.status !== 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => {
                              if (qr.service?.id) setTargetServiceId(qr.service.id);
                              setIsGenerateModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Generate a new active QR code for this exact service"
                          >
                            <RotateCw className="w-3 h-3" />
                            Replace
                          </button>
                          <button
                            onClick={() => handleDeleteQr(qr.id, qr.token)}
                            disabled={deletingId === qr.id}
                            className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                            title="Delete Expired/Revoked QR code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredQrs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                    No QR code records matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. GENERATE SERVICE QR MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Generate Service QR Code</h3>
                  <p className="text-xs text-gray-500">Binds a new secure QR standee to an exact service</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateQr} className="space-y-4 overflow-y-auto pr-1">
              {/* Contextual Organization & Branch Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Organization
                  </label>
                  <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                    {activeBranch.organizationName || 'QueueLess Enterprise'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Branch</label>
                  {branches.length > 1 ? (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        setSelectedBranchId(e.target.value);
                        setTargetServiceId('');
                      }}
                      className="w-full mt-0.5 bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer truncate"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs font-bold text-gray-800 mt-0.5 truncate">{activeBranch.name}</p>
                  )}
                </div>
              </div>

              {/* Service Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Specific Service <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={targetServiceId}
                  onChange={(e) => setTargetServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" disabled>
                    -- Choose Service for this QR code --
                  </option>
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} (~{svc.duration || 15} mins)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  The generated QR code will permanently identify this service.
                </p>
              </div>

              {/* Prominent QR Destination Display (Item 20) */}
              {targetServiceId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    QR Destination Confirmation
                  </div>
                  <div className="text-xs space-y-0.5 text-blue-950 font-medium">
                    <p>
                      <span className="text-blue-600 font-bold">Organization:</span>{' '}
                      {activeBranch.organizationName || 'QueueLess'}
                    </p>
                    <p>
                      <span className="text-blue-600 font-bold">Branch:</span> {activeBranch.name}
                    </p>
                    <p>
                      <span className="text-blue-600 font-bold">Service:</span>{' '}
                      <span className="font-black underline decoration-blue-400">
                        {services.find((s) => s.id === targetServiceId)?.name || 'Service'}
                      </span>
                    </p>
                  </div>
                  <p className="text-[10px] text-blue-600 pt-1 font-semibold">
                    ✓ Customers scanning this QR code will land directly on this service desk.
                  </p>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    ✓ Generating this active QR code will automatically OPEN the queue for both on-site scans and remote joins.
                  </p>
                </div>
              )}

              {/* Expiration Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  QR Expiration Validity Period
                </label>
                <select
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="1_HOUR">1 Hour</option>
                  <option value="6_HOURS">6 Hours</option>
                  <option value="12_HOURS">12 Hours</option>
                  <option value="24_HOURS">24 Hours (1 Day - Recommended)</option>
                  <option value="3_DAYS">3 Days</option>
                  <option value="7_DAYS">7 Days (1 Week)</option>
                  <option value="CUSTOM">Custom Date / Time...</option>
                </select>
              </div>

              {validity === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Custom Expiration Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !targetServiceId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {generating ? (
                    'Generating...'
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Generate Service QR
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. VIEW / STANDEE PREVIEW MODAL */}
      {viewingQr && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-gray-900">QR Standee Preview</h3>
              </div>
              <button
                onClick={() => setViewingQr(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Standee Card */}
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-inner text-center space-y-3">
              <div className="bg-blue-600 text-white py-2 px-4 rounded-xl text-center shadow-md">
                <h4 className="font-black text-lg">QueueLess</h4>
                <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Live Counter Standee</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  {viewingQr.branch?.name || activeBranch.name}
                </p>
                <h3 className="text-xl font-black text-gray-900">
                  {viewingQr.service?.name || 'Dedicated Service Desk'}
                </h3>
              </div>

              <div className="flex justify-center p-2 bg-gray-50 rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                    `${window.location.origin}${process.env.PUBLIC_URL || ''}/join/${viewingQr.token}`
                  )}&margin=10`}
                  alt="QR Code"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>

              <p className="text-xs font-semibold text-gray-600">
                Scan with your smartphone camera to join this queue directly.
              </p>

              <div className="text-[11px] font-mono text-gray-400">{viewingQr.token}</div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleDownloadStandee(viewingQr)}
                disabled={downloading}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => handleCopy(`${window.location.origin}${process.env.PUBLIC_URL || ''}/join/${viewingQr.token}`)}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. REVOKE CONFIRMATION DIALOG */}
      {revokingQr && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Revoke QR Code?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Revoking this QR code will immediately invalidate this standee.
              </p>
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl text-left space-y-2">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={closeQueueOnRevoke}
                    onChange={(e) => setCloseQueueOnRevoke(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Also close service queue
                    </span>
                    <span className="text-[11px] text-gray-500 leading-tight block">
                      {closeQueueOnRevoke
                        ? `Pauses new customer joins for ${revokingQr.service?.name || 'this service'}.`
                        : `Keeps the queue open for remote customer joins on web/mobile.`}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokingQr(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleRevokeQr}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {revoking ? 'Revoking...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QrManagement;
