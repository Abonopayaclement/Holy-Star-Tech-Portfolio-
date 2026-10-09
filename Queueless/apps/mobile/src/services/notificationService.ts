import { Alert, Platform } from 'react-native';

/**
 * Push & In-app Customer Notification Service
 * Architecture prepared for Expo Notifications integration.
 */
export interface QueueNotificationPayload {
  title: string;
  body: string;
  ticketNumber: string;
}

class NotificationService {
  private pushToken: string | null = null;

  /**
   * Register device for push notifications (Expo Push Token skeleton)
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return null;
      }

      // Safe check for expo-notifications if installed
      let Notifications: any = null;
      try {
        Notifications = require('expo-notifications');
      } catch (e) {
        // Notifications module not installed in current environment
        return null;
      }

      if (!Notifications) return null;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      this.pushToken = tokenData.data;
      return this.pushToken;
    } catch (error) {
      console.log('Push notification registration skipped or not supported in this environment');
      return null;
    }
  }

  /**
   * Trigger local customer alert when ticket is CALLED or SERVING
   */
  notifyTicketCalled(ticketNumber: string, counterName?: string) {
    const title = "You're Next! 🔔";
    const message = `Ticket ${ticketNumber} has been called. Please proceed to the ${counterName || 'service desk'}.`;

    if (Platform.OS !== 'web') {
      Alert.alert(title, message, [{ text: 'OK, Proceeding' }]);
    }
  }

  /**
   * Trigger proximity reminder when customer is close (e.g. 2 customers ahead)
   */
  notifyQueueApproaching(ticketNumber: string, peopleAhead: number) {
    const title = 'Queue Approaching ⏳';
    const message = `You have ${peopleAhead} ${peopleAhead === 1 ? 'customer' : 'customers'} ahead of you for ticket ${ticketNumber}. Please stay near the service area.`;

    if (Platform.OS !== 'web') {
      Alert.alert(title, message, [{ text: 'Got it' }]);
    }
  }

  /**
   * Trigger transfer notification when ticket is moved to another service
   */
  notifyServiceTransferred(ticketNumber: string, oldService: string, newService: string, reason?: string) {
    const title = 'Service Transferred 🔄';
    const reasonText = reason ? ` (Reason: ${reason})` : '';
    const message = `Your service has been changed from ${oldService} to ${newService}.${reasonText}`;

    if (Platform.OS !== 'web') {
      Alert.alert(title, message, [{ text: 'Understood' }]);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
