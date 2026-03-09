import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useOrders } from '../../../hooks/useOrders';
import { useCategories } from '../../../hooks/useCategories';
import { TagChip } from '../../../components/TagChip';
import { Colors, Spacing, BorderRadius } from '../../../lib/theme';

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF'];
const PRESET_TAGS = ['rush', 'custom', 'gift', 'large', 'repeat customer', 'wholesale'];

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { orders, updateOrder } = useOrders();
  const { categories } = useCategories();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const [orderName, setOrderName] = useState(order?.orderName ?? '');
  const [description, setDescription] = useState(order?.description ?? '');
  const [craftCategory, setCraftCategory] = useState(order?.craftCategory ?? '');
  const [tags, setTags] = useState<string[]>(order?.tags ?? []);
  const [customTag, setCustomTag] = useState('');
  const [photos, setPhotos] = useState<string[]>(order?.photos ?? []);
  const [sourceLink, setSourceLink] = useState(order?.sourceLink ?? '');

  const [customerName, setCustomerName] = useState(order?.customerName ?? '');
  const [customerAddress, setCustomerAddress] = useState(order?.customerAddress ?? '');
  const [customerPhone, setCustomerPhone] = useState(order?.customerPhone ?? '');
  const [customerInstagram, setCustomerInstagram] = useState(order?.customerInstagram ?? '');
  const [deliveryTime, setDeliveryTime] = useState(order?.deliveryTime ?? '');

  const [askingPrice, setAskingPrice] = useState(order?.askingPrice.toString() ?? '');
  const [currency, setCurrency] = useState(order?.currency ?? 'EUR');
  const [isPaid, setIsPaid] = useState(order?.isPaid ?? false);
  const [paymentNotes, setPaymentNotes] = useState(order?.paymentNotes ?? '');

  const [dueDate, setDueDate] = useState<Date>(order ? new Date(order.dueDate) : new Date());
  const [dueDateText, setDueDateText] = useState(
    order ? format(new Date(order.dueDate), 'yyyy-MM-dd') : ''
  );
  const [internalNotes, setInternalNotes] = useState(order?.internalNotes ?? '');
  const [saving, setSaving] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Order not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const parseDueDate = (text: string) => {
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) setDueDate(parsed);
    setDueDateText(text);
  };

  const handleSave = async () => {
    if (!orderName.trim()) {
      Alert.alert('Required', 'Please enter an order name.');
      return;
    }
    setSaving(true);
    try {
      await updateOrder(order.id, {
        orderName: orderName.trim(),
        description: description.trim(),
        craftCategory: craftCategory.trim(),
        tags,
        photos,
        sourceLink: sourceLink.trim() || undefined,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        deliveryTime: deliveryTime.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerInstagram: customerInstagram.trim() || undefined,
        askingPrice: parseFloat(askingPrice) || 0,
        currency,
        isPaid,
        paymentNotes: paymentNotes.trim() || undefined,
        dueDate,
        internalNotes: internalNotes.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Order</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Field label="Order Name *">
            <TextInput style={styles.input} value={orderName} onChangeText={setOrderName} placeholderTextColor={Colors.muted} />
          </Field>
          <Field label="Description">
            <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholderTextColor={Colors.muted} />
          </Field>
          <Field label="Craft Category">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map((cat) => (
                <TagChip key={cat.id} label={`${cat.emoji} ${cat.name}`} selected={craftCategory === cat.name} onPress={() => setCraftCategory(cat.name === craftCategory ? '' : cat.name)} color={craftCategory === cat.name ? cat.color : undefined} />
              ))}
            </ScrollView>
          </Field>
          <Field label="Tags">
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TagChip key={tag} label={tag} onRemove={() => setTags(tags.filter((t) => t !== tag))} />
              ))}
            </View>
            <View style={styles.customTagRow}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={customTag} onChangeText={setCustomTag} placeholder="Custom tag..." placeholderTextColor={Colors.muted} onSubmitEditing={() => { handleAddTag(customTag); setCustomTag(''); }} />
              <TouchableOpacity style={styles.addTagButton} onPress={() => { handleAddTag(customTag); setCustomTag(''); }}>
                <Text style={styles.addTagText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Field>
          <Field label={`Photos (${photos.length}/5)`}>
            <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
              <Text style={styles.photoButtonText}>📎 {photos.length} photo(s) — Tap to add</Text>
            </TouchableOpacity>
          </Field>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Customer Info</Text>
          <Field label="Customer Name *">
            <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholderTextColor={Colors.muted} />
          </Field>
          <Field label="Address">
            <TextInput style={[styles.input, styles.multiline]} value={customerAddress} onChangeText={setCustomerAddress} multiline numberOfLines={2} placeholderTextColor={Colors.muted} />
          </Field>
          <Field label="Phone">
            <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholderTextColor={Colors.muted} />
          </Field>
          <Field label="Instagram">
            <TextInput style={styles.input} value={customerInstagram} onChangeText={setCustomerInstagram} autoCapitalize="none" placeholderTextColor={Colors.muted} />
          </Field>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Financials</Text>
          <Field label="Price">
            <View style={styles.priceRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.currencyOption, currency === c && styles.currencyOptionActive]} onPress={() => setCurrency(c)}>
                  <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { fontFamily: 'DMMono', fontSize: 20 }]} value={askingPrice} onChangeText={setAskingPrice} keyboardType="decimal-pad" placeholderTextColor={Colors.muted} />
          </Field>
          <Field label="Payment Status">
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Paid</Text>
              <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ false: Colors.border, true: Colors.sage }} thumbColor={Colors.white} />
            </View>
          </Field>
          <Field label="Payment Notes">
            <TextInput style={styles.input} value={paymentNotes} onChangeText={setPaymentNotes} placeholderTextColor={Colors.muted} />
          </Field>
        </View>

        <View style={[styles.formSection, { borderBottomWidth: 0 }]}>
          <Text style={styles.sectionTitle}>Dates & Notes</Text>
          <Field label="Due Date (YYYY-MM-DD)">
            <TextInput style={styles.input} value={dueDateText} onChangeText={parseDueDate} placeholderTextColor={Colors.muted} />
            <Text style={styles.dueDatePreview}>Due: {format(dueDate, 'EEEE, MMMM d, yyyy')}</Text>
          </Field>
          <Field label="Internal Notes">
            <TextInput style={[styles.input, styles.multiline]} value={internalNotes} onChangeText={setInternalNotes} multiline numberOfLines={3} placeholderTextColor={Colors.muted} />
          </Field>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: 4 },
  backText: { fontSize: 14, fontFamily: 'DMSans', color: Colors.muted },
  headerTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', color: Colors.bark },
  saveButton: { backgroundColor: Colors.rose, borderRadius: BorderRadius.full, paddingHorizontal: 18, paddingVertical: 7 },
  saveText: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  formSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', color: Colors.bark, marginBottom: Spacing.md },
  field: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  input: { backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, fontFamily: 'DMSans', fontSize: 15, color: Colors.bark, borderWidth: 1, borderColor: Colors.border },
  multiline: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
  chipRow: { maxHeight: 44 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.sm },
  customTagRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  addTagButton: { backgroundColor: Colors.rose, borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 10 },
  addTagText: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '600' },
  photoButton: { backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center' },
  photoButtonText: { fontFamily: 'DMSans', fontSize: 14, color: Colors.rose },
  priceRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  currencyOption: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full, backgroundColor: Colors.warmWhite, borderWidth: 1, borderColor: Colors.border },
  currencyOptionActive: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  currencyText: { fontSize: 12, fontFamily: 'DMMono', color: Colors.muted },
  currencyTextActive: { color: Colors.white, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  toggleLabel: { fontSize: 14, fontFamily: 'DMSans', color: Colors.bark },
  dueDatePreview: { fontSize: 12, fontFamily: 'DMSans', color: Colors.rose, marginTop: 6 },
});
