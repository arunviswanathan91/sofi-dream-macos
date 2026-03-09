import React, { useState } from 'react';
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
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useOrders } from '../../hooks/useOrders';
import { useCategories } from '../../hooks/useCategories';
import { TagChip } from '../../components/TagChip';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF'];
const PRESET_TAGS = ['rush', 'custom', 'gift', 'large', 'repeat customer', 'wholesale'];

export default function NewOrderScreen() {
  const router = useRouter();
  const { addOrder } = useOrders();
  const { categories } = useCategories();

  // Form state
  const [orderName, setOrderName] = useState('');
  const [description, setDescription] = useState('');
  const [craftCategory, setCraftCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [sourceLink, setSourceLink] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInstagram, setCustomerInstagram] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const [askingPrice, setAskingPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [isPaid, setIsPaid] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');

  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [dueDateText, setDueDateText] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Max photos', 'You can attach up to 5 photos.');
      return;
    }
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
    if (!isNaN(parsed.getTime())) {
      setDueDate(parsed);
    }
    setDueDateText(text);
  };

  const handleSave = async () => {
    if (!orderName.trim()) {
      Alert.alert('Required', 'Please enter an order name.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter a customer name.');
      return;
    }

    setSaving(true);
    try {
      const id = await addOrder({
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

      router.replace(`/order/${id}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save order. Please try again.');
      setSaving(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const Field = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
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
        <Text style={styles.headerTitle}>New Order</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          disabled={saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Order Details */}
        <Section title="Order Details">
          <Field label="Order Name *">
            <TextInput
              style={styles.input}
              value={orderName}
              onChangeText={setOrderName}
              placeholder="e.g. Floral Hoodie Set"
              placeholderTextColor={Colors.muted}
            />
          </Field>
          <Field label="Description">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the order details..."
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={3}
            />
          </Field>
          <Field label="Craft Category">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {categories.map((cat) => (
                <TagChip
                  key={cat.id}
                  label={`${cat.emoji} ${cat.name}`}
                  selected={craftCategory === cat.name}
                  onPress={() => setCraftCategory(cat.name === craftCategory ? '' : cat.name)}
                  color={craftCategory === cat.name ? cat.color : undefined}
                />
              ))}
            </ScrollView>
          </Field>
          <Field label="Tags">
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <TagChip
                  key={tag}
                  label={tag}
                  onRemove={() => setTags(tags.filter((t) => t !== tag))}
                />
              ))}
              {PRESET_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                <TagChip
                  key={tag}
                  label={`+ ${tag}`}
                  onPress={() => handleAddTag(tag)}
                />
              ))}
            </View>
            <View style={styles.customTagRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customTag}
                onChangeText={setCustomTag}
                placeholder="Custom tag..."
                placeholderTextColor={Colors.muted}
                onSubmitEditing={() => {
                  handleAddTag(customTag);
                  setCustomTag('');
                }}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={() => {
                  handleAddTag(customTag);
                  setCustomTag('');
                }}
              >
                <Text style={styles.addTagText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Field>
          <Field label={`Photos (${photos.length}/5)`}>
            <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
              <Text style={styles.photoButtonText}>
                {photos.length === 0 ? '📎 Attach photos' : `📎 ${photos.length} photo(s) attached — Add more`}
              </Text>
            </TouchableOpacity>
          </Field>
          <Field label="Source Link (optional)">
            <TextInput
              style={styles.input}
              value={sourceLink}
              onChangeText={setSourceLink}
              placeholder="Instagram/WhatsApp conversation link"
              placeholderTextColor={Colors.muted}
              autoCapitalize="none"
            />
          </Field>
        </Section>

        {/* Section 2: Customer */}
        <Section title="Customer Info">
          <Field label="Customer Name *">
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Emma Kowalski"
              placeholderTextColor={Colors.muted}
            />
          </Field>
          <Field label="Address">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Street, City, Country"
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={2}
            />
          </Field>
          <Field label="Phone (optional)">
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="+49 123 456789"
              placeholderTextColor={Colors.muted}
              keyboardType="phone-pad"
            />
          </Field>
          <Field label="Instagram (optional)">
            <TextInput
              style={styles.input}
              value={customerInstagram}
              onChangeText={setCustomerInstagram}
              placeholder="@username"
              placeholderTextColor={Colors.muted}
              autoCapitalize="none"
            />
          </Field>
          <Field label="Delivery Time">
            <TextInput
              style={styles.input}
              value={deliveryTime}
              onChangeText={setDeliveryTime}
              placeholder="e.g. 3:00 PM"
              placeholderTextColor={Colors.muted}
            />
          </Field>
        </Section>

        {/* Section 3: Financials */}
        <Section title="Financials">
          <Field label="Asking Price">
            <View style={styles.priceRow}>
              <View style={styles.currencySelector}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyOption, currency === c && styles.currencyOptionActive]}
                    onPress={() => setCurrency(c)}
                  >
                    <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={askingPrice}
                onChangeText={setAskingPrice}
                placeholder="65.00"
                placeholderTextColor={Colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </Field>
          <Field label="Payment Status">
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Paid</Text>
              <Switch
                value={isPaid}
                onValueChange={setIsPaid}
                trackColor={{ false: Colors.border, true: Colors.sage }}
                thumbColor={Colors.white}
              />
            </View>
          </Field>
          <Field label="Payment Notes (optional)">
            <TextInput
              style={styles.input}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              placeholder="Bank transfer, PayPal, etc."
              placeholderTextColor={Colors.muted}
            />
          </Field>
        </Section>

        {/* Section 4: Dates */}
        <Section title="Dates & Notes">
          <Field label="Due Date">
            <TextInput
              style={styles.input}
              value={dueDateText}
              onChangeText={parseDueDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.muted}
            />
            <Text style={styles.dueDatePreview}>
              Due: {format(dueDate, 'EEEE, MMMM d, yyyy')}
            </Text>
          </Field>
          <Field label="Internal Notes">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={internalNotes}
              onChangeText={setInternalNotes}
              placeholder="Private notes for yourself..."
              placeholderTextColor={Colors.muted}
              multiline
              numberOfLines={3}
            />
          </Field>
        </Section>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
  },
  saveButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  saveText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  formSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'DMSans',
    fontSize: 15,
    color: Colors.bark,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 0,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  chipRow: {
    maxHeight: 44,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addTagButton: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addTagText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  photoButtonText: {
    fontFamily: 'DMSans',
    fontSize: 14,
    color: Colors.rose,
  },
  priceRow: {
    gap: Spacing.sm,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  currencyOption: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.warmWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyOptionActive: {
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
  priceInput: {
    fontFamily: 'DMMono',
    fontSize: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.bark,
  },
  dueDatePreview: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.rose,
    marginTop: 6,
  },
});
