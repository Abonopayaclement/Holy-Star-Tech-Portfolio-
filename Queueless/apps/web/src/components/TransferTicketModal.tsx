import React, { useState } from 'react';
import { ArrowRightLeft, X, AlertCircle } from 'lucide-react';

interface TransferTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  customerName?: string;
  currentServiceName?: string;
  availableServices: Array<{ id: string; name: string }>;
  isLoading?: boolean;
  onConfirm: (destinationServiceId: string, reason: string, reasonNote?: string) => void;
}

const PREDEFINED_REASONS = [
  'Wrong service selected',
  'Customer requires another department',
  'Specialist service required',
  'Service unavailable here',
  'Staff referral',
  'Other',
];

const TransferTicketModal: React.FC<TransferTicketModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  customerName,
  currentServiceName,
  availableServices,
  isLoading = false,
  onConfirm,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(PREDEFINED_REASONS[0]);
  const [customReasonNote, setCustomReasonNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (availableServices && availableServices.length > 0) {
        setSelectedServiceId(availableServices[0].id);
      }
      setSelectedReason(PREDEFINED_REASONS[0]);
      setCustomReasonNote('');
      setValidationError(null);
    }
  }, [isOpen, availableServices]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setValidationError('Please select a destination service.');
      return;
    }
    if (selectedReason === 'Other' && !customReasonNote.trim()) {
      setValidationError('Please provide a specific transfer explanation for "Other".');
      return;
    }
    setValidationError(null);
    onConfirm(selectedServiceId, selectedReason, customReasonNote.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">Transfer Ticket</h3>
              <p className="text-xs text-gray-400">Reassign customer to another branch service</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 p-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl flex items-center gap-2 text-xs text-blue-800">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Transfers reassign the customer to another service desk within this branch.</span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target Ticket Details */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ticket</span>
              <p className="font-black text-gray-900 text-base">{ticketNumber}</p>
              <p className="text-xs text-gray-600">{customerName || 'Customer'}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Current Service</span>
              <p className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg mt-0.5">
                {currentServiceName || 'General'}
              </p>
            </div>
          </div>

          {/* Destination Service */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Destination Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              disabled={isLoading || availableServices.length === 0}
            >
              {availableServices.length === 0 ? (
                <option value="">No other services available</option>
              ) : (
                availableServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Transfer Reason */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Transfer Reason
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              disabled={isLoading}
            >
              {PREDEFINED_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Controlled Text Input for Other */}
          {selectedReason === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Specific Explanation
              </label>
              <textarea
                value={customReasonNote}
                onChange={(e) => setCustomReasonNote(e.target.value)}
                placeholder="Explain why this ticket is being transferred..."
                rows={2}
                maxLength={200}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                disabled={isLoading}
              />
            </div>
          )}

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || availableServices.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Transferring...' : 'Confirm Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferTicketModal;
