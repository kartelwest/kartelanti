import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationService {
  requestPermissions(): Promise<boolean>;
  scheduleNotification(triggerDate: Date, payload: NotificationPayload): Promise<string | null>;
  cancelNotification(identifier: string): Promise<void>;
  cancelAll(): Promise<void>;
}

class ExpoNotificationService implements NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (!Device.isDevice && Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  async scheduleNotification(triggerDate: Date, payload: NotificationPayload): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: payload.title, body: payload.body, data: payload.data },
        trigger: { date: triggerDate } as unknown as Notifications.NotificationTriggerInput,
      });
      return id;
    } catch {
      return null;
    }
  }

  async cancelNotification(identifier: string): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  async cancelAll(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

class WebNotificationService implements NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'web') return false;
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    const permission = await window.Notification.requestPermission();
    return permission === 'granted';
  }

  async scheduleNotification(): Promise<string | null> {
    return null;
  }

  async cancelNotification(): Promise<void> {}

  async cancelAll(): Promise<void> {}
}

export const notificationService: NotificationService =
  Platform.OS === 'web' ? new WebNotificationService() : new ExpoNotificationService();
