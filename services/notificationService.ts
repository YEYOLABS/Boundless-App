
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type CheckType = 'morning' | 'evening';

interface DailyCheckCompletion {
  type: CheckType;
  date: string;
  timestamp: number;
}

const MORNING_CHECK_HOUR = 8;
const MORNING_CHECK_MINUTE = 0;
const EVENING_CHECK_HOUR = 16;
const EVENING_CHECK_MINUTE = 0;
const REMINDER_DELAY_MINUTES = 15;

const STORAGE_KEY_MORNING = 'last_morning_check';
const STORAGE_KEY_EVENING = 'last_evening_check';

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // On Android, create notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-checks', {
        name: 'Daily Vehicle Checks',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        description: 'Notifications for morning and evening vehicle checks',
      });
    }

    console.log('Notification permissions granted');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Schedule daily check notifications at 8 AM and 4 PM
 */
export async function scheduleDailyCheckNotifications(): Promise<void> {
  try {
    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all existing notifications');

    // Schedule morning check notification (8:00 AM daily)
    await Notifications.scheduleNotificationAsync({
      identifier: 'morning-check',
      content: {
        title: '🌅 Morning Vehicle Check',
        body: 'Time for your morning daily check. Please inspect your vehicle.',
        data: { type: 'morning', screen: 'daily-check' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour: MORNING_CHECK_HOUR,
        minute: MORNING_CHECK_MINUTE,
        repeats: true,
      },
    });
    console.log('Scheduled morning check notification at 8:00 AM');

    // Schedule evening check notification (4:00 PM daily)
    await Notifications.scheduleNotificationAsync({
      identifier: 'evening-check',
      content: {
        title: '🌆 Evening Vehicle Check',
        body: 'Time for your evening daily check. Please inspect your vehicle.',
        data: { type: 'evening', screen: 'daily-check' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour: EVENING_CHECK_HOUR,
        minute: EVENING_CHECK_MINUTE,
        repeats: true,
      },
    });
    console.log('Scheduled evening check notification at 4:00 PM');

    // Schedule morning reminder (8:15 AM daily)
    await Notifications.scheduleNotificationAsync({
      identifier: 'morning-check-reminder',
      content: {
        title: '⏰ Reminder: Morning Check',
        body: 'Don\'t forget to complete your morning vehicle check!',
        data: { type: 'morning', screen: 'daily-check', isReminder: true },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour: MORNING_CHECK_HOUR,
        minute: MORNING_CHECK_MINUTE + REMINDER_DELAY_MINUTES,
        repeats: true,
      },
    });
    console.log('Scheduled morning reminder at 8:15 AM');

    // Schedule evening reminder (4:15 PM daily)
    await Notifications.scheduleNotificationAsync({
      identifier: 'evening-check-reminder',
      content: {
        title: '⏰ Reminder: Evening Check',
        body: 'Don\'t forget to complete your evening vehicle check!',
        data: { type: 'evening', screen: 'daily-check', isReminder: true },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour: EVENING_CHECK_HOUR,
        minute: EVENING_CHECK_MINUTE + REMINDER_DELAY_MINUTES,
        repeats: true,
      },
    });
    console.log('Scheduled evening reminder at 4:15 PM');

    // Log all scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Total scheduled notifications: ${scheduled.length}`);
  } catch (error) {
    console.error('Error scheduling daily check notifications:', error);
  }
}

/**
 * Get the current check type based on time of day
 */
export function getCurrentCheckType(): CheckType {
  const currentHour = new Date().getHours();
  
  // Morning check: 6 AM to 2 PM
  // Evening check: 2 PM to 6 AM next day
  if (currentHour >= 6 && currentHour < 14) {
    return 'morning';
  } else {
    return 'evening';
  }
}

/**
 * Check if a daily check has been completed today
 */
export async function hasCompletedCheckToday(type: CheckType): Promise<boolean> {
  try {
    const storageKey = type === 'morning' ? STORAGE_KEY_MORNING : STORAGE_KEY_EVENING;
    const lastCheckData = await AsyncStorage.getItem(storageKey);
    
    if (!lastCheckData) {
      return false;
    }

    const lastCheck: DailyCheckCompletion = JSON.parse(lastCheckData);
    const lastCheckDate = new Date(lastCheck.timestamp);
    const today = new Date();

    // Check if the last check was done today
    return (
      lastCheckDate.getDate() === today.getDate() &&
      lastCheckDate.getMonth() === today.getMonth() &&
      lastCheckDate.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if daily check completed:', error);
    return false;
  }
}

/**
 * Mark a daily check as completed
 */
export async function markCheckCompleted(type: CheckType): Promise<void> {
  try {
    const storageKey = type === 'morning' ? STORAGE_KEY_MORNING : STORAGE_KEY_EVENING;
    const completion: DailyCheckCompletion = {
      type,
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(completion));
    console.log(`Marked ${type} check as completed`);

    // Cancel reminder for this check type
    const reminderIdentifier = `${type}-check-reminder`;
    await Notifications.cancelScheduledNotificationAsync(reminderIdentifier);
    console.log(`Cancelled ${type} reminder`);
  } catch (error) {
    console.error('Error marking check as completed:', error);
  }
}

/**
 * Set up notification response listener for navigation
 */
export function setupNotificationResponseListener(
  onNotificationResponse: (screen: string, data: any) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response received:', response);
      const { screen, ...data } = response.notification.request.content.data;
      
      if (screen) {
        onNotificationResponse(screen, data);
      }
    }
  );

  return () => subscription.remove();
}

/**
 * Initialize notification service
 */
export async function initializeNotificationService(): Promise<void> {
  try {
    console.log('Initializing notification service...');
    
    const hasPermission = await requestNotificationPermissions();
    
    if (hasPermission) {
      await scheduleDailyCheckNotifications();
      console.log('Notification service initialized successfully');
    } else {
      console.log('Notification service not initialized - permissions denied');
    }
  } catch (error) {
    console.error('Error initializing notification service:', error);
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
