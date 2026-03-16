/**
 * Data Backup screen.
 *
 * Three backup destinations:
 *   1. Local — export .json to phone, import from file
 *   2. Google Drive — OAuth via expo-auth-session, stores in AppDataFolder
 *   3. Microsoft OneDrive — OAuth via expo-auth-session, stores in AppFolder
 *
 * OAuth client IDs must be set in .env:
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
 *   EXPO_PUBLIC_MICROSOFT_CLIENT_ID
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import {
  GOOGLE_CLIENT_ID_ANDROID, GOOGLE_CLIENT_ID_WEB, MICROSOFT_CLIENT_ID,
  exportLocalBackup, importLocalBackup, getLastLocalBackupDate,
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  fetchGoogleUserInfo, backupToGoogleDrive, restoreFromGoogleDrive, getLastGDriveDate,
  saveMicrosoftSession, getMicrosoftSession, clearMicrosoftSession,
  fetchMicrosoftUserInfo, backupToOneDrive, restoreFromOneDrive, getLastOneDriveDate,
  formatBackupDate,
} from '../../lib/backup';

// Required for expo-auth-session to close the browser after redirect
WebBrowser.maybeCompleteAuthSession();

// Microsoft identity platform endpoints
const MS_DISCOVERY = {
  authorizationEndpoint:
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
  tokenEndpoint:
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
};

export default function BackupScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // ─── Timestamps ────────────────────────────────────────────────────────────
  const [lastLocal, setLastLocal] = useState<string | null>(null);
  const [lastGDrive, setLastGDrive] = useState<string | null>(null);
  const [lastOneDrive, setLastOneDrive] = useState<string | null>(null);

  // ─── Loading / busy states ─────────────────────────────────────────────────
  const [busyLocal, setBusyLocal] = useState<'export' | 'import' | null>(null);
  const [busyGoogle, setBusyGoogle] = useState<'backup' | 'restore' | null>(null);
  const [busyMs, setBusyMs] = useState<'backup' | 'restore' | null>(null);

  // ─── Auth sessions ─────────────────────────────────────────────────────────
  const [googleUser, setGoogleUser] = useState<string | null>(null);
  const [msUser, setMsUser] = useState<string | null>(null);

  // ─── Google OAuth ──────────────────────────────────────────────────────────
  const [gRequest, gResponse, gPromptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CLIENT_ID_ANDROID || undefined,
    webClientId: GOOGLE_CLIENT_ID_WEB || undefined,
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.appdata',
    ],
  });

  // ─── Microsoft OAuth ───────────────────────────────────────────────────────
  const msRedirectUri = AuthSession.makeRedirectUri({ scheme: 'sofi-dream', path: 'auth' });
  const [msRequest, msResponse, msPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MICROSOFT_CLIENT_ID || 'UNCONFIGURED',
      scopes: ['openid', 'profile', 'email', 'offline_access', 'files.readwrite.appfolder'],
      redirectUri: msRedirectUri,
      usePKCE: true,
    },
    MS_DISCOVERY,
  );

  // ─── Initialise saved sessions ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [local, gdrive, onedrive, gsession, mssession] = await Promise.all([
        getLastLocalBackupDate(),
        getLastGDriveDate(),
        getLastOneDriveDate(),
        getGoogleSession(),
        getMicrosoftSession(),
      ]);
      setLastLocal(local);
      setLastGDrive(gdrive);
      setLastOneDrive(onedrive);
      if (gsession) setGoogleUser(gsession.email);
      if (mssession) setMsUser(mssession.email);
    })();
  }, []);

  // ─── Handle Google OAuth response ─────────────────────────────────────────
  useEffect(() => {
    if (gResponse?.type === 'success') {
      const token = gResponse.authentication?.accessToken;
      if (!token) return;
      (async () => {
        try {
          const email = await fetchGoogleUserInfo(token);
          await saveGoogleSession(token, email);
          setGoogleUser(email);
        } catch {
          Alert.alert('Google Sign-in', 'Signed in, but could not fetch account info.');
        }
      })();
    } else if (gResponse?.type === 'error') {
      Alert.alert('Google Sign-in failed', gResponse.error?.message ?? 'Unknown error');
    }
  }, [gResponse]);

  // ─── Handle Microsoft OAuth response ──────────────────────────────────────
  useEffect(() => {
    if (msResponse?.type === 'success' && msRequest) {
      (async () => {
        try {
          const tokenRes = await AuthSession.exchangeCodeAsync(
            {
              clientId: MICROSOFT_CLIENT_ID,
              code: msResponse.params.code,
              redirectUri: msRedirectUri,
              extraParams: { code_verifier: msRequest.codeVerifier ?? '' },
            },
            MS_DISCOVERY,
          );
          const token = tokenRes.accessToken;
          const email = await fetchMicrosoftUserInfo(token);
          await saveMicrosoftSession(token, email);
          setMsUser(email);
        } catch (e: any) {
          Alert.alert('Microsoft Sign-in failed', e.message ?? 'Unknown error');
        }
      })();
    } else if (msResponse?.type === 'error') {
      Alert.alert('Microsoft Sign-in failed', msResponse.error?.message ?? 'Unknown error');
    }
  }, [msResponse]);

  // ─── Local backup actions ──────────────────────────────────────────────────
  const handleLocalExport = useCallback(async () => {
    setBusyLocal('export');
    try {
      await exportLocalBackup();
      const date = await getLastLocalBackupDate();
      setLastLocal(date);
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
          text: 'Restore',
          style: 'destructive',
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

  // ─── Google Drive actions ──────────────────────────────────────────────────
  const handleGoogleBackup = useCallback(async () => {
    const session = await getGoogleSession();
    if (!session) return;
    setBusyGoogle('backup');
    try {
      await backupToGoogleDrive(session.token);
      const date = await getLastGDriveDate();
      setLastGDrive(date);
      Alert.alert('Backed up', 'Your data is saved to Google Drive.');
    } catch (e: any) {
      Alert.alert('Google Drive backup failed', e.message);
    } finally {
      setBusyGoogle(null);
    }
  }, []);

  const handleGoogleRestore = useCallback(async () => {
    const session = await getGoogleSession();
    if (!session) return;
    Alert.alert(
      'Restore from Google Drive',
      'This will replace all current data with the Drive backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBusyGoogle('restore');
            try {
              const { count } = await restoreFromGoogleDrive(session.token);
              Alert.alert('Restored', `${count} orders loaded from Google Drive.`);
            } catch (e: any) {
              Alert.alert('Restore failed', e.message);
            } finally {
              setBusyGoogle(null);
            }
          },
        },
      ],
    );
  }, []);

  const handleGoogleSignOut = useCallback(async () => {
    await clearGoogleSession();
    setGoogleUser(null);
  }, []);

  // ─── OneDrive actions ──────────────────────────────────────────────────────
  const handleMsBackup = useCallback(async () => {
    const session = await getMicrosoftSession();
    if (!session) return;
    setBusyMs('backup');
    try {
      await backupToOneDrive(session.token);
      const date = await getLastOneDriveDate();
      setLastOneDrive(date);
      Alert.alert('Backed up', 'Your data is saved to OneDrive.');
    } catch (e: any) {
      Alert.alert('OneDrive backup failed', e.message);
    } finally {
      setBusyMs(null);
    }
  }, []);

  const handleMsRestore = useCallback(async () => {
    const session = await getMicrosoftSession();
    if (!session) return;
    Alert.alert(
      'Restore from OneDrive',
      'This will replace all current data with the OneDrive backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBusyMs('restore');
            try {
              const { count } = await restoreFromOneDrive(session.token);
              Alert.alert('Restored', `${count} orders loaded from OneDrive.`);
            } catch (e: any) {
              Alert.alert('Restore failed', e.message);
            } finally {
              setBusyMs(null);
            }
          },
        },
      ],
    );
  }, []);

  const handleMsSignOut = useCallback(async () => {
    await clearMicrosoftSession();
    setMsUser(null);
  }, []);

  const googleConfigured = !!GOOGLE_CLIENT_ID_ANDROID;
  const msConfigured = !!MICROSOFT_CLIENT_ID;

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[st.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn}>
          <Text style={[st.backTxt, { color: colors.subText }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[st.title, { color: colors.text }]}>Data Backup</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        {/* ── Local Backup ─────────────────────────────────────────────── */}
        <Section label="LOCAL BACKUP" colors={colors}>
          <Text style={[st.sectionNote, { color: colors.subText }]}>
            Save a backup file to your phone. You can restore it later or move
            it to any cloud storage manually.
          </Text>

          <ActionRow
            icon="💾"
            title="Export to Phone"
            subtitle="Creates sofie-backup-YYYY-MM-DD.json"
            colors={colors}
            loading={busyLocal === 'export'}
            onPress={handleLocalExport}
            buttonLabel="Export"
          />
          <ActionRow
            icon="📂"
            title="Restore from File"
            subtitle="Pick a previously exported backup"
            colors={colors}
            loading={busyLocal === 'import'}
            onPress={handleLocalImport}
            buttonLabel="Restore"
            destructive
          />
          <LastBackupBadge label="Last local backup" date={lastLocal} colors={colors} />
        </Section>

        {/* ── Google Drive ──────────────────────────────────────────────── */}
        <Section label="GOOGLE DRIVE" colors={colors}>
          {!googleConfigured ? (
            <ConfigNote
              text="Add EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID and EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB to your .env file to enable Google Drive backup."
              colors={colors}
            />
          ) : googleUser ? (
            <>
              <SignedInBadge email={googleUser} onSignOut={handleGoogleSignOut} colors={colors} />
              <ActionRow
                icon="☁️"
                title="Backup to Drive"
                subtitle="Saves to private AppDataFolder"
                colors={colors}
                loading={busyGoogle === 'backup'}
                onPress={handleGoogleBackup}
                buttonLabel="Backup"
              />
              <ActionRow
                icon="⬇️"
                title="Restore from Drive"
                subtitle="Overwrites current data"
                colors={colors}
                loading={busyGoogle === 'restore'}
                onPress={handleGoogleRestore}
                buttonLabel="Restore"
                destructive
              />
              <LastBackupBadge label="Last Drive backup" date={lastGDrive} colors={colors} />
            </>
          ) : (
            <SignInButton
              label="Sign in with Google"
              icon="G"
              iconColor="#EA4335"
              loading={!gRequest}
              onPress={() => gPromptAsync()}
              colors={colors}
            />
          )}
        </Section>

        {/* ── Microsoft OneDrive ────────────────────────────────────────── */}
        <Section label="MICROSOFT ONEDRIVE" colors={colors}>
          {!msConfigured ? (
            <ConfigNote
              text="Add EXPO_PUBLIC_MICROSOFT_CLIENT_ID to your .env file to enable OneDrive backup."
              colors={colors}
            />
          ) : msUser ? (
            <>
              <SignedInBadge email={msUser} onSignOut={handleMsSignOut} colors={colors} />
              <ActionRow
                icon="☁️"
                title="Backup to OneDrive"
                subtitle="Saves to private AppFolder"
                colors={colors}
                loading={busyMs === 'backup'}
                onPress={handleMsBackup}
                buttonLabel="Backup"
              />
              <ActionRow
                icon="⬇️"
                title="Restore from OneDrive"
                subtitle="Overwrites current data"
                colors={colors}
                loading={busyMs === 'restore'}
                onPress={handleMsRestore}
                buttonLabel="Restore"
                destructive
              />
              <LastBackupBadge label="Last OneDrive backup" date={lastOneDrive} colors={colors} />
            </>
          ) : (
            <SignInButton
              label="Sign in with Microsoft"
              icon="M"
              iconColor="#00A4EF"
              loading={!msRequest}
              onPress={() => msPromptAsync()}
              colors={colors}
            />
          )}
        </Section>

        {/* ── Privacy note ──────────────────────────────────────────────── */}
        <Text style={[st.privacyNote, { color: colors.subText }]}>
          Cloud backups use app-specific private folders. Google Drive stores
          files in AppDataFolder (invisible to users in Drive UI). OneDrive
          stores files in Apps/Sofi Dream. No other files are accessed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  label, children, colors,
}: { label: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={st.section}>
      <Text style={[st.secLabel, { color: colors.subText }]}>{label}</Text>
      <View style={[st.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {children}
      </View>
    </View>
  );
}

function ActionRow({
  icon, title, subtitle, colors, loading, onPress, buttonLabel, destructive,
}: {
  icon: string; title: string; subtitle: string; colors: any;
  loading: boolean; onPress: () => void; buttonLabel: string; destructive?: boolean;
}) {
  return (
    <View style={[st.actionRow, { borderBottomColor: colors.cardBorder }]}>
      <Text style={st.actionIcon}>{icon}</Text>
      <View style={st.actionText}>
        <Text style={[st.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[st.actionSub, { color: colors.subText }]}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        style={[
          st.actionBtn,
          { backgroundColor: destructive ? '#E07B6A' : Colors.rose },
          loading && { opacity: 0.5 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={st.actionBtnTxt}>{buttonLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SignInButton({
  label, icon, iconColor, loading, onPress, colors,
}: {
  label: string; icon: string; iconColor: string;
  loading: boolean; onPress: () => void; colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[st.signInBtn, { borderColor: colors.cardBorder }]}
      activeOpacity={0.75}
    >
      <Text style={[st.signInIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={[st.signInLabel, { color: colors.text }]}>{label}</Text>
      {loading && <ActivityIndicator color={colors.subText} size="small" style={{ marginLeft: 8 }} />}
    </TouchableOpacity>
  );
}

function SignedInBadge({
  email, onSignOut, colors,
}: { email: string; onSignOut: () => void; colors: any }) {
  return (
    <View style={[st.signedRow, { borderBottomColor: colors.cardBorder }]}>
      <Text style={[st.checkmark, { color: Colors.sage }]}>✓</Text>
      <Text style={[st.signedEmail, { color: colors.text }]} numberOfLines={1}>
        {email}
      </Text>
      <TouchableOpacity onPress={onSignOut}>
        <Text style={[st.signOutTxt, { color: colors.subText }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

function LastBackupBadge({
  label, date, colors,
}: { label: string; date: string | null; colors: any }) {
  return (
    <Text style={[st.lastDate, { color: colors.subText }]}>
      {label}: {formatBackupDate(date)}
    </Text>
  );
}

function ConfigNote({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={[st.configNote, { backgroundColor: colors.bg }]}>
      <Text style={[st.configNoteIcon]}>⚙️</Text>
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
  secLabel: {
    fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase',
    letterSpacing: 1.4, fontWeight: '600', marginBottom: 8,
  },
  card: {
    borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionNote: { fontSize: 13, fontFamily: 'DMSans', lineHeight: 19, padding: Spacing.md },
  // Action row
  actionRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: { fontSize: 22, marginRight: 12 },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '600' },
  actionSub: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.sm,
    minWidth: 72, alignItems: 'center',
  },
  actionBtnTxt: { color: '#fff', fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  // Sign-in button
  signInBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: Spacing.md, paddingVertical: 14, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm, borderWidth: 1.5,
  },
  signInIcon: { fontSize: 18, fontWeight: '700', marginRight: 10, fontFamily: 'DMMono' },
  signInLabel: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '600' },
  // Signed-in badge
  signedRow: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkmark: { fontSize: 16, marginRight: 8 },
  signedEmail: { flex: 1, fontSize: 13, fontFamily: 'DMSans' },
  signOutTxt: { fontSize: 12, fontFamily: 'DMSans', textDecorationLine: 'underline' },
  // Last backup date
  lastDate: {
    fontSize: 11, fontFamily: 'DMMono', padding: Spacing.md, paddingTop: 8,
  },
  // Config note
  configNote: {
    flexDirection: 'row', alignItems: 'flex-start', margin: Spacing.md,
    padding: 12, borderRadius: BorderRadius.sm,
  },
  configNoteIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
  configNoteTxt: { flex: 1, fontSize: 12, fontFamily: 'DMSans', lineHeight: 18 },
  // Privacy note
  privacyNote: {
    fontSize: 11, fontFamily: 'DMSans', lineHeight: 17,
    paddingHorizontal: Spacing.md, marginTop: Spacing.lg, textAlign: 'center',
  },
});
