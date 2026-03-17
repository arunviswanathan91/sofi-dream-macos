/**
 * Data Backup screen.
 *
 * Three backup destinations:
 *   1. Local  — export .json to phone, import from file (no login needed)
 *   2. Google Drive — OAuth via expo-auth-session, stores in AppDataFolder
 *   3. Microsoft OneDrive — OAuth via expo-auth-session, stores in AppFolder
 *
 * OAuth client IDs must be set in .env:
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB        (Web OAuth 2.0 client, add sofi-dream://auth as redirect)
 *   EXPO_PUBLIC_MICROSOFT_CLIENT_ID         (Azure app registration client ID)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// FIX: Only import the main package — do NOT use 'expo-auth-session/providers/google'
// because Metro bundler does not reliably resolve package subpath exports in production.
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../context/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import {
  GOOGLE_CLIENT_ID_WEB, MICROSOFT_CLIENT_ID,
  exportLocalBackup, importLocalBackup, getLastLocalBackupDate,
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  fetchGoogleUserInfo, backupToGoogleDrive, restoreFromGoogleDrive, getLastGDriveDate,
  saveMicrosoftSession, getMicrosoftSession, clearMicrosoftSession,
  fetchMicrosoftUserInfo, backupToOneDrive, restoreFromOneDrive, getLastOneDriveDate,
  formatBackupDate,
} from '../../lib/backup';

// ─── OAuth Discovery Documents ────────────────────────────────────────────────
// Using constants instead of useAutoDiscovery to avoid network requests on mount.
const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const MS_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint:
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
  tokenEndpoint:
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BackupScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // FIX: maybeCompleteAuthSession must run inside a React lifecycle, not at module level
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const [lastLocal, setLastLocal] = useState<string | null>(null);
  const [lastGDrive, setLastGDrive] = useState<string | null>(null);
  const [lastOneDrive, setLastOneDrive] = useState<string | null>(null);
  const [busyLocal, setBusyLocal] = useState<'export' | 'import' | null>(null);

  useEffect(() => {
    (async () => {
      const [local, gdrive, onedrive] = await Promise.all([
        getLastLocalBackupDate(),
        getLastGDriveDate(),
        getLastOneDriveDate(),
      ]);
      setLastLocal(local);
      setLastGDrive(gdrive);
      setLastOneDrive(onedrive);
    })();
  }, []);

  const handleLocalExport = useCallback(async () => {
    setBusyLocal('export');
    try {
      await exportLocalBackup();
      setLastLocal(await getLastLocalBackupDate());
    } catch (e: any) {
      if (e.message !== 'cancelled') Alert.alert('Export failed', e.message);
    } finally {
      setBusyLocal(null);
    }
  }, []);

  const handleLocalImport = useCallback(async () => {
    Alert.alert(
      'Restore from file',
      'This will replace all current data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore', style: 'destructive',
          onPress: async () => {
            setBusyLocal('import');
            try {
              const { count } = await importLocalBackup();
              Alert.alert('Restored', `${count} orders loaded from backup.`);
            } catch (e: any) {
              if (e.message !== 'cancelled') Alert.alert('Restore failed', e.message);
            } finally {
              setBusyLocal(null);
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.bg }]}>
      <View style={[st.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Text style={[st.backTxt, { color: colors.subText }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>Data Backup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* ── Local Backup ───────────────────────────────────────────────── */}
        <Section label="LOCAL BACKUP" colors={colors}>
          <Text style={[st.sectionNote, { color: colors.subText }]}>
            Save a backup file to your phone. Restore it any time, or copy it
            to any cloud storage manually.
          </Text>
          <ActionRow icon="💾" title="Export to Phone"
            subtitle="Creates sofie-backup-YYYY-MM-DD.json"
            colors={colors} loading={busyLocal === 'export'}
            onPress={handleLocalExport} buttonLabel="Export" />
          <ActionRow icon="📂" title="Restore from File"
            subtitle="Pick a previously exported backup"
            colors={colors} loading={busyLocal === 'import'}
            onPress={handleLocalImport} buttonLabel="Restore" destructive />
          <LastBackupBadge label="Last local backup" date={lastLocal} colors={colors} />
        </Section>

        {/* ── Google Drive ────────────────────────────────────────────────── */}
        {/* FIX: GoogleSection is a separate component that owns its own hook.
            This prevents conditional hook call issues and isolates any OAuth crash. */}
        <GoogleSection
          colors={colors}
          lastGDrive={lastGDrive}
          onLastGDriveChange={setLastGDrive}
        />

        {/* ── Microsoft OneDrive ──────────────────────────────────────────── */}
        <OneDriveSection
          colors={colors}
          lastOneDrive={lastOneDrive}
          onLastOneDriveChange={setLastOneDrive}
        />

        <Text style={[st.privacyNote, { color: colors.subText }]}>
          Cloud backups use app-specific private folders. Google Drive stores
          files in AppDataFolder (not visible in Drive UI). OneDrive stores
          files in Apps/Sofi Dream. No other files are ever accessed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Google Drive section (owns its own useAuthRequest hook) ──────────────────
