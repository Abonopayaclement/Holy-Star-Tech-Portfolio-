import React, { useState } from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

export interface CancellationReasonOption {
  id: string;
  label: string;
  description: string;
}

export const CANCELLATION_REASONS: CancellationReasonOption[] = [
  {
    id: 'BRANCH_CLOSING_SOON',
    label: 'Branch closing soon',
    description: 'Branch is approaching end of operating hours and cannot clear the remaining queue.',
  },
  {
    id: 'SERVICE_CLOSING_SOON',
    label: 'Service closing soon',
    description: 'Counter or service window is shutting down for the shift.',
  },
  {
    id: 'STAFF_UNAVAILABLE',
    label: 'Staff unavailable',
    description: 'Designated service agent or teller is stepped away or unavailable.',
  },
  {
    id: 'TECHNICAL_ISSUE',
    label: 'Technical issue',
    description: 'Hardware, network, terminal, or power outage preventing service.',
  },
  {
    id: 'MAX_CAPACITY_REACHED',
    label: 'Branch at maximum capacity',
    description: 'Service area has exceeded safety or queue processing limits.',
  },
  {
    id: 'CUSTOMER_NO_SHOW',
    label: 'Customer no-show / unresponsive',
    description: 'Customer did not present themselves after multiple attempts.',
  },
  {
    id: 'DUPLICATE_TICKET',
    label: 'Duplicate ticket issued',
    description: 'Customer or kiosk generated multiple tickets for the same service.',
  },
  {
    id: 'INCORRECT_SERVICE_SELECTED',
    label: 'Incorrect service selected',
    description: 'Ticket does not match the actual transaction needed by customer.',
  },
  {
    id: 'EMERGENCY_CLOSURE',
    label: 'Emergency facility closure',
    description: 'Immediate shutdown required due to unforeseen safety or building emergency.',
  },
  {
    id: 'OTHER',
    label: 'Other reason (specify below)',
    description: 'Custom operational or branch-specific circumstance.',
  },
];

interface CancellationReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber?: string;
  customerName?: string;
  onConfirm: (reason: string, reasonNote?: string) => void;
  isLoading?: boolean;
}

const CancellationReasonModal: React.FC<CancellationReasonModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  customerName,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a cancellation reason.');
      return;
    }

    if (selectedReason === 'OTHER' && !customNote.trim()) {
      setError('Please provide a specific explanation when selecting "Other reason".');
      return;
    }

    setError(null);
    onConfirm(selectedReason, customNote.trim() || undefined);
  };

  const handleClose = () => {
    if (isLoading) return;
    setSelectedReason('');
    setCustomNote('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-red-50/70 border-b border-red-100 flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Cancel Queue Ticket</h2>
              <p className="text-xs text-red-700 font-semibold mt-0.5">
                Ticket <span className="font-mono font-black">{ticketNumber || 'Customer'}</span>
                {customerName ? ` • ${customerName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Select Official Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              This reason will be recorded in the audit log and displayed to the customer in their portal and activity history.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {CANCELLATION_REASONS.map((option) => {
                const isSelected = selectedReason === option.id;
                return (
                  <label
                    key={option.id}
                    onClick={() => {
                      setSelectedReason(option.id);
                      setError(null);
                    }}
                    className={`block p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50/50 shadow-sm ring-1 ring-red-400'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="pr-2">
                        <span className="text-xs font-bold text-gray-900 block">{option.label}</span>
                        <span className="text-[11px] text-gray-500 block mt-0.5">{option.description}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-red-600 bg-red-600 text-white' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Optional Note or Required if Other */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Additional Details / Note {selectedReason === 'OTHER' ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => {
                setCustomNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder={
                selectedReason === 'OTHER'
                  ? 'Mandatory: explain the specific operational reason for cancellation...'
                  : 'Add any extra context for the customer or staff record...'
              }
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all"
            >
              Keep Ticket
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedReason || (selectedReason === 'OTHER' && !customNote.trim())}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancellationReasonModal;
