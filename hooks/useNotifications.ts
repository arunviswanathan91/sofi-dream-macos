import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  registerForPushNotifications,
  scheduleOrderNotifications,
  cancelOrderNotifications,
  scheduleDailyDigest,
  scheduleWeeklySummary,
  sendTestNotification,
} from '../lib/notifications';
import { getLocalNotifPrefs, saveLocalNotifPrefs } from '../lib/localStore';
import { DEFAULT_NOTIFICATION_PREFS } from '../types';
import type { NotificationPrefs, Order } from '../types';

export function useNotifications() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotifications().then(setPushToken);

    if (!isFirebaseConfigured) {
      getLocalNotifPrefs().then((p) => {
        setPrefs(p);
        setLoading(false);
      });
      return;
    }

    const docRef = doc(db, 'settings', 'notifications');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) setPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...(snap.data() as Partial<NotificationPrefs>) });
        setLoading(false);
      },
      () => {
        getLocalNotifPrefs().then((p) => { setPrefs(p); setLoading(false); });
      }
    );
    return unsubscribe;
  }, []);

  const updatePrefs = useCallback(async (updates: Partial<NotificationPrefs>): Promise<void> => {
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);
    await saveLocalNotifPrefs(newPrefs);
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'settings', 'notifications'), newPrefs, { merge: true });
      } catch { /* non-critical */ }
    }
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
