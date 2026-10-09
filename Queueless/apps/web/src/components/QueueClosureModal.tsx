import React, { useState } from 'react';
import { AlertTriangle, X, Check, Clock, Users, Wrench, PauseCircle, ShieldAlert } from 'lucide-react';

export const PREDEFINED_CLOSURE_REASONS = [
  {
    id: 'CLOSING_SOON',
    title: 'Branch closing soon',
    desc: 'No new tickets accepted before end of business hours.',
    icon: Clock,
  },
  {
    id: 'STAFF_UNAVAILABLE',
    title: 'Staff unavailable / shift change',
    desc: 'Counter personnel in transition or temporarily away.',
    icon: Users,
  },
  {
    id: 'TECHNICAL_PROBLEM',
    title: 'Technical / Network problem',
    desc: 'Temporary IT, workstation, or system connectivity downtime.',
    icon: Wrench,
  },
  {
    id: 'COUNTER_PAUSED',
    title: 'Counter temporarily paused',
    desc: 'Brief operational intermission. Will resume shortly.',
    icon: PauseCircle,
  },
  {
    id: 'EMERGENCY_CLOSURE',
    title: 'Emergency closure',
    desc: 'Unplanned branch incident or urgent counter shutdown.',
    icon: ShieldAlert,
  },
];

interface QueueClosureModalProps {
  isOpen: boolean;
  queueName?: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const QueueClosureModal: React.FC<QueueClosureModalProps> = ({
  isOpen,
  queueName,
  onClose,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(PREDEFINED_CLOSURE_REASONS[0].title);
  const [customNote, setCustomNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const fullReason = customNote.trim()
        ? `${selectedReason} — ${customNote.trim()}`
        : selectedReason;
      await onConfirm(fullReason);
      onClose();
    } catch (err) {
      console.error('Failed to close queue:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 bg-red-50/70 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Close Queue Entry</h3>
              <p className="text-xs text-red-700 font-semibold">
                {queueName ? `Service: ${queueName}` : 'Stop accepting new customer tickets'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
              Select Closure Reason (Customers will see this live)
            </label>
            <div className="space-y-2">
              {PREDEFINED_CLOSURE_REASONS.map((item) => {
                const isSelected = selectedReason === item.title;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReason(item.title)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold ${isSelected ? 'text-red-900' : 'text-gray-800'}`}>
                          {item.title}
                        </p>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1.5">
              Additional Public Note (Optional)
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Expected to reopen at 14:00 GMT, or please see desk #3"
              rows={2}
              className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition-all flex items-center space-x-2"
          >
            {submitting ? (
              <span>Closing Queue...</span>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Confirm Queue Closure</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueueClosureModal;
