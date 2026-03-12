/**
 * AsyncStorage-based local store.
 * Used as primary storage when Firebase is not configured,
 * and as a read-cache when offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order, Customer, CraftCategory, NotificationPrefs, BusinessProfile } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_NOTIFICATION_PREFS, DEFAULT_BUSINESS_PROFILE } from '../types';

const KEYS = {
  orders: 'sofi:orders',
  customers: 'sofi:customers',
  categories: 'sofi:categories',
  notifPrefs: 'sofi:notif_prefs',
  profile: 'sofi:profile',
};

// ─── Orders ────────────────────────────────────────────────────
export async function getLocalOrders(): Promise<Order[]> {
  const raw = await AsyncStorage.getItem(KEYS.orders);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as Order[];
  // Re-hydrate Date objects from ISO strings
  return parsed.map((o) => ({
    ...o,
    dueDate: new Date(o.dueDate),
    createdAt: new Date(o.createdAt),
    acceptedAt: o.acceptedAt ? new Date(o.acceptedAt) : undefined,
    shippedAt: o.shippedAt ? new Date(o.shippedAt) : undefined,
    deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
  }));
}

export async function saveLocalOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.orders, JSON.stringify(orders));
}

export async function addLocalOrder(order: Order): Promise<void> {
  const orders = await getLocalOrders();
  orders.unshift(order);
  await saveLocalOrders(orders);
}

export async function updateLocalOrder(id: string, updates: Partial<Order>): Promise<void> {
  const orders = await getLocalOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    await saveLocalOrders(orders);
  }
}

export async function deleteLocalOrder(id: string): Promise<void> {
  const orders = await getLocalOrders();
  await saveLocalOrders(orders.filter((o) => o.id !== id));
}

// ─── Categories ────────────────────────────────────────────────
export async function getLocalCategories(): Promise<CraftCategory[]> {
  const raw = await AsyncStorage.getItem(KEYS.categories);
  if (!raw) return DEFAULT_CATEGORIES;
  return JSON.parse(raw) as CraftCategory[];
}

export async function saveLocalCategories(cats: CraftCategory[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.categories, JSON.stringify(cats));
}

// ─── Notification Prefs ────────────────────────────────────────
export async function getLocalNotifPrefs(): Promise<NotificationPrefs> {
  const raw = await AsyncStorage.getItem(KEYS.notifPrefs);
  if (!raw) return DEFAULT_NOTIFICATION_PREFS;
  return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) } as NotificationPrefs;
}

export async function saveLocalNotifPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(KEYS.notifPrefs, JSON.stringify(prefs));
}

// ─── Business Profile ──────────────────────────────────────────
export async function getLocalProfile(): Promise<BusinessProfile> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  if (!raw) return DEFAULT_BUSINESS_PROFILE;
  return { ...DEFAULT_BUSINESS_PROFILE, ...JSON.parse(raw) } as BusinessProfile;
}

export async function saveLocalProfile(profile: BusinessProfile): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// ─── Helpers ───────────────────────────────────────────────────
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
