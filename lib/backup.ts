/**
 * Backup utilities — local file, Google Drive (AppDataFolder), Microsoft OneDrive (AppFolder).
 *
 * ─── Setup required ────────────────────────────────────────────────────────────
 * Create a .env file at the project root (copy from .env.example) and fill in:
 *
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=<Android OAuth client from Google Cloud Console>
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB=<Web OAuth client from Google Cloud Console>
 *   EXPO_PUBLIC_MICROSOFT_CLIENT_ID=<Application (client) ID from Azure Portal>
 *
 * Google setup:
 *   1. Go to console.cloud.google.com → APIs & Services → Credentials
 *   2. Create OAuth 2.0 Client ID → Android (package: com.sofiedream.app, add SHA-1)
 *   3. Create OAuth 2.0 Client ID → Web application (needed alongside Android)
 *   4. Enable Google Drive API in the project
 *
 * Microsoft setup:
 *   1. Go to portal.azure.com → Azure Active Directory → App registrations → New
 *   2. Supported account types: "Personal Microsoft accounts only"
 *   3. Redirect URI: Public client / native → sofi-dream://auth
 *   4. Add API permissions: Microsoft Graph → Files.ReadWrite.AppFolder (delegated)
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order, CraftCategory, BusinessProfile } from '../types';
import {
  getLocalOrders, getLocalCategories, getLocalProfile,
  saveLocalOrders, saveLocalCategories, saveLocalProfile,
} from './localStore';

// ─── Configuration ────────────────────────────────────────────────────────────
export const GOOGLE_CLIENT_ID_ANDROID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '';
export const GOOGLE_CLIENT_ID_WEB =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';
export const MICROSOFT_CLIENT_ID =
  process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ?? '';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const K = {
  googleToken: 'sofi:bak:g_token',
  googleUser:  'sofi:bak:g_user',
  gDriveFileId:'sofi:bak:g_fileid',
  msToken:     'sofi:bak:ms_token',
  msUser:      'sofi:bak:ms_user',
  lastLocal:   'sofi:bak:last_local',
  lastGDrive:  'sofi:bak:last_gdrive',
  lastOneDrive:'sofi:bak:last_onedrive',
};

// ─── Backup Format ────────────────────────────────────────────────────────────
const BACKUP_VERSION = 1;

export interface AppBackup {
  sofie_backup_version: number;
  exported_at: string;
  data: {
    orders: Order[];
    categories: CraftCategory[];
    profile: BusinessProfile;
  };
}

// ─── Collect / Apply ──────────────────────────────────────────────────────────
async function collectData(): Promise<AppBackup['data']> {
  const [orders, categories, profile] = await Promise.all([
    getLocalOrders(),
    getLocalCategories(),
    getLocalProfile(),
  ]);
  return { orders, categories, profile };
}

async function applyData(data: AppBackup['data']): Promise<void> {
  await Promise.all([
    saveLocalOrders(data.orders),
    saveLocalCategories(data.categories),
    saveLocalProfile(data.profile),
  ]);
}

function serialize(data: AppBackup['data']): string {
  const backup: AppBackup = {
    sofie_backup_version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    data,
  };
  return JSON.stringify(backup, null, 2);
}

function deserialize(json: string): AppBackup {
  const parsed = JSON.parse(json);
  if (!parsed.sofie_backup_version || !parsed.data?.orders) {
    throw new Error('This does not look like a valid Sofi Dream backup file.');
  }
  // Re-hydrate Date objects
  parsed.data.orders = (parsed.data.orders as any[]).map((o) => ({
    ...o,
    dueDate: new Date(o.dueDate),
    createdAt: new Date(o.createdAt),
    acceptedAt: o.acceptedAt ? new Date(o.acceptedAt) : undefined,
    shippedAt: o.shippedAt ? new Date(o.shippedAt) : undefined,
    deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
  }));
  return parsed as AppBackup;
}

// ─── Local Backup ─────────────────────────────────────────────────────────────

/** Serializes all data and shares the .json file via the system share sheet. */
export async function exportLocalBackup(): Promise<void> {
  const data = await collectData();
  const json = serialize(data);
  const date = new Date().toISOString().slice(0, 10);
  const path = `${FileSystem.documentDirectory}sofie-backup-${date}.json`;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await AsyncStorage.setItem(K.lastLocal, new Date().toISOString());
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Save Sofi Dream Backup',
    });
  }
}

/** Opens a file picker and restores data from a chosen .json backup. */
export async function importLocalBackup(): Promise<{ count: number }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) throw new Error('cancelled');
  const uri = result.assets[0].uri;
  const json = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const backup = deserialize(json);
  await applyData(backup.data);
  return { count: backup.data.orders.length };
}

export async function getLastLocalBackupDate(): Promise<string | null> {
  return AsyncStorage.getItem(K.lastLocal);
}