function GoogleSection({
  colors, lastGDrive, onLastGDriveChange,
}: { colors: ThemeColors; lastGDrive: string | null; onLastGDriveChange: (d: string | null) => void }) {
  const [googleUser, setGoogleUser] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);

  // FIX: memoize redirect URI so it's stable across renders
  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'sofi-dream', path: 'auth' }),
    [],
  );

  // FIX: pass null as discovery when not configured → request stays null, no crash
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID_WEB || 'unconfigured',
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.appdata'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    GOOGLE_CLIENT_ID_WEB ? GOOGLE_DISCOVERY : null,
  );

  useEffect(() => {
    getGoogleSession().then((s) => { if (s) setGoogleUser(s.email); });
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken ?? response.params?.access_token;
      if (!token) return;
      (async () => {
        try {
          const email = await fetchGoogleUserInfo(token);
          await saveGoogleSession(token, email);
          setGoogleUser(email);
        } catch {
          Alert.alert('Google Sign-in', 'Signed in but could not fetch account info.');
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-in failed', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  const handleBackup = useCallback(async () => {
    const session = await getGoogleSession();
    if (!session) return;
    setBusy('backup');
    try {
      await backupToGoogleDrive(session.token);
      const date = await getLastGDriveDate();
      onLastGDriveChange(date);
      Alert.alert('Backed up', 'Your data is saved to Google Drive.');
    } catch (e: any) { Alert.alert('Google Drive backup failed', e.message); }
    finally { setBusy(null); }
  }, [onLastGDriveChange]);

  const handleRestore = useCallback(async () => {
    const session = await getGoogleSession();
    if (!session) return;
    Alert.alert('Restore from Google Drive',
      'This will replace all current data with the Drive backup. Continue?',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Restore', style: 'destructive', onPress: async () => {
          setBusy('restore');
          try {
            const { count } = await restoreFromGoogleDrive(session.token);
            Alert.alert('Restored', `${count} orders loaded from Google Drive.`);
          } catch (e: any) { Alert.alert('Restore failed', e.message); }
          finally { setBusy(null); }
       }}]);
  }, []);

  const handleSignOut = useCallback(async () => {
    await clearGoogleSession(); setGoogleUser(null);
  }, []);

  return (
    <Section label="GOOGLE DRIVE" colors={colors}>
      {!GOOGLE_CLIENT_ID_WEB ? (
        <ConfigNote
          text="Set EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB in your .env to enable Google Drive backup. Create a Web OAuth 2.0 client in Google Cloud Console and add sofi-dream://auth as an authorised redirect URI."
          colors={colors}
        />
      ) : googleUser ? (
        <>
          <SignedInBadge email={googleUser} onSignOut={handleSignOut} colors={colors} />
          <ActionRow icon="☁️" title="Backup to Drive" subtitle="Saves to private AppDataFolder"
            colors={colors} loading={busy === 'backup'} onPress={handleBackup} buttonLabel="Backup" />
          <ActionRow icon="⬇️" title="Restore from Drive" subtitle="Overwrites current data"
            colors={colors} loading={busy === 'restore'} onPress={handleRestore}
            buttonLabel="Restore" destructive />
          <LastBackupBadge label="Last Drive backup" date={lastGDrive} colors={colors} />
        </>
      ) : (
        <SignInButton label="Sign in with Google" icon="G" iconColor="#EA4335"
          loading={!request} onPress={() => promptAsync()} colors={colors} />
      )}
    </Section>
  );
}

