import axios from 'axios';
import prisma from '../config/prisma';
import { io } from '../index';
import {
  NotificationPriority,
  DeliveryChannel,
  DeliveryStatus,
} from '@prisma/client';

export interface NotificationPayload {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  branchId?: string | null;
  title: string;
  message: string;
  priority: NotificationPriority;
  type: string;
  metadata?: Record<string, any> | null;
  entityType?: string | null;
  entityId?: string | null;
}

export interface ChannelSendResult {
  success: boolean;
  status: DeliveryStatus;
  providerMessageId?: string;
  error?: string;
}

export interface INotificationChannel {
  channel: DeliveryChannel;
  send(
    payload: NotificationPayload,
    recipientInfo?: {
      pushTokens?: string[];
      phoneNumber?: string | null;
      email?: string | null;
    }
  ): Promise<ChannelSendResult>;
}

/**
 * In-App & Socket.io Channel implementation
 */
export class InAppChannel implements INotificationChannel {
  channel = DeliveryChannel.IN_APP;

  async send(payload: NotificationPayload): Promise<ChannelSendResult> {
    try {
      if (io) {
        if (payload.userId) {
          io.to(`user_${payload.userId}`).emit('new_notification', payload);
        }
        if (payload.branchId) {
          io.to(`branch_${payload.branchId}`).emit('new_notification', payload);
        }
      }
      return { success: true, status: DeliveryStatus.SENT };
    } catch (err: any) {
      return { success: false, status: DeliveryStatus.FAILED, error: err.message };
    }
  }
}

/**
 * Mobile Push Channel (Expo Push API with bounded retry)
 */
export class PushChannel implements INotificationChannel {
  channel = DeliveryChannel.PUSH;
  private readonly maxRetries = 2;

  async send(
    payload: NotificationPayload,
    recipientInfo?: { pushTokens?: string[] }
  ): Promise<ChannelSendResult> {
    const tokens = recipientInfo?.pushTokens?.filter(
      (t) => t && (t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['))
    );

    if (!tokens || tokens.length === 0) {
      return { success: false, status: DeliveryStatus.FAILED, error: 'No valid push token available' };
    }

    const messages = tokens.map((to) => ({
      to,
      sound: 'default',
      title: payload.title,
      body: payload.message,
      data: {
        ...payload.metadata,
        entityType: payload.entityType,
        entityId: payload.entityId,
        notificationId: payload.id,
      },
      priority: payload.priority === NotificationPriority.URGENT ? 'high' : 'default',
    }));

    let lastError: string | undefined;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          'https://exp.host/--/api/v2/push/send',
          messages,
          {
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );
        const respData = response.data as any;
        return {
          success: true,
          status: DeliveryStatus.SENT,
          providerMessageId: Array.isArray(respData?.data) ? respData.data[0]?.id : undefined,
        };
      } catch (err: any) {
        lastError = err.message;
        if (attempt < this.maxRetries) {
          // Bounded backoff
          await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
      }
    }

    return { success: false, status: DeliveryStatus.FAILED, error: lastError };
  }
}

/**
 * SMS Channel Provider (Future ready: Twilio / Infobip / Hubtel abstraction)
 */
export class SmsChannel implements INotificationChannel {
  channel = DeliveryChannel.SMS;

  async send(
    payload: NotificationPayload,
    recipientInfo?: { phoneNumber?: string | null }
  ): Promise<ChannelSendResult> {
    if (!recipientInfo?.phoneNumber) {
      return { success: false, status: DeliveryStatus.FAILED, error: 'Recipient phone number not provided' };
    }

    // Provider integration point. In current phase: log dispatch cleanly without external payment gateway
    console.log(`📱 [SMS CHANNEL DISPATCH to ${recipientInfo.phoneNumber}]: "${payload.title} — ${payload.message}"`);
    return {
      success: true,
      status: DeliveryStatus.SENT,
      providerMessageId: `sms_mock_${Date.now()}`,
    };
  }
}

/**
 * WhatsApp Channel Provider (Future ready: Meta WhatsApp Business API abstraction)
 */
export class WhatsAppChannel implements INotificationChannel {
  channel = DeliveryChannel.WHATSAPP;

  async send(
    payload: NotificationPayload,
    recipientInfo?: { phoneNumber?: string | null }
  ): Promise<ChannelSendResult> {
    if (!recipientInfo?.phoneNumber) {
      return { success: false, status: DeliveryStatus.FAILED, error: 'Recipient WhatsApp phone number missing' };
    }

    // Future-ready abstraction
    console.log(`💬 [WHATSAPP CHANNEL DISPATCH to ${recipientInfo.phoneNumber}]: "${payload.title} — ${payload.message}"`);
    return {
      success: true,
      status: DeliveryStatus.SENT,
      providerMessageId: `wa_mock_${Date.now()}`,
    };
  }
}

/**
 * Email Channel Provider (Future ready: SendGrid / Resend / SES abstraction)
 */
export class EmailChannel implements INotificationChannel {
  channel = DeliveryChannel.EMAIL;

