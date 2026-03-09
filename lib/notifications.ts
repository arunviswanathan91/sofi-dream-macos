import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { addDays, subDays } from 'date-fns';
import type { Order, NotificationPrefs } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C97B5A',
    });
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Order Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4A853',
    });
    await Notifications.setNotificationChannelAsync('digest', {
      name: 'Daily Digest',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
  } catch (e) {
    console.warn('Could not get push token:', e);
  }

  return token;
}

export async function scheduleOrderNotifications(
  order: Order,
  prefs: NotificationPrefs
): Promise<void> {
  if (!prefs.enabled) return;

  const { dueSoonAlerts, shippingReminder } = prefs;

  // Schedule due-soon alerts
  if (dueSoonAlerts.enabled) {
    const [hours, minutes] = dueSoonAlerts.time.split(':').map(Number);

    for (const daysBefore of dueSoonAlerts.intervals) {
      const triggerDate = subDays(new Date(order.dueDate), daysBefore);
      triggerDate.setHours(hours, minutes, 0, 0);

      if (triggerDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏱ ${order.orderName} due in ${daysBefore} day${daysBefore > 1 ? 's' : ''}!`,
            body: `For ${order.customerName} — stay on track!`,
            data: { orderId: order.id, screen: 'OrderDetail' },
            categoryIdentifier: 'ORDER_REMINDER',
          },
          trigger: { date: triggerDate },
          identifier: `due-${order.id}-${daysBefore}d`,
        });
      }
    }
  }

  // Schedule shipping reminder
  if (shippingReminder.enabled && order.acceptedAt) {
    const shipReminderDate = addDays(
      new Date(order.acceptedAt),
      shippingReminder.daysAfterAccepted
    );

    if (shipReminderDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `📦 Time to ship ${order.orderName}?`,
          body: `Accepted ${shippingReminder.daysAfterAccepted} days ago — ready to go?`,
          data: { orderId: order.id, screen: 'OrderDetail' },
        },
        trigger: { date: shipReminderDate },
        identifier: `ship-${order.id}`,
      });
    }
  }
}

export async function schedulePaymentReminder(
  order: Order,
  prefs: NotificationPrefs
): Promise<void> {
  if (!prefs.enabled || !prefs.paymentReminder.enabled || !order.deliveredAt) return;

  const reminderDate = addDays(
    new Date(order.deliveredAt),
    prefs.paymentReminder.daysAfterDelivery
  );

  if (reminderDate > new Date() && !order.isPaid) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💶 ${order.customerName} hasn't paid yet`,
        body: `${order.orderName} · ${order.currency === 'EUR' ? '€' : order.currency}${order.askingPrice} outstanding`,
        data: { orderId: order.id, screen: 'OrderDetail' },
      },
      trigger: { date: reminderDate },
      identifier: `payment-${order.id}`,
    });
  }
}

export async function cancelOrderNotifications(orderId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.identifier.includes(orderId));

  for (const notif of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
  }
}

export async function scheduleDailyDigest(
  prefs: NotificationPrefs,
  stats: { activeOrders: number; dueThisWeek: number; monthRevenue: number }
): Promise<void> {
  if (!prefs.enabled || !prefs.dailyDigest.enabled) return;

  const [hours, minutes] = prefs.dailyDigest.time.split(':').map(Number);

  // Cancel existing daily digest
  await Notifications.cancelScheduledNotificationAsync('daily-digest');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '☀️ Good morning, Sofie!',
      body: `${stats.activeOrders} orders active · ${stats.dueThisWeek} due this week · €${stats.monthRevenue.toFixed(2)} this month`,
      data: { screen: 'Dashboard' },
    },
    trigger: {
      hour: hours,
      minute: minutes,
      repeats: true,
    },
    identifier: 'daily-digest',
  });
}

export async function scheduleWeeklySummary(prefs: NotificationPrefs): Promise<void> {
  if (!prefs.enabled || !prefs.weeklySummary.enabled) return;

  const [hours, minutes] = prefs.weeklySummary.time.split(':').map(Number);

  await Notifications.cancelScheduledNotificationAsync('weekly-summary');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Your week in review',
      body: 'Tap to see your weekly report and earnings summary.',
      data: { screen: 'Reports' },
    },
    trigger: {
      weekday: prefs.weeklySummary.dayOfWeek + 1, // expo uses 1-7 (Sun=1)
      hour: hours,
      minute: minutes,
      repeats: true,
    },
    identifier: 'weekly-summary',
  });
}

export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✦ Sofi Dream — Test Notification',
      body: 'Your notifications are working perfectly!',
      data: { screen: 'Dashboard' },
    },
    trigger: { seconds: 2 },
  });
}
