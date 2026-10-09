import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Bell,
  CheckCheck,
  X,
  Clock,
  Ticket,
  Calendar,
  AlertCircle,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { CONFIG } from '../utils/config';
import { useAuth } from '../hooks/useAuth';
import notificationApi, { WebNotification } from '../api/notification';

export const NotificationBellPopover: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<WebNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<'ALL' | 'QUEUE' | 'APPOINTMENT' | 'MESSAGES'>('ALL');

  const popoverRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const branchId = user?.staffBranchId || (user as any)?.managedBranches?.[0]?.id;
  const isStaff = user?.role !== 'CUSTOMER';

  const fetchNotifications = useCallback(async () => {
    try {
      const scope = isStaff && branchId ? 'branch' : 'user';
      const data = await notificationApi.getNotifications({
        scope,
        branchId: branchId || undefined,
        limit: 30,
      });
      setNotifications(data.notifications || []);
      const count = await notificationApi.getUnreadCount({
        scope,
        branchId: branchId || undefined,
      });
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to fetch notifications in web layout:', err);
    }
  }, [branchId, isStaff]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket connection for real-time staff alerts
  useEffect(() => {
    if (!user?.id) return;

    try {
      const socket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (branchId) {
          socket.emit('join_branch_room', branchId);
        }
        socket.emit('join_user_room', user.id);
      });

      socket.on('new_notification', (data: WebNotification) => {
        setNotifications((prev) => [data, ...prev.filter((n) => n.id !== data.id)]);
        setUnreadCount((prev) => prev + 1);
      });

      const interval = setInterval(fetchNotifications, 30000);

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    } catch (err) {
      console.warn('Socket connection error in NotificationBellPopover:', err);
    }
  }, [user?.id, branchId, fetchNotifications]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notif: WebNotification) => {
    try {
      await notificationApi.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Deep link navigation
      let meta = notif.metadata;
      if (typeof meta === 'string') {
        try {
          meta = JSON.parse(meta);
        } catch {}
      }

      setIsOpen(false);
      if (notif.entityType === 'CONVERSATION' || notif.type.includes('MESSAGE')) {
        navigate('/live-queue');
      } else if (notif.entityType === 'APPOINTMENT' || meta?.appointmentId || notif.type.includes('APPOINTMENT')) {
        navigate('/appointments');
      } else if (notif.entityType === 'QUEUE_ENTRY' || meta?.ticketId || meta?.queueId || notif.type.includes('QUEUE')) {
        navigate('/live-queue');
      }
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const scope = isStaff && branchId ? 'branch' : 'user';
      await notificationApi.markAllAsRead({
        scope,
        branchId: branchId || undefined,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STAFF_NEW_TICKET':
      case 'QUEUE_JOINED':
      case 'STAFF_CUSTOMER_TRANSFERRED':
        return <Ticket className="w-4 h-4 text-blue-600" />;
      case 'STAFF_APPOINTMENT_REQUESTED':
      case 'STAFF_NEW_APPOINTMENT_REQUEST':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      case 'STAFF_APPOINTMENT_PAYMENT_RECEIVED':
      case 'APPOINTMENT_PAYMENT_COMPLETED':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'STAFF_APPOINTMENT_UNSOLVED_FEEDBACK':
      case 'STAFF_TICKET_CANCELLED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'APPOINTMENT_COMPLETED':
      case 'QUEUE_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600" />;
    }
  };

  // Tone down routine queue customer joins for staff to keep notifications clean and actionable
  const curatedNotifications = notifications.filter((n) => {
    if (isStaff && n.type === 'STAFF_NEW_QUEUE_CUSTOMER') {
      return false;
    }
    return true;
  });

  const filteredNotifications = curatedNotifications.filter((n) => {
    if (filter === 'QUEUE') return n.type.includes('QUEUE') || n.type.includes('TICKET');
    if (filter === 'APPOINTMENT') return n.type.includes('APPOINTMENT');
    if (filter === 'MESSAGES') return n.type.includes('MESSAGE') || n.entityType === 'CONVERSATION';
    return true;
  });

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors relative focus:outline-none"
        title="Live Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-0.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex px-3 py-2 border-b border-slate-200 bg-white space-x-1 text-xs font-bold overflow-x-auto">
            {(['ALL', 'QUEUE', 'APPOINTMENT', 'MESSAGES'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg transition-colors flex-shrink-0 ${
                  filter === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL'
                  ? 'All'
                  : tab === 'QUEUE'
                  ? 'Queues'
                  : tab === 'APPOINTMENT'
                  ? 'Appointments'
                  : 'Messages'}
              </button>
            ))}
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400 px-6">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold text-gray-600">No notifications yet</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Branch queue events, customer messages, and appointments will stream here in real time.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start space-x-3 hover:bg-gray-50 ${
                    !notif.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 truncate">
                        <p
                          className={`text-xs truncate ${
                            !notif.isRead ? 'font-black text-gray-900' : 'font-bold text-gray-700'
                          }`}
                        >
                          {notif.title}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center space-x-1 mt-1.5 text-[10px] text-gray-400 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBellPopover;
