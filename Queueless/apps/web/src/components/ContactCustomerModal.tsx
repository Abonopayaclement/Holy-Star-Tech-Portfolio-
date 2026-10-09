import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, Send, User, ShieldAlert, Clock, Check, CheckCheck } from 'lucide-react';
import { CONFIG } from '../utils/config';
import messageApi, { Conversation, ConversationMessage } from '../api/message';

interface ContactCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueEntryId?: string;
  appointmentId?: string;
  customerName?: string;
  contextTitle?: string;
}

export const ContactCustomerModal: React.FC<ContactCustomerModalProps> = ({
  isOpen,
  onClose,
  queueEntryId,
  appointmentId,
  customerName = 'Customer',
  contextTitle,
}) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize or fetch conversation
  useEffect(() => {
    if (!isOpen || (!queueEntryId && !appointmentId)) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const initConversation = async () => {
      try {
        const conv = await messageApi.getOrCreateConversation({
          queueEntryId,
          appointmentId,
        });

        if (!isMounted) return;

        setConversation(conv);

        // Fetch detailed messages
        const fullConv = await messageApi.getConversation(conv.id);
        if (isMounted) {
          setMessages(fullConv.messages || []);
          setLoading(false);
          // Mark as read
          await messageApi.markAsRead(conv.id).catch(() => null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error || err.message || 'Failed to load conversation');
          setLoading(false);
        }
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, queueEntryId, appointmentId]);

  // Real-time socket integration
  useEffect(() => {
    if (!conversation?.id || !isOpen) return;

    try {
      const socket = io(CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_conversation', conversation.id);
      });

      socket.on('new_message', (data: { message: ConversationMessage; conversationId: string }) => {
        if (data.conversationId === conversation.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          // Mark as read if received from customer
          if (data.message.senderType === 'CUSTOMER') {
            messageApi.markAsRead(conversation.id).catch(() => null);
          }
        }
      });

      socket.on('messages_read', () => {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      });

      return () => {
        socket.emit('leave_conversation', conversation.id);
        socket.disconnect();
      };
    } catch (err) {
      console.warn('Socket connection error in ContactCustomerModal:', err);
    }
  }, [conversation?.id, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation?.id || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);
    setError(null);

    try {
      const sent = await messageApi.sendMessage(conversation.id, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send message');
      setInputText(text); // restore
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-base">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">{customerName}</h3>
              <p className="text-[11px] text-blue-100">{contextTitle || 'Direct Counter Service Communication'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-[11px] text-amber-800 flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
          <span>Tenant Isolated & Audited: Only service instructions (Ghana Card, documents, counter arrival) should be sent.</span>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-400 font-bold">
              Loading conversation...
            </div>
          ) : error && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-6 text-xs text-red-500 font-bold">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <User className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-600">No messages exchanged yet</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                Send instructions to the customer regarding their ticket or remote appointment.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isStaff = msg.senderType === 'STAFF';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-gray-400 font-semibold mb-1 px-1">
                    {isStaff ? 'You (Staff)' : msg.sender?.fullName || customerName}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                      isStaff
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div className="flex items-center space-x-1 mt-1 text-[10px] text-gray-400 px-1 font-medium">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isStaff && (
                      <span className="ml-1 text-blue-500">
                        {msg.isRead ? (
                          <CheckCheck className="w-3 h-3 text-emerald-500 inline" />
                        ) : (
                          <Check className="w-3 h-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to customer (e.g. Please bring Ghana Card)..."
            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            disabled={loading || sending}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactCustomerModal;
