import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import {
  QrCode,
  Copy,
  Check,
  Printer,
  Download,
  X,
  Clock,
  ShieldAlert,
  Sparkles,
  Loader2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  ListFilter,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  duration?: number;
}

interface QrRecord {
  id: string;
  token: string;
  type: 'BRANCH' | 'SERVICE';
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiresAt: string | null;
  createdAt: string;
  service?: { id: string; name: string };
}

interface QrCodeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: {
    id: string;
    name: string;
    qrCodeId: string;
    organizationName?: string;
  };
  services: ServiceItem[];
}

export const QrCodeManagerModal: React.FC<QrCodeManagerModalProps> = ({
  isOpen,
  onClose,
  branch,
  services,
}) => {
  const [activeTab, setActiveTab] = useState<'VIEW' | 'GENERATE' | 'LIST'>('VIEW');
  const selectedType = 'SERVICE';
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [validity, setValidity] = useState<string>('24_HOURS');
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // QR List & Generation states
  const [qrList, setQrList] = useState<QrRecord[]>([]);
  const [fetchingList, setFetchingList] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Active QR token to preview on the standee
  const [previewToken, setPreviewToken] = useState<string>(branch.qrCodeId);
  const [previewTitle, setPreviewTitle] = useState<string>(branch.name);
  const [previewSubtitle, setPreviewSubtitle] = useState<string>('Scan to access branch queues');

  const printableRef = useRef<HTMLDivElement>(null);

  const fetchBranchQrList = React.useCallback(async () => {
    setFetchingList(true);
    try {
      const res = await api.get(`/organizations/branch/${branch.id}/qr-list`);
      setQrList(res.data);
    } catch (err) {
      console.warn('Unable to fetch branch QR list', err);
    } finally {
      setFetchingList(false);
    }
  }, [branch.id]);

  useEffect(() => {
    if (isOpen) {
      fetchBranchQrList();
      setPreviewToken(branch.qrCodeId);
      setPreviewTitle(branch.name);
      setPreviewSubtitle('Scan to access all branch queues');
      setFeedback(null);
    }
  }, [isOpen, branch.qrCodeId, branch.name, fetchBranchQrList]);

  if (!isOpen) return null;

  const baseUrl = `${window.location.origin}${process.env.PUBLIC_URL || ''}`;
  const webLink = `${baseUrl}/join/${previewToken}`;
  const deepLink = `queueless://join/${previewToken}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(webLink)}&margin=10`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Reliable Canvas-based PNG generator for download
  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrImageUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 540;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Card Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 400, 540);

      // Header Gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 0);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 90);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QueueLess', 200, 40);

      ctx.fillStyle = '#E0E7FF';
      ctx.font = '13px sans-serif';
      ctx.fillText(previewTitle.slice(0, 32), 200, 68);

      // Draw QR Image
      ctx.drawImage(img, 45, 110, 310, 310);

      // Footer Information
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Scan with Phone Camera', 200, 455);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.fillText(webLink.slice(0, 42), 200, 485);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px sans-serif';
      ctx.fillText('Join queue remotely • Live position tracking', 200, 510);

      // Export Blob & Trigger Safe Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QueueLess-${previewTitle.replace(/\s+/g, '-')}-QR.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setFeedback({ type: 'success', message: 'QR Code standee downloaded successfully.' });
      }, 'image/png');
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Unable to download QR code image. Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateQr = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setFeedback(null);

    try {
      const response = await api.post(`/organizations/branch/${branch.id}/qr`, {
        type: selectedType,
        serviceId: selectedType === 'SERVICE' ? selectedServiceId : undefined,
        validity,
        customExpiresAt: validity === 'CUSTOM' ? customExpiresAt : undefined,
      });

      const newQr: QrRecord = response.data.qr;
      setFeedback({ type: 'success', message: 'QR Code Generated successfully!' });

      // Update Preview to newly generated QR
      setPreviewToken(newQr.token);
      const svc = services.find((s) => s.id === newQr.service?.id || s.id === selectedServiceId);
      setPreviewTitle(newQr.type === 'SERVICE' ? svc?.name || 'Service Queue' : branch.name);
      setPreviewSubtitle(newQr.type === 'SERVICE' ? `Scan to join ${svc?.name} queue` : 'Scan to access all branch queues');

      await fetchBranchQrList();
      setActiveTab('VIEW');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Unable to generate QR code. Please try again.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeQr = async (qrId: string) => {
    if (!window.confirm('Are you sure you want to revoke this QR code? Once revoked, customers scanning it will be rejected.')) {
      return;
    }

    setRevokingId(qrId);
    setFeedback(null);
    try {
      await api.post(`/organizations/qr/${qrId}/revoke`);
      setFeedback({ type: 'success', message: 'QR Code successfully revoked.' });
      await fetchBranchQrList();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to revoke QR code.',
      });
    } finally {
      setRevokingId(null);
    }
  };

  const handleDeleteQr = async (qrId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this QR code? This record will be removed.')) {
      return;
    }

    setDeletingId(qrId);
    setFeedback(null);
    try {
      await api.delete(`/organizations/qr/${qrId}`);
      setFeedback({ type: 'success', message: 'QR Code successfully deleted.' });
      await fetchBranchQrList();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete QR code.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <QrCode className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">QueueLess QR Management</h3>
              <p className="text-xs text-blue-100">{branch.name} — Branch & Service Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => { setActiveTab('VIEW'); setFeedback(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'VIEW'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Active Standee
          </button>

          <button
            onClick={() => { setActiveTab('GENERATE'); setFeedback(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'GENERATE'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Generate New QR
          </button>

          <button
            onClick={() => { setActiveTab('LIST'); setFeedback(null); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'LIST'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            QR History & Revocation ({qrList.length})
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Standee Preview & Actions */}
          {activeTab === 'VIEW' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Standee Preview Card */}
              <div
                ref={printableRef}
                id="queueless-standee-print"
                className="bg-white border-2 border-slate-200 rounded-3xl p-6 text-center shadow-lg mx-auto w-full max-w-sm"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>QueueLess Standee</span>
                </div>
                <h4 className="text-xl font-black text-slate-900 leading-tight">{previewTitle}</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4">{previewSubtitle}</p>

                {/* QR Code Frame */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-inner mb-4">
                  <img
                    src={qrImageUrl}
                    alt="QueueLess QR Code"
                    className="w-52 h-52 mx-auto object-contain"
                    crossOrigin="anonymous"
                  />
                </div>

                <div className="text-[11px] text-slate-500 font-mono tracking-tight break-all bg-slate-100 p-2 rounded-xl border border-slate-200">
                  {webLink}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Scan with mobile camera to join queue or book appointments
                </p>
              </div>

              {/* Action Controls & Deep Links */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Standee Quick Actions
                  </h5>
                  <p className="text-xs text-slate-500">
                    Print high-resolution physical standees for branch desks or download digital PNGs for display screens.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="py-2.5 px-4 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4 text-blue-600" />
                      Print Standee
                    </button>
                    <button
                      type="button"
                      disabled={downloading}
                      onClick={handleDownloadPng}
                      className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download PNG
                    </button>
                  </div>
                </div>

                {/* Link Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-700">Customer Web URL:</span>
                      <p className="text-slate-500 font-mono truncate max-w-[200px] sm:max-w-xs">{webLink}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(webLink)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <div>
                      <span className="font-bold text-slate-700">Mobile Deep Link:</span>
                      <p className="text-slate-500 font-mono truncate max-w-[200px] sm:max-w-xs">{deepLink}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(deepLink)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                </div>

                <a
                  href={webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Preview Live Customer Landing Page
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: Generate New Service QR Code with Expiration Validity */}
          {activeTab === 'GENERATE' && (
            <form onSubmit={handleGenerateQr} className="max-w-xl mx-auto space-y-5">
              <div className="text-center pb-2">
                <h4 className="text-lg font-extrabold text-slate-900">Generate Service-Specific QR Code</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Flow: {branch.name} → Select Service → Validity → Generate Official QR
                </p>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Step 1: Select Service for this QR Code *
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} (~{svc.duration || 15} mins per customer)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Customers scanning this code will be routed directly to this specific service queue.
                </p>
              </div>

              {/* Expiration Validity Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  QR Code Validity & Expiration Period
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: '1_HOUR', label: '1 Hour' },
                    { id: '6_HOURS', label: '6 Hours' },
                    { id: '24_HOURS', label: '24 Hours (Standard)' },
                    { id: '3_DAYS', label: '3 Days' },
                    { id: '7_DAYS', label: '7 Days' },
                    { id: 'CUSTOM', label: 'Custom Date' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setValidity(opt.id)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        validity === opt.id
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {validity === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Custom Expiration Timestamp
                  </label>
                  <input
                    type="datetime-local"
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('VIEW')}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating QR...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate QR Code
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: QR History & Revocation */}
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Branch QR Code Registry</h4>
                  <p className="text-xs text-slate-500">View expiration states and deactivate compromised tokens</p>
                </div>
                <button
                  type="button"
                  onClick={fetchBranchQrList}
                  disabled={fetchingList}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  {fetchingList ? 'Refreshing...' : 'Refresh List'}
                </button>
              </div>

              {fetchingList ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading branch QR codes...</p>
                </div>
              ) : qrList.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-2xl">
                  <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No dynamic QR codes generated yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use "Generate New QR" to create custom validity codes.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {qrList.map((qr) => {
                    const isRevoked = qr.status === 'REVOKED';
                    const isActive = qr.status === 'ACTIVE';

                    return (
                      <div
                        key={qr.id}
                        className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{qr.token}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isRevoked
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {qr.status}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                              {qr.type} {qr.service?.name ? `(${qr.service.name})` : ''}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {qr.expiresAt ? (
                              <span>
                                {isActive ? 'Expires: ' : 'Expired: '}
                                {new Date(qr.expiresAt).toLocaleString()}
                              </span>
                            ) : (
                              <span>Permanent Token</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewToken(qr.token);
                              setPreviewTitle(qr.service?.name || branch.name);
                              setPreviewSubtitle(qr.service?.name ? `Scan for ${qr.service.name}` : 'Scan for all branch queues');
                              setActiveTab('VIEW');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                          >
                            View Standee
                          </button>

                          {isActive ? (
                            <button
                              type="button"
                              disabled={revokingId === qr.id}
                              onClick={() => handleRevokeQr(qr.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {revokingId === qr.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5" />
                              )}
                              Revoke
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={deletingId === qr.id}
                              onClick={() => handleDeleteQr(qr.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              {deletingId === qr.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              Delete
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Official QueueLess QR Architecture • Enterprise Multi-Tenant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeManagerModal;
