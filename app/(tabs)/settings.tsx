import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNotifications } from '../../hooks/useNotifications';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import { DEFAULT_BUSINESS_PROFILE } from '../../types';
import type { BusinessProfile, AppTheme } from '../../types';

const THEMES: { label: string; value: AppTheme; preview: string }[] = [
  { label: 'Warm Cream', value: 'warm-cream', preview: '#FAF7F2' },
  { label: 'Dark Walnut', value: 'dark-walnut', preview: '#2A1F17' },
  { label: 'Soft Sage', value: 'soft-sage', preview: '#EAF0EA' },
  { label: 'Lavender', value: 'lavender', preview: '#F0EAF8' },
];

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'SEK', 'PLN'];

export default function SettingsScreen() {
  const router = useRouter();
  const { prefs, updatePrefs, testNotification } = useNotifications();

  const [businessName, setBusinessName] = useState('Sofi Dream');
  const [tagline, setTagline] = useState('Handmade with love ✦');
  const [currency, setCurrency] = useState('EUR');
  const [theme, setTheme] = useState<AppTheme>('warm-cream');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'profile'), {
        name: businessName,
        tagline,
        currency,
        theme,
      } as BusinessProfile);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({
    label,
    value,
    onPress,
    rightContent,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    rightContent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress && !rightContent}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {rightContent ?? (
        <Text style={styles.settingValue}>{value ?? ''}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Business Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Profile</Text>
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your business name"
              placeholderTextColor={Colors.muted}
            />
            <Text style={styles.inputLabel}>Tagline</Text>
            <TextInput
              style={styles.input}
              value={tagline}
              onChangeText={setTagline}
              placeholder="Your tagline"
              placeholderTextColor={Colors.muted}
            />
            <Text style={styles.inputLabel}>Currency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={saveProfile}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Theme</Text>
          <View style={styles.card}>
            <View style={styles.themeGrid}>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.themeOption,
                    { backgroundColor: t.preview },
                    theme === t.value && styles.themeOptionActive,
                  ]}
                  onPress={() => setTheme(t.value)}
                >
                  <Text style={styles.themeLabel}>{t.label}</Text>
                  {theme === t.value && <Text style={styles.themeCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Switch
                value={prefs.enabled}
                onValueChange={(v) => updatePrefs({ enabled: v })}
                trackColor={{ false: Colors.border, true: Colors.rose }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Daily Digest</Text>
              <Switch
                value={prefs.dailyDigest.enabled}
                onValueChange={(v) =>
                  updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })
                }
                trackColor={{ false: Colors.border, true: Colors.rose }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Weekly Summary</Text>
              <Switch
                value={prefs.weeklySummary.enabled}
                onValueChange={(v) =>
                  updatePrefs({ weeklySummary: { ...prefs.weeklySummary, enabled: v } })
                }
                trackColor={{ false: Colors.border, true: Colors.rose }}
                thumbColor={Colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Due Date Alerts</Text>
              <Switch
                value={prefs.dueSoonAlerts.enabled}
                onValueChange={(v) =>
                  updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })
                }
                trackColor={{ false: Colors.border, true: Colors.rose }}
                thumbColor={Colors.white}
              />
            </View>
            <TouchableOpacity style={styles.testButton} onPress={testNotification}>
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.card}>
            <SettingRow
              label="Notification Preferences"
              value="Configure alerts →"
              onPress={() => router.push('/notifications')}
            />
            <SettingRow
              label="Craft Categories"
              value="Manage categories →"
              onPress={() => router.push('/(tabs)/track')}
            />
            <SettingRow
              label="Reports & Export"
              value="View reports →"
              onPress={() => router.push('/reports')}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingRow label="App Version" value="1.0.0" />
            <SettingRow label="Made with" value="✦ for Sofie" />
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'DMSans',
    fontSize: 14,
    color: Colors.bark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  currencyChipActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  currencyText: {
    fontSize: 12,
    fontFamily: 'DMMono',
    color: Colors.muted,
  },
  currencyTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  themeOption: {
    width: '47%',
    height: 64,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    borderColor: Colors.rose,
  },
  themeLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.bark,
    fontWeight: '600',
  },
  themeCheck: {
    fontSize: 16,
    color: Colors.rose,
    alignSelf: 'flex-end',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.bark,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  testButton: {
    borderWidth: 1,
    borderColor: Colors.rose,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 4,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  testButtonText: {
    color: Colors.rose,
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: '600',
  },
});
