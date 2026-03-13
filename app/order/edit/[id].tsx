import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useOrders } from '../../../hooks/useOrders';
import { useCategories } from '../../../hooks/useCategories';
import { useTheme } from '../../../context/ThemeContext';
import { TagChip } from '../../../components/TagChip';
import { Colors, Spacing, BorderRadius } from '../../../lib/theme';

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR'];
const PRESET_TAGS = ['rush', 'custom', 'gift', 'large', 'repeat customer', 'wholesale'];

interface FormState {
  orderName: string;
  description: string;
  craftCategory: string;
  tags: string[];
  customTag: string;
  photos: string[];
  sourceLink: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerInstagram: string;
  deliveryTime: string;
  askingPrice: string;
  currency: string;
  isPaid: boolean;
  paymentNotes: string;
  dueDate: Date;
  dueDateText: string;
  internalNotes: string;
}

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders, updateOrder } = useOrders();
  const { categories } = useCategories();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const [form, setFormState] = useState<FormState>(() => ({
    orderName: order?.orderName ?? '',
    description: order?.description ?? '',
    craftCategory: order?.craftCategory ?? '',
    tags: order?.tags ?? [],
    customTag: '',
    photos: order?.photos ?? [],
    sourceLink: order?.sourceLink ?? '',
    customerName: order?.customerName ?? '',
    customerAddress: order?.customerAddress ?? '',
    customerPhone: order?.customerPhone ?? '',
    customerInstagram: order?.customerInstagram ?? '',
    deliveryTime: order?.deliveryTime ?? '',
    askingPrice: order?.askingPrice.toString() ?? '',
    currency: order?.currency ?? 'EUR',
    isPaid: order?.isPaid ?? false,
    paymentNotes: order?.paymentNotes ?? '',
    dueDate: order ? new Date(order.dueDate) : new Date(),
    dueDateText: order ? format(new Date(order.dueDate), 'yyyy-MM-dd') : '',
    internalNotes: order?.internalNotes ?? '',
  }));

  const [saving, setSaving] = useState(false);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setFormState((p) => ({ ...p, [key]: val }));
  }, []);

  // Re-sync if order loads asynchronously
  useEffect(() => {
    if (order) {
      setFormState({
        orderName: order.orderName,
        description: order.description ?? '',
        craftCategory: order.craftCategory ?? '',
        tags: order.tags ?? [],
        customTag: '',
        photos: order.photos ?? [],
        sourceLink: order.sourceLink ?? '',
        customerName: order.customerName,
        customerAddress: order.customerAddress ?? '',
        customerPhone: order.customerPhone ?? '',
        customerInstagram: order.customerInstagram ?? '',
        deliveryTime: order.deliveryTime ?? '',
        askingPrice: order.askingPrice.toString(),
        currency: order.currency,
        isPaid: order.isPaid ?? false,
        paymentNotes: order.paymentNotes ?? '',
        dueDate: new Date(order.dueDate),
        dueDateText: format(new Date(order.dueDate), 'yyyy-MM-dd'),
        internalNotes: order.internalNotes ?? '',
      });
    }
  // Only run once when order first becomes available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.notFound, { color: colors.subText }]}>Order not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
  };

  const handlePickPhoto = async () => {
    if (form.photos.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      set('photos', [...form.photos, result.assets[0].uri]);
    }
  };

  const parseDueDate = (text: string) => {
    set('dueDateText', text);
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) set('dueDate', parsed);
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!form.orderName.trim()) {
      Alert.alert('Required', 'Please enter an order name.');
      return;
    }
    setSaving(true);
    try {
      await updateOrder(order.id, {
        orderName: form.orderName.trim(),
        description: form.description.trim(),
        craftCategory: form.craftCategory.trim(),
        tags: form.tags,
        photos: form.photos,
        sourceLink: form.sourceLink.trim() || undefined,
        customerName: form.customerName.trim(),
        customerAddress: form.customerAddress.trim(),
        deliveryTime: form.deliveryTime.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        customerInstagram: form.customerInstagram.trim() || undefined,
        askingPrice: parseFloat(form.askingPrice) || 0,
        currency: form.currency,
        isPaid: form.isPaid,
        paymentNotes: form.paymentNotes.trim() || undefined,
        dueDate: form.dueDate,
        internalNotes: form.internalNotes.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.subText }]}>{label}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.subText }]}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Order</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View style={[styles.formSection, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Details</Text>
            <Field label="Order Name *">
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.orderName}
                onChangeText={(v) => set('orderName', v)}
                placeholderTextColor={colors.subText}
                placeholder="e.g. Floral hoop for Anna"
              />
            </Field>
            <Field label="Description">
              <TextInput
                style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.description}
                onChangeText={(v) => set('description', v)}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.subText}
              />
            </Field>
            <Field label="Craft Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} keyboardShouldPersistTaps="always">
                {categories.map((cat) => (
                  <TagChip
                    key={cat.id}
                    label={`${cat.emoji} ${cat.name}`}
                    selected={form.craftCategory === cat.name}
                    onPress={() => set('craftCategory', form.craftCategory === cat.name ? '' : cat.name)}
                    color={form.craftCategory === cat.name ? cat.color : undefined}
                  />
                ))}
              </ScrollView>
            </Field>
            <Field label="Tags">
              <View style={styles.tagsContainer}>
                {form.tags.map((tag) => (
                  <TagChip
                    key={tag}
                    label={tag}
                    onRemove={() => set('tags', form.tags.filter((t) => t !== tag))}
                  />
                ))}
              </View>
              <View style={styles.customTagRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                  value={form.customTag}
                  onChangeText={(v) => set('customTag', v)}
                  placeholder="Custom tag..."
                  placeholderTextColor={colors.subText}
                  onSubmitEditing={() => {
                    handleAddTag(form.customTag);
                    set('customTag', '');
                  }}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={() => { handleAddTag(form.customTag); set('customTag', ''); }}
                >
                  <Text style={styles.addTagText}>Add</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} keyboardShouldPersistTaps="always">
                {PRESET_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
                  <TagChip key={t} label={t} onPress={() => handleAddTag(t)} />
                ))}
              </ScrollView>
            </Field>
            <Field label={`Photos (${form.photos.length}/5)`}>
              <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={handlePickPhoto}>
                <Text style={styles.photoButtonText}>📎 {form.photos.length} photo(s) — Tap to add</Text>
              </TouchableOpacity>
            </Field>
          </View>

          <View style={[styles.formSection, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer Info</Text>
            <Field label="Customer Name *">
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.customerName}
                onChangeText={(v) => set('customerName', v)}
                placeholderTextColor={colors.subText}
              />
            </Field>
            <Field label="Address">
              <TextInput
                style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.customerAddress}
                onChangeText={(v) => set('customerAddress', v)}
                multiline
                numberOfLines={2}
                placeholderTextColor={colors.subText}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.customerPhone}
                onChangeText={(v) => set('customerPhone', v)}
                keyboardType="phone-pad"
                placeholderTextColor={colors.subText}
              />
            </Field>
            <Field label="Instagram">
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.customerInstagram}
                onChangeText={(v) => set('customerInstagram', v)}
                autoCapitalize="none"
                placeholderTextColor={colors.subText}
              />
            </Field>
          </View>

          <View style={[styles.formSection, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Financials</Text>
            <Field label="Currency">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
                <View style={styles.priceRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.currencyOption, { backgroundColor: colors.card, borderColor: colors.cardBorder }, form.currency === c && styles.currencyOptionActive]}
                      onPress={() => set('currency', c)}
                    >
                      <Text style={[styles.currencyText, { color: colors.subText }, form.currency === c && styles.currencyTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Field>
            <Field label="Asking Price">
              <TextInput
                style={[styles.input, { fontFamily: 'DMMono', fontSize: 20, backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.askingPrice}
                onChangeText={(v) => set('askingPrice', v)}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.subText}
                placeholder="0.00"
              />
            </Field>
            <Field label="Payment Status">
              <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Paid</Text>
                <Switch
                  value={form.isPaid}
                  onValueChange={(v) => set('isPaid', v)}
                  trackColor={{ false: Colors.border, true: Colors.sage }}
                  thumbColor={Colors.white}
                />
              </View>
            </Field>
            <Field label="Payment Notes">
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.paymentNotes}
                onChangeText={(v) => set('paymentNotes', v)}
                placeholderTextColor={colors.subText}
              />
            </Field>
          </View>

          <View style={[styles.formSection, { borderBottomWidth: 0 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dates & Notes</Text>
            <Field label="Due Date (YYYY-MM-DD)">
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.dueDateText}
                onChangeText={parseDueDate}
                placeholderTextColor={colors.subText}
                placeholder="2025-12-31"
              />
              <Text style={styles.dueDatePreview}>
                Due: {format(form.dueDate, 'EEEE, MMMM d, yyyy')}
              </Text>
            </Field>
            <Field label="Internal Notes">
              <TextInput
                style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
                value={form.internalNotes}
                onChangeText={(v) => set('internalNotes', v)}
                multiline
                numberOfLines={3}
                placeholderTextColor={colors.subText}
              />
            </Field>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky bottom save button — always visible above Android nav bar */}
      <View style={[styles.stickyBar, { backgroundColor: colors.bg, borderTopColor: colors.cardBorder, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.stickySaveBtn, saving && { opacity: 0.5 }]}
          disabled={saving}
        >
          <Text style={styles.stickySaveTxt}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { fontFamily: 'DMSans', textAlign: 'center', marginTop: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 14, fontFamily: 'DMSans' },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay' },
  saveButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  saveText: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  formSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    marginBottom: Spacing.md,
  },
  field: { marginBottom: Spacing.md },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'DMSans',
    fontSize: 15,
    borderWidth: 1,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
  chipRow: { maxHeight: 44 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.sm },
  customTagRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  addTagButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addTagText: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
  photoButton: {
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  photoButtonText: { fontFamily: 'DMSans', fontSize: 14, color: Colors.rose },
  priceRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  currencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  currencyOptionActive: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  currencyText: { fontSize: 12, fontFamily: 'DMMono' },
  currencyTextActive: { color: Colors.white, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
  },
  toggleLabel: { fontSize: 14, fontFamily: 'DMSans' },
  dueDatePreview: { fontSize: 12, fontFamily: 'DMSans', color: Colors.rose, marginTop: 6 },
  stickyBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, paddingTop: 10 },
  stickySaveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  stickySaveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
