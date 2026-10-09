import React from 'react';
import { CheckCircle, Clock, X, ArrowRightLeft, MessageSquare } from 'lucide-react';

interface QueueEntryCardProps {
  entry: any;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onTransfer?: (entry: any) => void;
  onMessage?: (entry: any) => void;
  isNext?: boolean;
}

const QueueEntryCard: React.FC<QueueEntryCardProps> = ({
  entry,
  onComplete,
  onCancel,
  onTransfer,
  onMessage,
  isNext,
}) => {
  const statusColors = {
    WAITING: 'bg-amber-50 text-amber-700 border-amber-200',
    CALLING: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
    SERVING: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
    COMPLETED: 'bg-gray-50 text-gray-700 border-gray-200',
    SKIPPED: 'bg-orange-50 text-orange-700 border-orange-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    ABSENT: 'bg-red-50 text-red-700 border-red-200',
  };

  const isKioskOrWalkIn = entry.source === 'KIOSK' || entry.source === 'WALK_IN';
  const hasValidPhone = Boolean(entry.user?.phoneNumber && !entry.user?.email?.startsWith('kiosk_'));
  const isAppOrQr = entry.source === 'REMOTE' || entry.source === 'QR';
  const canMessage = isAppOrQr || (isKioskOrWalkIn && hasValidPhone);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5 shadow-sm transition-all overflow-hidden ${
        isNext ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500' : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
        <div className="h-11 w-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-sm shrink-0">
          {entry.ticketNumber || `#${entry.position}`}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <h4
              className="font-bold text-gray-900 text-sm truncate max-w-[130px] sm:max-w-[200px] md:max-w-[240px]"
              title={entry.user?.fullName || 'Customer'}
            >
              {entry.user?.fullName || 'Customer'}
            </h4>
            {entry.originalServiceId && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                Transferred
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-0.5 truncate">
            <Clock className="h-3 w-3 mr-1 text-gray-400 shrink-0" />
            Joined {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${
            statusColors[entry.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {entry.status}
        </span>

        {/* Transfer Action */}
        {onTransfer && (entry.status === 'WAITING' || entry.status === 'CALLING' || entry.status === 'SERVING') && (
          <button
            onClick={() => onTransfer(entry)}
            className="p-1.5 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 shrink-0"
            title="Transfer to Another Service"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        )}

        {/* Message Action (App/QR users or Walk-in with Phone Number) */}
        {onMessage && canMessage && (
          <button
            onClick={() => onMessage(entry)}
            className="p-1.5 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 shrink-0"
            title="Message Customer"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}

        {onComplete && (entry.status === 'CALLING' || entry.status === 'SERVING') && (
          <button
            onClick={() => onComplete(entry.id)}
            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
            title="Complete Entry"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        )}

        {onCancel && entry.status === 'WAITING' && (
          <button
            onClick={() => onCancel(entry.id)}
            className="p-1.5 bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            title="Cancel Ticket"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QueueEntryCard;