// ─── Google Drive ─────────────────────────────────────────────────────────────
// Uses the AppDataFolder scope — the app can only see its own files,
// users never see them in their Drive UI.

export async function saveGoogleSession(token: string, email: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(K.googleToken, token),
    AsyncStorage.setItem(K.googleUser, email),
  ]);
}

export async function getGoogleSession(): Promise<{ token: string; email: string } | null> {
  const [token, email] = await Promise.all([
    AsyncStorage.getItem(K.googleToken),
    AsyncStorage.getItem(K.googleUser),
  ]);
  if (!token || !email) return null;
  return { token, email };
}

export async function clearGoogleSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(K.googleToken),
    AsyncStorage.removeItem(K.googleUser),
    AsyncStorage.removeItem(K.gDriveFileId),
  ]);
}

/** Fetches Google user info to get the email address. */
export async function fetchGoogleUserInfo(token: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch Google account info');
  const info = await res.json();
  return (info.email as string) ?? 'Google account';
}

async function findGDriveFileId(token: string): Promise<string | null> {
  const cached = await AsyncStorage.getItem(K.gDriveFileId);
  if (cached) return cached;
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D'sofie-backup.json'&fields=files(id)",
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const id: string | undefined = json.files?.[0]?.id;
  if (id) await AsyncStorage.setItem(K.gDriveFileId, id);
  return id ?? null;
}

/** Backs up all app data to the Google Drive AppDataFolder. */
export async function backupToGoogleDrive(token: string): Promise<void> {
  const json = serialize(await collectData());
  const existingId = await findGDriveFileId(token);
  const boundary = 'sofie_multipart';
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify({ name: 'sofie-backup.json', parents: ['appDataFolder'] }),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    json,
    `--${boundary}--`,
  ].join('\r\n');

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const method = existingId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error?.message ?? 'Google Drive upload failed');
  }
  const result = await res.json();
  if (result.id) await AsyncStorage.setItem(K.gDriveFileId, result.id);
  await AsyncStorage.setItem(K.lastGDrive, new Date().toISOString());
}

/** Downloads and restores the backup from Google Drive. */
export async function restoreFromGoogleDrive(token: string): Promise<{ count: number }> {
  const fileId = await findGDriveFileId(token);
  if (!fileId) throw new Error('No backup found on Google Drive. Back up first.');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error('Failed to download backup from Google Drive');
  const backup = deserialize(await res.text());
  await applyData(backup.data);
  return { count: backup.data.orders.length };
}

export async function getLastGDriveDate(): Promise<string | null> {
  return AsyncStorage.getItem(K.lastGDrive);
}

// ─── Microsoft OneDrive ───────────────────────────────────────────────────────
// Uses the special AppFolder (Files.ReadWrite.AppFolder scope) —
// visible at OneDrive > Apps > Sofi Dream, not in user's regular files.

export async function saveMicrosoftSession(token: string, email: string): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(K.msToken, token),
    AsyncStorage.setItem(K.msUser, email),
  ]);
}

export async function getMicrosoftSession(): Promise<{ token: string; email: string } | null> {
  const [token, email] = await Promise.all([
    AsyncStorage.getItem(K.msToken),
    AsyncStorage.getItem(K.msUser),
  ]);
  if (!token || !email) return null;
  return { token, email };
}

export async function clearMicrosoftSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(K.msToken),
    AsyncStorage.removeItem(K.msUser),
  ]);
}

/** Fetches Microsoft user info to get the email address. */
export async function fetchMicrosoftUserInfo(token: string): Promise<string> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not fetch Microsoft account info');
  const info = await res.json();
  return (info.userPrincipalName ?? info.mail ?? 'Microsoft account') as string;
}

/** Backs up all app data to OneDrive AppFolder. */
export async function backupToOneDrive(token: string): Promise<void> {
  const json = serialize(await collectData());
  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/drive/special/approot:/sofie-backup.json:/content',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: json,
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error?.message ?? 'OneDrive upload failed');
  }
  await AsyncStorage.setItem(K.lastOneDrive, new Date().toISOString());
}

/** Downloads and restores the backup from OneDrive. */
export async function restoreFromOneDrive(token: string): Promise<{ count: number }> {
  const res = await fetch(
    'https://graph.microsoft.com/v1.0/me/drive/special/approot:/sofie-backup.json:/content',
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 404) throw new Error('No backup found on OneDrive. Back up first.');
  if (!res.ok) throw new Error('Failed to download backup from OneDrive');
  const backup = deserialize(await res.text());
  await applyData(backup.data);
  return { count: backup.data.orders.length };
}

export async function getLastOneDriveDate(): Promise<string | null> {
  return AsyncStorage.getItem(K.lastOneDrive);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatBackupDate(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
