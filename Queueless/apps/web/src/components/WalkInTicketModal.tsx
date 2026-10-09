import React, { useState } from 'react';
import api from '../api/client';
import { User, Phone, Tag, CheckCircle2, Printer, X, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  duration?: number;
  price?: number | string;
  queues?: Array<{ id: string; status: string }>;
}

interface WalkInTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  services: ServiceItem[];
  onTicketCreated?: () => void;
}

export const WalkInTicketModal: React.FC<WalkInTicketModalProps> = ({
  isOpen,
  onClose,
  branchId,
  branchName,
  services,
  onTicketCreated,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{
    ticketNumber: string;
    position: number;
    serviceName: string;
    branchName: string;
    customerName: string;
  } | null>(null);

  // Keep selectedServiceId in sync if services list changes
  React.useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetServiceId = selectedServiceId || services[0]?.id;
    if (!targetServiceId) {
      setError('Please select a service for the walk-in ticket.');
      return;
    }

    const service = services.find((s) => s.id === targetServiceId);
    const queueId = service?.queues?.[0]?.id;

    setLoading(true);
    try {
      const response = await api.post('/queues/walk-in', {
        queueId: queueId || undefined,
        serviceId: targetServiceId,
        branchId,
        fullName: fullName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });

      setCreatedTicket({
        ticketNumber: response.data.ticketNumber,
        position: response.data.position,
        serviceName: response.data.serviceName,
        branchName: response.data.branchName,
        customerName: response.data.customer?.fullName || 'Walk-in Customer',
      });

      if (onTicketCreated) {
        onTicketCreated();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create walk-in ticket');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setCreatedTicket(null);
    setFullName('');
    setPhoneNumber('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Issue Walk-in Ticket</h3>
              <p className="text-xs text-blue-100">{branchName}</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
              </div>
            </div>
          )}

          {createdTicket ? (
            /* Ticket Generated View */
            <div className="text-center py-3">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full mb-4 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl font-bold text-slate-800">Walk-in Ticket Issued</h4>
              <p className="text-sm text-slate-500 mb-6">Customer has entered the shared branch queue</p>

              {/* Printable Ticket Card */}
              <div
                id="walk-in-ticket-print"
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 mb-6 max-w-xs mx-auto text-left shadow-sm"
              >
                <div className="text-center pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">QueueLess Ticket</span>
                  <div className="text-4xl font-black text-blue-600 tracking-tight my-1">
                    {createdTicket.ticketNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-700">{createdTicket.serviceName}</div>
                </div>

                <div className="pt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <span className="font-semibold text-slate-800">{createdTicket.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Position in Line:</span>
                    <span className="font-black text-blue-600">#{createdTicket.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[140px] text-right">
                      {createdTicket.branchName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Issued At:</span>
                    <span className="text-slate-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Queue Status:</span>
                    <span className="font-bold text-amber-600 uppercase">WAITING</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm flex items-center transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Slip
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Service *
                </label>
                <div className="relative">
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} {service.duration ? `(~${service.duration} mins)` : ''}
                      </option>
                    ))}
                  </select>
                  <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Customer Name (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kwame Mensah (or leave blank for Walk-in)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Customer Phone (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +233 50 123 4567 (optional)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Enters the unified queue engine. Customer will be called by ticket number.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || services.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Issuing Ticket...
                    </>
                  ) : (
                    'Generate Ticket'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkInTicketModal;
