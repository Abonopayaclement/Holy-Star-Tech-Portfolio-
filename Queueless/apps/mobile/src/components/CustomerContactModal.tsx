import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS } from '../constants/theme';
import messageApi from '../api/messageApi';
import { Conversation, Message } from '../types';
import { X, Send, ShieldCheck, User } from 'lucide-react-native';

interface CustomerContactModalProps {
  visible: boolean;
  onClose: () => void;
  queueEntryId?: string;
  appointmentId?: string;
  serviceTitle?: string;
}

export const CustomerContactModal: React.FC<CustomerContactModalProps> = ({
  visible,
  onClose,
  queueEntryId,
  appointmentId,
  serviceTitle = 'Service Counter Support',
}) => {
  const { colors, isDark } = useTheme();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize or fetch conversation
  useEffect(() => {
    if (!visible || (!queueEntryId && !appointmentId)) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const init = async () => {
      try {
        const conv = await messageApi.getOrCreateConversation({
          queueEntryId,
          appointmentId,
        });

        if (!isMounted) return;
        setConversation(conv);

        const full = await messageApi.getConversation(conv.id);
        if (isMounted) {
          setMessages(full.messages || []);
          setLoading(false);
          await messageApi.markAsRead(conv.id).catch(() => null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to connect with counter staff');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [visible, queueEntryId, appointmentId]);

  // Socket real-time updates
  useEffect(() => {
    if (!conversation?.id || !visible) return;

    try {
      // Connect to socket server
      const socket = io(process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_conversation', conversation.id);
      });

      socket.on('new_message', (data: { message: Message; conversationId: string }) => {
        if (data.conversationId === conversation.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
          if (data.message.senderType === 'STAFF') {
            messageApi.markAsRead(conversation.id).catch(() => null);
          }
        }
      });

      return () => {
        socket.emit('leave_conversation', conversation.id);
        socket.disconnect();
      };
    } catch (err) {
      console.warn('Socket error in CustomerContactModal:', err);
    }
  }, [conversation?.id, visible]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversation?.id || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);
    setError(null);

    try {
      const msg = await messageApi.sendMessage(conversation.id, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.container, { backgroundColor: colors.surface }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{serviceTitle}</Text>
              <View style={styles.secureBadge}>
                <ShieldCheck size={12} color={colors.primary} />
                <Text style={[styles.secureText, { color: colors.primary }]}>
                  Authorized Service Communication
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Messages Feed */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Connecting to staff counter...
              </Text>
            </View>
          ) : error && messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <User size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Send a message to counter staff regarding requirements, arrival, or questions.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item: Message) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }: { item: Message }) => {
                const isCustomer = item.senderType === 'CUSTOMER';
                return (
                  <View
                    style={[
                      styles.bubbleWrapper,
                      isCustomer ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
                    ]}
                  >
                    <Text style={[styles.senderLabel, { color: colors.textSecondary }]}>
                      {isCustomer ? 'You' : item.sender?.fullName || 'Counter Staff'}
                    </Text>
                    <View
                      style={[
                        styles.bubble,
                        isCustomer
                          ? [styles.bubbleCustomer, { backgroundColor: colors.primary }]
                          : [
                              styles.bubbleStaff,
                              {
                                backgroundColor: colors.surfaceLight,
                                borderColor: colors.surfaceBorder,
                              },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          { color: isCustomer ? '#ffffff' : colors.text },
                        ]}
                      >
                        {item.message}
                      </Text>
                    </View>
                    <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                );
              }}
            />
          )}

          {/* Input Bar */}
          <View style={[styles.inputBar, { borderTopColor: colors.surfaceBorder }]}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceLight,
                  color: colors.text,
                  borderColor: colors.surfaceBorder,
                },
              ]}
              placeholder="Ask staff a question (e.g. Ghana card)..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
              style={[
                styles.sendBtn,
                { backgroundColor: colors.primary, opacity: !inputText.trim() || sending ? 0.5 : 1 },
              ]}
            >
              <Send size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  secureText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: 13,
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
    maxWidth: 240,
    lineHeight: 18,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  bubbleWrapper: {
    marginBottom: SPACING.xs,
  },
  bubbleWrapperRight: {
    alignItems: 'flex-end',
  },
  bubbleWrapperLeft: {
    alignItems: 'flex-start',
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
  },
  bubbleCustomer: {
    borderBottomRightRadius: 4,
  },
  bubbleStaff: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  timeText: {
    fontSize: 10,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    fontSize: 13,
    borderWidth: 1,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomerContactModal;