  async send(
    payload: NotificationPayload,
    recipientInfo?: { email?: string | null }
  ): Promise<ChannelSendResult> {
    if (!recipientInfo?.email) {
      return { success: false, status: DeliveryStatus.FAILED, error: 'Recipient email address missing' };
    }

    // Future-ready abstraction
    console.log(`✉️ [EMAIL CHANNEL DISPATCH to ${recipientInfo.email}]: Subject: "${payload.title}" Body: "${payload.message}"`);
    return {
      success: true,
      status: DeliveryStatus.SENT,
      providerMessageId: `email_mock_${Date.now()}`,
    };
  }
}

/**
 * Voice Call Channel Provider (Future ready: Twilio Voice / Programmable IVR abstraction)
 */
export class VoiceChannel implements INotificationChannel {
  channel = DeliveryChannel.VOICE;

  async send(
    payload: NotificationPayload,
    recipientInfo?: { phoneNumber?: string | null }
  ): Promise<ChannelSendResult> {
    if (!recipientInfo?.phoneNumber) {
      return { success: false, status: DeliveryStatus.FAILED, error: 'Recipient phone number missing' };
    }

    console.log(`📞 [VOICE CALL CHANNEL DISPATCH to ${recipientInfo.phoneNumber}]: Message: "${payload.message}"`);
    return {
      success: true,
      status: DeliveryStatus.SENT,
      providerMessageId: `voice_mock_${Date.now()}`,
    };
  }
}

/**
 * Central Channel Dispatcher
 */
export class ChannelDispatcher {
  private channels: Map<DeliveryChannel, INotificationChannel> = new Map();

  constructor() {
    this.registerChannel(new InAppChannel());
    this.registerChannel(new PushChannel());
    this.registerChannel(new SmsChannel());
    this.registerChannel(new WhatsAppChannel());
    this.registerChannel(new EmailChannel());
    this.registerChannel(new VoiceChannel());
  }

  registerChannel(channel: INotificationChannel) {
    this.channels.set(channel.channel, channel);
  }

  getChannel(channel: DeliveryChannel): INotificationChannel | undefined {
    return this.channels.get(channel);
  }

  /**
   * Dispatches a notification across specified delivery channels,
   * tracking delivery attempts in the database.
   */
  async dispatch(
    payload: NotificationPayload,
    channels: DeliveryChannel[],
    recipientInfo?: {
      pushTokens?: string[];
      phoneNumber?: string | null;
      email?: string | null;
    }
  ): Promise<Record<DeliveryChannel, ChannelSendResult>> {
    const results: Partial<Record<DeliveryChannel, ChannelSendResult>> = {};

    for (const channelType of channels) {
      const channel = this.channels.get(channelType);
      if (!channel) continue;

      try {
        const result = await channel.send(payload, recipientInfo);
        results[channelType] = result;

        // Persist delivery record if notification has been saved in DB
        if (payload.id && prisma.notificationDelivery && typeof prisma.notificationDelivery.create === 'function') {
          await prisma.notificationDelivery.create({
            data: {
              notificationId: payload.id,
              channel: channelType,
              status: result.status,
              attemptCount: 1,
              lastError: result.error || null,
              sentAt: result.status === DeliveryStatus.SENT ? new Date() : null,
              failedAt: result.status === DeliveryStatus.FAILED ? new Date() : null,
            },
          }).catch((err) => console.warn('[Delivery Tracking] Failed to record delivery:', err.message));
        }
      } catch (err: any) {
        results[channelType] = {
          success: false,
          status: DeliveryStatus.FAILED,
          error: err.message,
        };
      }
    }

    return results as Record<DeliveryChannel, ChannelSendResult>;
  }
}

export const sendExpoPushNotification = async (pushTokens: string[], payload: NotificationPayload) => {
  const pushChannel = new PushChannel();
  return await pushChannel.send(payload, { pushTokens });
};

export const sendSmsAlert = async (phoneNumber: string, message: string) => {
  const smsChannel = new SmsChannel();
  return await smsChannel.send(
    {
      id: '',
      title: 'QueueLess SMS',
      message,
      priority: NotificationPriority.NORMAL,
      type: 'SMS_ALERT',
    },
    { phoneNumber }
  );
};

export const channelDispatcher = new ChannelDispatcher();
export default channelDispatcher;