// ─── OneDrive section (owns its own useAuthRequest hook) ──────────────────────
function OneDriveSection({
  colors, lastOneDrive, onLastOneDriveChange,
}: { colors: ThemeColors; lastOneDrive: string | null; onLastOneDriveChange: (d: string | null) => void }) {
  const [msUser, setMsUser] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'sofi-dream', path: 'auth' }),
    [],
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MICROSOFT_CLIENT_ID || 'unconfigured',
      scopes: ['openid', 'profile', 'email', 'offline_access', 'files.readwrite.appfolder'],
      redirectUri,
      usePKCE: true,
    },
    MICROSOFT_CLIENT_ID ? MS_DISCOVERY : null,
  );

  useEffect(() => {
    getMicrosoftSession().then((s) => { if (s) setMsUser(s.email); });
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && request) {
      (async () => {
        try {
          const tokenRes = await AuthSession.exchangeCodeAsync(
            {
              clientId: MICROSOFT_CLIENT_ID,
              code: response.params.code,
              redirectUri,
              extraParams: { code_verifier: request.codeVerifier ?? '' },
            },
            MS_DISCOVERY,
          );
          const email = await fetchMicrosoftUserInfo(tokenRes.accessToken);
          await saveMicrosoftSession(tokenRes.accessToken, email);
          setMsUser(email);
        } catch (e: any) {
          Alert.alert('Microsoft Sign-in failed', e.message ?? 'Unknown error');
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('Microsoft Sign-in failed', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  const handleBackup = useCallback(async () => {
    const session = await getMicrosoftSession();
    if (!session) return;
    setBusy('backup');
    try {
      await backupToOneDrive(session.token);
      const date = await getLastOneDriveDate();
      onLastOneDriveChange(date);
      Alert.alert('Backed up', 'Your data is saved to OneDrive.');
    } catch (e: any) { Alert.alert('OneDrive backup failed', e.message); }
    finally { setBusy(null); }
  }, [onLastOneDriveChange]);

  const handleRestore = useCallback(async () => {
    const session = await getMicrosoftSession();
    if (!session) return;
    Alert.alert('Restore from OneDrive',
      'This will replace all current data with the OneDrive backup. Continue?',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Restore', style: 'destructive', onPress: async () => {
          setBusy('restore');
          try {
            const { count } = await restoreFromOneDrive(session.token);
            Alert.alert('Restored', `${count} orders loaded from OneDrive.`);
          } catch (e: any) { Alert.alert('Restore failed', e.message); }
          finally { setBusy(null); }
       }}]);
  }, []);

  const handleSignOut = useCallback(async () => {
    await clearMicrosoftSession(); setMsUser(null);
  }, []);

  return (
    <Section label="MICROSOFT ONEDRIVE" colors={colors}>
      {!MICROSOFT_CLIENT_ID ? (
        <ConfigNote
          text="Set EXPO_PUBLIC_MICROSOFT_CLIENT_ID in your .env to enable OneDrive backup. Register an app in Azure Portal and add sofi-dream://auth as a redirect URI."
          colors={colors}
        />
      ) : msUser ? (
        <>
          <SignedInBadge email={msUser} onSignOut={handleSignOut} colors={colors} />
          <ActionRow icon="☁️" title="Backup to OneDrive" subtitle="Saves to private AppFolder"
            colors={colors} loading={busy === 'backup'} onPress={handleBackup} buttonLabel="Backup" />
          <ActionRow icon="⬇️" title="Restore from OneDrive" subtitle="Overwrites current data"
            colors={colors} loading={busy === 'restore'} onPress={handleRestore}
            buttonLabel="Restore" destructive />
          <LastBackupBadge label="Last OneDrive backup" date={lastOneDrive} colors={colors} />
        </>
      ) : (
        <SignInButton label="Sign in with Microsoft" icon="M" iconColor="#00A4EF"
          loading={!request} onPress={() => promptAsync()} colors={colors} />
      )}
    </Section>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ label, children, colors }: { label: string; children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View style={st.section}>
      <Text style={[st.secLabel, { color: colors.subText }]}>{label}</Text>
      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

function ActionRow({ icon, title, subtitle, colors, loading, onPress, buttonLabel, destructive }: {
  icon: string; title: string; subtitle: string; colors: ThemeColors;
  loading: boolean; onPress: () => void; buttonLabel: string; destructive?: boolean;
}) {
  return (
    <View style={[st.actionRow, { borderBottomColor: colors.cardBorder }]}>
      <Text style={st.actionIcon}>{icon}</Text>
      <View style={st.actionText}>
        <Text style={[st.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[st.actionSub, { color: colors.subText }]}>{subtitle}</Text>
      </View>
      <TouchableOpacity onPress={onPress} disabled={loading}
        style={[st.actionBtn, { backgroundColor: destructive ? '#E07B6A' : Colors.rose }, loading && { opacity: 0.5 }]}>
        {loading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={st.actionBtnTxt}>{buttonLabel}</Text>}
      </TouchableOpacity>
    </View>
  );
}

function SignInButton({ label, icon, iconColor, loading, onPress, colors }: {
  label: string; icon: string; iconColor: string;
  loading: boolean; onPress: () => void; colors: ThemeColors;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading}
      style={[st.signInBtn, { borderColor: colors.cardBorder }]} activeOpacity={0.75}>
      <Text style={[st.signInIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={[st.signInLabel, { color: colors.text }]}>{label}</Text>
      {loading && <ActivityIndicator color={colors.subText} size="small" style={{ marginLeft: 8 }} />}
    </TouchableOpacity>
  );
}

function SignedInBadge({ email, onSignOut, colors }: { email: string; onSignOut: () => void; colors: ThemeColors }) {
  return (
    <View style={[st.signedRow, { borderBottomColor: colors.cardBorder }]}>
      <Text style={[st.checkmark, { color: Colors.sage }]}>✓</Text>
      <Text style={[st.signedEmail, { color: colors.text }]} numberOfLines={1}>{email}</Text>
      <TouchableOpacity onPress={onSignOut}>
        <Text style={[st.signOutTxt, { color: colors.subText }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

function LastBackupBadge({ label, date, colors }: { label: string; date: string | null; colors: ThemeColors }) {
  return (
    <Text style={[st.lastDate, { color: colors.subText }]}>
      {label}: {formatBackupDate(date)}
    </Text>
  );
}

function ConfigNote({ text, colors }: { text: string; colors: ThemeColors }) {
  return (
    <View style={[st.configNote, { backgroundColor: colors.bg }]}>
      <Text style={st.configNoteIcon}>⚙️</Text>
      <Text style={[st.configNoteTxt, { color: colors.subText }]}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backTxt: { fontSize: 14, fontFamily: 'DMSans' },
  title: { fontSize: 17, fontFamily: 'PlayfairDisplay', textAlign: 'center' },
  scroll: { paddingBottom: 48 },
  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  secLabel: { fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: '600', marginBottom: 8 },
  card: { borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionNote: { fontSize: 13, fontFamily: 'DMSans', lineHeight: 19, padding: Spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  actionIcon: { fontSize: 22, marginRight: 12 },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '600' },
  actionSub: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.sm, minWidth: 72, alignItems: 'center' },
  actionBtnTxt: { color: '#fff', fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  signInBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: Spacing.md, paddingVertical: 14, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1.5 },
  signInIcon: { fontSize: 18, fontWeight: '700', marginRight: 10, fontFamily: 'DMMono' },
  signInLabel: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '600' },
  signedRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  checkmark: { fontSize: 16, marginRight: 8 },
  signedEmail: { flex: 1, fontSize: 13, fontFamily: 'DMSans' },
  signOutTxt: { fontSize: 12, fontFamily: 'DMSans', textDecorationLine: 'underline' },
  lastDate: { fontSize: 11, fontFamily: 'DMMono', padding: Spacing.md, paddingTop: 8 },
  configNote: { flexDirection: 'row', alignItems: 'flex-start', margin: Spacing.md, padding: 12, borderRadius: BorderRadius.sm },
  configNoteIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
  configNoteTxt: { flex: 1, fontSize: 12, fontFamily: 'DMSans', lineHeight: 18 },
  privacyNote: { fontSize: 11, fontFamily: 'DMSans', lineHeight: 17, paddingHorizontal: Spacing.md, marginTop: Spacing.lg, textAlign: 'center' },
});
