import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  registerForPushNotifications,
  scheduleOrderNotifications,
  cancelOrderNotifications,
  scheduleDailyDigest,
  scheduleWeeklySummary,
  sendTestNotification,
} from '../lib/notifications';
import { DEFAULT_NOTIFICATION_PREFS } from '../types';
import type { NotificationPrefs, Order } from '../types';

export function useNotifications() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then(setPushToken);

    // Listen to notification prefs from Firestore
    const docRef = doc(db, 'settings', 'notifications');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setPrefs(snapshot.data() as NotificationPrefs);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updatePrefs = useCallback(async (updates: Partial<NotificationPrefs>): Promise<void> => {
    const docRef = doc(db, 'settings', 'notifications');
    const newPrefs = { ...prefs, ...updates };
    await setDoc(docRef, newPrefs, { merge: true });
    setPrefs(newPrefs);
  }, [prefs]);

  const scheduleForOrder = useCallback(
    async (order: Order): Promise<void> => {
      await scheduleOrderNotifications(order, prefs);
    },
    [prefs]
  );

  const cancelForOrder = useCallback(async (orderId: string): Promise<void> => {
    await cancelOrderNotifications(orderId);
  }, []);

  const rescheduleDigests = useCallback(
    async (stats: { activeOrders: number; dueThisWeek: number; monthRevenue: number }): Promise<void> => {
      await scheduleDailyDigest(prefs, stats);
      await scheduleWeeklySummary(prefs);
    },
    [prefs]
  );

  const testNotification = useCallback(async (): Promise<void> => {
    await sendTestNotification();
  }, []);

  return {
    prefs,
    loading,
    pushToken,
    updatePrefs,
    scheduleForOrder,
    cancelForOrder,
    rescheduleDigests,
    testNotification,
  };
}
