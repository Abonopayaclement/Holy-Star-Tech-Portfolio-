import React, { useState } from 'react';
import { Award, X, AlertCircle } from 'lucide-react';

interface PriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  customerName?: string;
  currentPriority?: string;
  isLoading?: boolean;
  onConfirm: (priority: string, reason?: string) => void;
}

const PriorityModal: React.FC<PriorityModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  customerName,
  currentPriority = 'NORMAL',
  isLoading = false,
  onConfirm,
}) => {
  const [selectedPriority, setSelectedPriority] = useState<string>(currentPriority);
  const [reason, setReason] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setSelectedPriority(currentPriority || 'NORMAL');
      setReason('');
    }
  }, [isOpen, currentPriority]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedPriority, reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg">Ticket Priority</h3>
              <p className="text-xs text-gray-400">Configure controlled priority level</p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ticket</span>
              <p className="font-black text-gray-900 text-base">{ticketNumber}</p>
              <p className="text-xs text-gray-600">{customerName || 'Customer'}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Current Priority</span>
              <p className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg mt-0.5">
                {currentPriority}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { level: 'NORMAL', label: 'Normal', desc: 'Standard queue order', color: 'border-gray-200 hover:border-gray-400' },
                { level: 'PRIORITY', label: 'Priority', desc: 'Expedited service', color: 'border-amber-300 bg-amber-50/40 text-amber-900' },
                { level: 'APPOINTMENT', label: 'Appointment', desc: 'Scheduled booking', color: 'border-blue-300 bg-blue-50/40 text-blue-900' },
              ].map((item) => (
                <button
                  key={item.level}
                  type="button"
                  onClick={() => setSelectedPriority(item.level)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedPriority === item.level
                      ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50/50'
                      : item.color
                  }`}
                >
                  <p className="text-xs font-black">{item.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Reason for Priority Change
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Senior citizen, Medical accommodation, Staff discretion"
              maxLength={120}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
              disabled={isLoading}
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-amber-900 text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>All priority adjustments are audited with your staff credentials. Fairness rules prevent indefinite starvation of normal customers.</span>
          </div>

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
              disabled={isLoading}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving...' : 'Apply Priority'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriorityModal;
