import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../hooks/useNotifications';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import type { AppTheme } from '../../types';

// Design tokens — Stitch "Warm Artisan Editorial"
const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceHighest: '#E8E1DE',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  onPrimary: '#FFFFFF',
  tertiary: '#994530',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
  error: '#BA1A1A',
};

const THEMES: { label: string; value: AppTheme; bg: string; text: string; desc: string }[] = [
  { label: 'System Default', value: 'system', bg: '#888888', text: '#FFFFFF', desc: 'Follows device dark/light mode' },
  { label: 'Warm Cream', value: 'warm-cream', bg: '#FAF7F2', text: '#3D2B1F', desc: 'Default warm tone' },
  { label: 'Dark Walnut', value: 'dark-walnut', bg: '#2A1F17', text: '#F5EDE3', desc: 'Dark, rich brown' },
  { label: 'Soft Sage', value: 'soft-sage', bg: '#EAF0EA', text: '#2D402D', desc: 'Calm green' },
  { label: 'Lavender', value: 'lavender', bg: '#F0EAF8', text: '#3D2D52', desc: 'Gentle purple' },
];

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR', 'SEK', 'PLN'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, updatePrefs, testNotification } = useNotifications();
  const { profile, saveProfile } = useProfile();
  const { theme: activeTheme, setTheme: setGlobalTheme, colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [gstNumber, setGstNumber] = useState(profile.gstNumber ?? '');
  const [currency, setCurrency] = useState(profile.currency);
  const [theme, setTheme] = useState<AppTheme>(profile.theme);
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads from storage
  useEffect(() => {
    setName(profile.name);
    setTagline(profile.tagline ?? '');
    setAddress(profile.address ?? '');
    setGstNumber(profile.gstNumber ?? '');
    setCurrency(profile.currency);
    setTheme(profile.theme);
  }, [profile.name, profile.tagline, profile.address, profile.gstNumber, profile.currency, profile.theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        name: name.trim() || 'Sofi Dream',
        tagline: tagline.trim(),
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        currency,
        theme,
        timezone: profile.timezone,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSelect = async (t: AppTheme) => {
    setTheme(t);
    setGlobalTheme(t); // Apply instantly to entire app
    await saveProfile({ ...profile, theme: t });
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          <Text style={s.title}>Settings</Text>

          {/* Business Profile */}
          <Sec title="Business Profile" icon="🏪">
            <Lbl>Business Name</Lbl>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your business name" placeholderTextColor={T.outline} />
            <Lbl>Tagline</Lbl>
            <TextInput style={s.input} value={tagline} onChangeText={setTagline} placeholder="Handmade with love ✦" placeholderTextColor={T.outline} />
            <Lbl>Business Address (for invoices)</Lbl>
            <TextInput
              style={[s.input, s.multiline]}
              value={address}
              onChangeText={setAddress}
              placeholder="Street, City, Country"
              placeholderTextColor={T.outline}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Lbl>GST / Tax Number (optional)</Lbl>
            <TextInput style={s.input} value={gstNumber} onChangeText={setGstNumber} placeholder="e.g. 22AAAAA0000A1Z5" placeholderTextColor={T.outline} autoCapitalize="characters" />
            <Lbl>Default Currency</Lbl>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} keyboardShouldPersistTaps="always">
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c} style={[s.chip, currency === c && s.chipOn]} onPress={() => setCurrency(c)}>
                  <Text style={[s.chipTxt, currency === c && s.chipTxtOn]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </Sec>

          {/* App Theme */}
          <Sec title="App Theme" icon="🎨">
            <Text style={s.themeHint}>Tap to apply instantly — changes the whole app</Text>
            <View style={[s.themeGrid, isTablet && s.themeGridTablet]}>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[s.themeCard, isTablet && s.themeCardTablet, { backgroundColor: t.bg }, (theme === t.value || activeTheme === t.value) && s.themeCardOn]}
                  onPress={() => handleThemeSelect(t.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.themeLbl, { color: t.text }]}>{t.label}</Text>
                  <Text style={[s.themeDesc, { color: t.text, opacity: 0.6 }]}>{t.desc}</Text>
                  {(theme === t.value || activeTheme === t.value) && (
                    <Text style={[s.themeCheck, { color: t.text }]}>✓ Active</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Sec>

          {/* Notifications */}
          <Sec title="Notifications" icon="🔔">
            <SRow label="Enable Notifications" right={
              <Switch value={prefs.enabled} onValueChange={(v) => updatePrefs({ enabled: v })} trackColor={{ false: T.outlineVariant, true: T.primaryContainer }} thumbColor="#FFFFFF" />
            } />
            <SRow label="Daily Digest" right={
              <Switch value={prefs.dailyDigest.enabled} onValueChange={(v) => updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })} trackColor={{ false: T.outlineVariant, true: T.primaryContainer }} thumbColor="#FFFFFF" />
            } />
            <SRow label="Due Date Alerts" right={
              <Switch value={prefs.dueSoonAlerts.enabled} onValueChange={(v) => updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })} trackColor={{ false: T.outlineVariant, true: T.primaryContainer }} thumbColor="#FFFFFF" />
            } />
            <TouchableOpacity style={s.testBtn} onPress={testNotification}>
              <Text style={s.testTxt}>Send Test Notification</Text>
            </TouchableOpacity>
          </Sec>

          {/* Quick Links */}
          <Sec title="More" icon="⬡">
            <SRow label="Notification Preferences" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/notifications')} />
            <SRow label="Craft Categories" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/(tabs)/track')} />
            <SRow label="Reports & Export" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/reports')} />
            <SRow label="Data Backup" right={<Text style={s.arrow}>›</Text>} onPress={() => router.push('/backup')} />
          </Sec>

          {/* About */}
          <Sec title="About" icon="ℹ">
            <SRow label="Version" right={<Text style={s.meta}>1.0.0</Text>} />
            <SRow label="Made with" right={<Text style={s.meta}>✦ for Sofie</Text>} />
          </Sec>

          {/* Sign out */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity style={s.signOutBtn}>
              <Text style={s.signOutTxt}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Sec({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.secHeaderRow}>
        {icon && <Text style={s.secIcon}>{icon}</Text>}
        <Text style={s.secTitle}>{title}</Text>
      </View>
      {/* Tonal container for rows */}
      <View style={s.secCard}>
        {children}
      </View>
    </View>
  );
}
function Lbl({ children }: { children: string }) {
  return <Text style={s.lbl}>{children}</Text>;
}
function SRow({ label, right, onPress }: { label: string; right: React.ReactNode; onPress?: () => void }) {
  return (
    <TouchableOpacity style={s.sRow} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={s.sRowLbl}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  secHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  secIcon: {
    fontSize: 18,
    color: T.primary,
  },
  secTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  secCard: {
    backgroundColor: T.surfaceLow,
    borderRadius: 16,
    padding: 8,
    gap: 2,
  },
  lbl: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: T.subText,
    marginBottom: 5,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  input: {
    backgroundColor: T.surfaceLowest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: 'DMSans',
    fontSize: 15,
    color: T.text,
    marginBottom: 4,
  },
  multiline: {
    minHeight: 64,
    paddingTop: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: T.surfaceHighest,
    marginRight: 8,
  },
  chipOn: {
    backgroundColor: T.primary,
  },
  chipTxt: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
    color: T.subText,
  },
  chipTxtOn: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: T.primaryContainer,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  saveTxt: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  themeHint: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: T.subText,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeGridTablet: {
    gap: 12,
  },
  themeCard: {
    width: '47%',
    height: 80,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardTablet: {
    width: '23%',
    height: 90,
  },
  themeCardOn: {
    borderColor: T.primary,
  },
  themeLbl: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  themeDesc: {
    fontSize: 10,
    fontFamily: 'DMSans',
  },
  themeCheck: {
    fontSize: 11,
    fontFamily: 'DMSans',
  },
  sRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: T.surfaceLowest,
    borderRadius: 12,
    marginBottom: 2,
  },
  sRowLbl: {
    fontSize: 15,
    fontFamily: 'DMSans',
    color: T.text,
  },
  arrow: {
    fontSize: 22,
    color: T.subText,
  },
  meta: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: T.subText,
  },
  testBtn: {
    borderWidth: 1,
    borderColor: T.primaryContainer,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 4,
  },
  testTxt: {
    color: T.primary,
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: T.surfaceLow,
  },
  signOutTxt: {
    color: T.error,
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '600',
  },
});
