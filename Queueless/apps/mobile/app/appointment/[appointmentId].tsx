/// <reference path="../../src/types/declarations.d.ts" />
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import appointmentApi from '../../src/api/appointmentApi';
import { API_BASE_URL } from '../../src/api/client';
import { Appointment } from '../../src/types';
import { SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Send,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Lock,
  EyeOff,
  RotateCcw,
  MessageSquare,
} from 'lucide-react-native';
import { ScreenWrapper, MobileHeader } from '../../src/components';
import CustomerContactModal from '../../src/components/CustomerContactModal';

export default function AppointmentDetailsScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Feedback state
  const [solvedOption, setSolvedOption] = useState<boolean | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Follow-up state
  const [requestingFollowUp, setRequestingFollowUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const fetchAppointment = useCallback(async () => {
    if (!appointmentId) return;
    try {
      // Direct details endpoint
      const data = await appointmentApi.getAppointmentDetails(appointmentId);
      setAppointment(data);
      if (typeof data.isProblemSolved === 'boolean') {
        setSolvedOption(data.isProblemSolved);
        if (data.feedbackNotes) setFeedbackNotes(data.feedbackNotes);
      }
    } catch (err: any) {
      console.warn('Error fetching appointment details:', err);
      // Fallback to getMyAppointments
      try {
        const all = await appointmentApi.getMyAppointments();
        const found = all.find((a) => a.id === appointmentId);
        if (found) setAppointment(found);
      } catch (fallbackErr) {
        Alert.alert('Error', 'Unable to retrieve remote appointment details.');
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // Real-time socket updates
  useEffect(() => {
    if (!appointmentId) return;
    const serverUrl = API_BASE_URL.replace(/\/api\/?$/, '');

    try {
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
      });
      socketRef.current = socket;

      socket.on('appointment_updated', (event: any) => {
        if (event?.appointment?.id === appointmentId) {
          setAppointment(event.appointment);
        }
      });

      const interval = setInterval(fetchAppointment, 8000);

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    } catch (err) {
      console.warn('Socket error on appointment tracker:', err);
    }
  }, [appointmentId, fetchAppointment]);

  const isFreeAppointment =
    appointment?.fee !== null &&
    appointment?.fee !== undefined &&
    Number(appointment?.fee) === 0;

  // Handle test payment
  const handlePayment = async () => {
    if (!appointment) return;
    if (isFreeAppointment) {
      Alert.alert('Free Service', 'This service has been approved as complimentary. No payment is required.');
      return;
    }
    const amount = Number(appointment.fee ?? 10.0) || 10.0;

    Alert.alert(
      'Confirm Service Payment',
      `Complete test payment of GHS ${amount.toFixed(2)} for ${appointment.service?.name || 'Service'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay GHS ${amount.toFixed(2)}`,
          onPress: async () => {
            setActionLoading(true);
            try {
              const updated = await appointmentApi.payAppointment(appointment.id);
              setAppointment(updated);
              Alert.alert('Payment Successful', 'Payment recorded. Branch staff will process your service immediately.');
            } catch (err: any) {
              Alert.alert('Payment Error', err.response?.data?.error || err.message || 'Payment processing failed.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (solvedOption === null) {
      Alert.alert('Selection Required', 'Please let us know if your problem was solved (Yes or No).');
      return;
    }

    if (!solvedOption && !feedbackNotes.trim()) {
      Alert.alert('Details Required', 'Please provide a brief reason why your problem was not resolved.');
      return;
    }

    setSubmittingFeedback(true);
    try {
      const updated = await appointmentApi.submitFeedback(appointmentId, {
        isProblemSolved: solvedOption,
        feedbackNotes: feedbackNotes.trim(),
      });
      setAppointment(updated);
      Alert.alert('Feedback Submitted', 'Thank you for your feedback! Your response has been logged.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Handle follow-up request from customer
  const handleRequestFollowUp = async () => {
    if (!appointmentId) return;
    setRequestingFollowUp(true);
    try {
      const updated = await appointmentApi.requestFollowUp(appointmentId, followUpNote.trim() || undefined);
      setAppointment(updated);
      setShowFollowUpForm(false);
      setFollowUpNote('');
      Alert.alert('Follow-Up Requested', 'Your follow-up request has been sent to branch staff. You will not be charged again.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to submit follow-up request.');
    } finally {
      setRequestingFollowUp(false);
    }
  };

  // Handle soft-hide appointment from history
  const handleHideAppointment = () => {
    if (!appointmentId) return;
    Alert.alert(
      'Remove from History',
      'Hide this appointment from your personal history? The authoritative record remains in the database.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentApi.hideAppointment(appointmentId);
              Alert.alert('Removed', 'This appointment has been removed from your history view.', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(customer)/history');
                    }
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Unable to hide appointment.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'PENDING STAFF REVIEW', bg: 'rgba(245, 158, 11, 0.15)', text: colors.warning };
      case 'APPROVED':
        return isFreeAppointment
          ? { label: 'APPROVED — FREE SERVICE', bg: 'rgba(16, 185, 129, 0.15)', text: colors.success }
          : { label: 'APPROVED — PAYMENT READY', bg: 'rgba(37, 99, 235, 0.15)', text: colors.primary };
      case 'PAID':
        return { label: 'PAYMENT RECEIVED', bg: 'rgba(16, 185, 129, 0.15)', text: colors.success };
      case 'IN_PROGRESS':
        return { label: 'IN PROGRESS', bg: 'rgba(6, 182, 212, 0.15)', text: colors.info };
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: 'rgba(16, 185, 129, 0.15)', text: colors.success };
      case 'REJECTED':
        return { label: 'REQUEST DECLINED', bg: 'rgba(239, 68, 68, 0.15)', text: colors.danger };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: 'rgba(100, 116, 139, 0.15)', text: colors.textMuted };
      default:
        return { label: status, bg: 'rgba(100, 116, 139, 0.15)', text: colors.textMuted };
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <MobileHeader
        title="Remote Appointment"
        subtitle={appointment?.problemType || 'Service Case Tracker'}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(customer)/history');
          }
        }}
      />

      <ScreenWrapper scrollable topSafeArea={false} bottomSafeArea>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading request details...</Text>
          </View>
        ) : !appointment ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: SPACING.xl }]}>
            <AlertCircle color={colors.danger} size={32} style={{ marginBottom: 8 }} />
            <Text style={[styles.cardTitle, { color: colors.danger }]}>Request Not Found</Text>
            <Text style={[styles.cardText, { color: colors.textMuted }]}>This remote appointment could not be located.</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Status Card */}
            {(() => {
              const badge = getStatusBadge(appointment.status);
              return (
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <View style={styles.statusRow}>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgePillText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                    <Text style={[styles.refText, { color: colors.textMuted }]}>
                      #{appointment.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>

                  {/* Status explanation */}
                  {appointment.status === 'PENDING' && (
                    <Text style={[styles.statusExplainer, { color: colors.textSecondary }]}>
                      Your request is currently awaiting staff review. Once staff confirms the issue, they will set the service fee and notify you here.
                    </Text>
                  )}

                  {appointment.status === 'APPROVED' && (
                    <View style={styles.feeCallout}>
                      {isFreeAppointment ? (
                        <>
                          <Text style={[styles.feeCalloutTitle, { color: colors.text }]}>Complimentary Service Approved</Text>
                          <Text style={[styles.feeAmount, { color: colors.success }]}>
                            Free (GHS 0.00)
                          </Text>
                          <Text style={[styles.feeCalloutSub, { color: colors.textSecondary }]}>
                            Approved by {appointment.approvedBy || 'Staff'}. No payment is required for this request. Staff will start processing your service shortly.
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.feeCalloutTitle, { color: colors.text }]}>Service Fee Assessed</Text>
                          <Text style={[styles.feeAmount, { color: colors.primary }]}>
                            GHS {Number(appointment.fee ?? 10.0).toFixed(2)}
                          </Text>
                          <Text style={[styles.feeCalloutSub, { color: colors.textMuted }]}>
                            Approved by {appointment.approvedBy || 'Staff'}. Please proceed with payment below to initiate service.
                          </Text>

                          <TouchableOpacity
                            style={[styles.payButton, { backgroundColor: colors.primary }, actionLoading && { opacity: 0.6 }]}
                            onPress={handlePayment}
                            disabled={actionLoading}
                            activeOpacity={0.85}
                          >
                            {actionLoading ? (
                              <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                              <>
                                <CreditCard color="#ffffff" size={18} style={{ marginRight: 8 }} />
                                <Text style={styles.payButtonText}>
                                  Pay GHS {Number(appointment.fee ?? 10.0).toFixed(2)}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {appointment.status === 'PAID' && (
                    <View style={styles.paidCallout}>
                      <CheckCircle2 color={colors.success} size={20} style={{ marginRight: 8, marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.paidTitle, { color: colors.text }]}>Payment Confirmed</Text>
                        <Text style={[styles.paidSub, { color: colors.textSecondary }]}>
                          Payment has been received. Your request is queued and staff will begin processing shortly.
                        </Text>
                      </View>
                    </View>
                  )}

                  {appointment.status === 'IN_PROGRESS' && (
                    <View style={styles.inProgressCallout}>
                      <Sparkles color={colors.info} size={20} style={{ marginRight: 8, marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inProgressTitle, { color: colors.text }]}>Staff Working on Case</Text>
                        <Text style={[styles.inProgressSub, { color: colors.textSecondary }]}>
                          A staff member is actively handling your request right now. You will be notified once resolution is complete.
                        </Text>
                      </View>
                    </View>
                  )}

                  {appointment.status === 'COMPLETED' && (
                    <View style={styles.completedCallout}>
                      <CheckCircle2 color={colors.success} size={20} style={{ marginRight: 8, marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.completedTitle, { color: colors.text }]}>Service Completed</Text>
                        <Text style={[styles.completedSub, { color: colors.textSecondary }]}>
                          Staff has completed handling your remote service request.
                        </Text>
                      </View>
                    </View>
                  )}

                  {appointment.status === 'REJECTED' && (
                    <View style={[styles.rejectedCallout, { borderColor: colors.danger }]}>
                      <AlertCircle color={colors.danger} size={20} style={{ marginRight: 8, marginTop: 1 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rejectedTitle, { color: colors.danger }]}>Request Not Approved</Text>
                        <Text style={[styles.rejectedReason, { color: colors.text }]}>
                          Reason: {appointment.rejectionReason || 'Unable to fulfill remotely'}
                        </Text>
                        {appointment.rejectionNote && (
                          <Text style={[styles.rejectedSub, { color: colors.textMuted }]}>
                            Note: {appointment.rejectionNote}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* Customer Feedback Section (When Completed) */}
            {appointment.status === 'COMPLETED' && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.feedbackSectionTitle, { color: colors.text }]}>Was your problem solved?</Text>

                {appointment.isProblemSolved !== undefined && appointment.isProblemSolved !== null ? (
                  <View style={styles.feedbackRecordedBox}>
                    <View style={styles.feedbackRecordedRow}>
                      {appointment.isProblemSolved ? (
                        <>
                          <CheckCircle2 color={colors.success} size={18} style={{ marginRight: 6 }} />
                          <Text style={[styles.feedbackRecordedText, { color: colors.success }]}>
                            Feedback Recorded: Yes, problem solved!
                          </Text>
                        </>
                      ) : (
                        <>
                          <AlertCircle color={colors.danger} size={18} style={{ marginRight: 6 }} />
                          <Text style={[styles.feedbackRecordedText, { color: colors.danger }]}>
                            Feedback Recorded: Problem not solved
                          </Text>
                        </>
                      )}
                    </View>
                    {appointment.feedbackNotes && (
                      <Text style={[styles.feedbackRecordedNotes, { color: colors.textSecondary }]}>
                        "{appointment.feedbackNotes}"
                      </Text>
                    )}
                  </View>
                ) : (
                  <View style={{ marginTop: SPACING.sm }}>
                    <Text style={[styles.feedbackSub, { color: colors.textMuted }]}>
                      Your feedback helps us maintain high quality service.
                    </Text>

                    <View style={styles.feedbackToggleRow}>
                      <TouchableOpacity
                        style={[
                          styles.feedbackOptionBtn,
                          solvedOption === true && {
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderColor: colors.success,
                          },
                        ]}
                        onPress={() => setSolvedOption(true)}
                        activeOpacity={0.8}
                      >
                        <ThumbsUp
                          color={solvedOption === true ? colors.success : colors.textMuted}
                          size={18}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.feedbackOptionText,
                            { color: solvedOption === true ? colors.success : colors.text },
                          ]}
                        >
                          Yes, Solved
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.feedbackOptionBtn,
                          solvedOption === false && {
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            borderColor: colors.danger,
                          },
                        ]}
                        onPress={() => setSolvedOption(false)}
                        activeOpacity={0.8}
                      >
                        <ThumbsDown
                          color={solvedOption === false ? colors.danger : colors.textMuted}
                          size={18}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.feedbackOptionText,
                            { color: solvedOption === false ? colors.danger : colors.text },
                          ]}
                        >
                          No, Not Solved
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {solvedOption === false && (
                      <TextInput
                        style={[
                          styles.feedbackInput,
                          {
                            backgroundColor: colors.surfaceLight,
                            borderColor: colors.surfaceBorder,
                            color: colors.text,
                          },
                        ]}
                        placeholder="Please explain what was not resolved so management can assist..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={3}
                        value={feedbackNotes}
                        onChangeText={setFeedbackNotes}
                        textAlignVertical="top"
                      />
                    )}

                    <TouchableOpacity
                      style={[
                        styles.feedbackSubmitBtn,
                        { backgroundColor: colors.primary },
                        submittingFeedback && { opacity: 0.6 },
                      ]}
                      onPress={handleSubmitFeedback}
                      disabled={submittingFeedback || solvedOption === null}
                      activeOpacity={0.85}
                    >
                      {submittingFeedback ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Send color="#ffffff" size={15} style={{ marginRight: 6 }} />
                          <Text style={styles.feedbackSubmitBtnText}>Submit Feedback</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Unresolved Case Follow-Up Section */}
            {appointment.status === 'COMPLETED' && appointment.isProblemSolved === false && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: '#f59e0b', borderWidth: 1.5 }]}>
                <View style={styles.followUpHeaderRow}>
                  <RotateCcw color="#d97706" size={18} style={{ marginRight: 6 }} />
                  <Text style={[styles.followUpHeaderTitle, { color: '#d97706' }]}>
                    Unresolved Issue Follow-Up
                  </Text>
                </View>

                <Text style={[styles.followUpExplainer, { color: colors.textSecondary }]}>
                  Since your problem was not fully solved in the initial attempt, follow-up assistance is available. Consultations for this case are covered under your original service — no additional fee required.
                </Text>

                {/* Staff Guidance / Branch Visit Instructions */}
                {appointment.staffInstruction && (
                  <View style={[styles.staffInstructionBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }]}>
                    <Text style={[styles.staffInstructionLabel, { color: '#d97706' }]}>Staff Guidance / Next Steps:</Text>
                    <Text style={[styles.staffInstructionText, { color: colors.text }]}>
                      {appointment.staffInstruction}
                    </Text>
                  </View>
                )}

                {/* Follow-up Status */}
                {appointment.followUpStatus === 'FOLLOWUP_REQUESTED' && (
                  <View style={[styles.followUpStatusPill, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                    <Clock color={colors.primary} size={15} style={{ marginRight: 6 }} />
                    <Text style={[styles.followUpStatusText, { color: colors.primary }]}>
                      Follow-up requested. Branch staff is reviewing your case details.
                    </Text>
                  </View>
                )}

                {appointment.followUpStatus === 'ATTEMPT_CREATED' && (
                  <View style={[styles.followUpStatusPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <CheckCircle2 color={colors.success} size={15} style={{ marginRight: 6 }} />
                    <Text style={[styles.followUpStatusText, { color: colors.success }]}>
                      Follow-up session created. Staff is scheduling follow-up service.
                    </Text>
                  </View>
                )}

                {/* Customer Request Form */}
                {appointment.followUpStatus !== 'FOLLOWUP_REQUESTED' && appointment.followUpStatus !== 'ATTEMPT_CREATED' && (
                  <View style={{ marginTop: SPACING.sm }}>
                    {!showFollowUpForm ? (
                      <TouchableOpacity
                        style={[styles.requestFollowUpBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setShowFollowUpForm(true)}
                        activeOpacity={0.8}
                      >
                        <MessageSquare color="#ffffff" size={16} style={{ marginRight: 6 }} />
                        <Text style={styles.requestFollowUpBtnText}>Request Remote Follow-Up Assistance</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.followUpFormBox}>
                        <Text style={[styles.formLabel, { color: colors.text }]}>
                          Explain what still requires resolution:
                        </Text>
                        <TextInput
                          style={[
                            styles.feedbackInput,
                            {
                              backgroundColor: colors.surfaceLight,
                              borderColor: colors.surfaceBorder,
                              color: colors.text,
                            },
                          ]}
                          placeholder="Provide details for the staff member handling your follow-up..."
                          placeholderTextColor={colors.textMuted}
                          multiline
                          numberOfLines={3}
                          value={followUpNote}
                          onChangeText={setFollowUpNote}
                          textAlignVertical="top"
                        />
                        <View style={styles.formBtnRow}>
                          <TouchableOpacity
                            style={[styles.formCancelBtn, { borderColor: colors.surfaceBorder }]}
                            onPress={() => setShowFollowUpForm(false)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.formCancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.formSubmitBtn, { backgroundColor: colors.primary }, requestingFollowUp && { opacity: 0.6 }]}
                            onPress={handleRequestFollowUp}
                            disabled={requestingFollowUp}
                            activeOpacity={0.8}
                          >
                            {requestingFollowUp ? (
                              <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                              <Text style={styles.formSubmitBtnText}>Submit Follow-Up</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Request Summary Details Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>REQUEST DETAILS</Text>

              {appointment.branch?.organization?.name && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Organization</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{appointment.branch.organization.name}</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                </>
              )}

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Branch</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{appointment.branch?.name}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Department / Desk</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{appointment.service?.name}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Problem Category</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{appointment.category?.name || appointment.problemType || 'Service'}</Text>
              </View>

              {appointment.notes && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={{ marginTop: 2 }}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Your Problem Description</Text>
                    <Text style={[styles.notesContent, { color: colors.textSecondary }]}>{appointment.notes}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Timestamps & Lifecycle Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.cardHeading, { color: colors.textSecondary }]}>CASE TIMESTAMPS & LIFECYCLE</Text>

              {appointment.createdAt && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Requested On</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {new Date(appointment.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}

              {appointment.approvedAt && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Approved At</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(appointment.approvedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {appointment.approvedBy ? ` by ${appointment.approvedBy}` : ''}
                    </Text>
                  </View>
                </>
              )}

              {appointment.paidAt && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Payment Confirmed</Text>
                    <Text style={[styles.detailValue, { color: colors.success }]}>
                      {new Date(appointment.paidAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}

              {isFreeAppointment && appointment.status !== 'PENDING' && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Payment</Text>
                    <Text style={[styles.detailValue, { color: colors.success }]}>Complimentary (Free)</Text>
                  </View>
                </>
              )}

              {appointment.startedAt && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Service Began</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(appointment.startedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}

              {appointment.completedAt && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Completed At</Text>
                    <Text style={[styles.detailValue, { color: colors.success }]}>
                      {new Date(appointment.completedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Contact Specialist Action */}
            <TouchableOpacity
              style={[styles.contactBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={() => setContactModalVisible(true)}
              activeOpacity={0.8}
            >
              <MessageSquare color={colors.primary} size={18} style={{ marginRight: 8 }} />
              <Text style={[styles.contactBtnText, { color: colors.primary }]}>
                Message Appointment Specialist
              </Text>
            </TouchableOpacity>

            {/* Terminal Actions Footer */}
            {(appointment.status === 'COMPLETED' || appointment.status === 'REJECTED' || appointment.status === 'CANCELLED') && (
              <View style={styles.terminalActionsRow}>
                <TouchableOpacity
                  style={[styles.hideBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={handleHideAppointment}
                  activeOpacity={0.8}
                >
                  <EyeOff color={colors.textMuted} size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.hideBtnText, { color: colors.textMuted }]}>
                    Remove from My History
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScreenWrapper>

      {/* Customer Contact Specialist Modal */}
      <CustomerContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        appointmentId={appointmentId}
        serviceTitle={`${appointment?.service?.name || 'Appointment'} Support`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  centerLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: SPACING.md,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    fontSize: 13,
    marginTop: 4,
  },
  cardHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  badgePill: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statusExplainer: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  feeCallout: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  feeCalloutTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  feeAmount: {
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  feeCalloutSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  payButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  paidCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  paidTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  paidSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  inProgressCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  inProgressTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  inProgressSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  completedCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  completedSub: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  rejectedCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm + 2,
    marginTop: SPACING.xs,
  },
  rejectedTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  rejectedReason: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  rejectedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  feedbackSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  feedbackSub: {
    fontSize: 12,
    marginTop: 2,
  },
  feedbackToggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  feedbackOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 2,
  },
  feedbackOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    marginTop: SPACING.sm,
    minHeight: 70,
    fontSize: 13,
  },
  feedbackSubmitBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 4,
    marginTop: SPACING.md,
  },
  feedbackSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  feedbackRecordedBox: {
    marginTop: SPACING.sm,
  },
  feedbackRecordedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackRecordedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackRecordedNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesContent: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm,
  },
  followUpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  followUpHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  followUpExplainer: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  staffInstructionBox: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  },
  staffInstructionLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  staffInstructionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  followUpStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  followUpStatusText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  requestFollowUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 4,
  },
  requestFollowUpBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  followUpFormBox: {
    marginTop: SPACING.xs,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  formCancelBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  formCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formSubmitBtn: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  terminalActionsRow: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  hideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  hideBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
