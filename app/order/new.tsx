import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { format, addDays } from 'date-fns';
import { useOrders } from '../../hooks/useOrders';
import { useCategories } from '../../hooks/useCategories';
import { useTheme } from '../../context/ThemeContext';
import { TagChip } from '../../components/TagChip';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR'];
const PRESET_TAGS = ['rush', 'custom', 'gift', 'large', 'repeat customer'];

interface FormState {
  orderName: string; description: string; craftCategory: string;
  tags: string[]; photos: string[]; sourceLink: string;
  customerName: string; customerAddress: string; customerPhone: string;
  customerInstagram: string; deliveryTime: string; askingPrice: string;
  currency: string; isPaid: boolean; paymentNotes: string;
  dueDateText: string; internalNotes: string;
}

const INITIAL: FormState = {
  orderName: '', description: '', craftCategory: '', tags: [], photos: [],
  sourceLink: '', customerName: '', customerAddress: '', customerPhone: '',
  customerInstagram: '', deliveryTime: '', askingPrice: '', currency: 'EUR',
  isPaid: false, paymentNotes: '',
  dueDateText: format(addDays(new Date(), 7), 'yyyy-MM-dd'), internalNotes: '',
};

export default function NewOrderScreen() {
  const router = useRouter();
  const { addOrder } = useOrders();
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();
  const { colors } = useTheme();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
  }, []);

  const addTag = useCallback((tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t) setForm((p) => ({ ...p, tags: p.tags.includes(t) ? p.tags : [...p.tags, t] }));
  }, []);

  const pickPhoto = useCallback(async () => {
    if (form.photos.length >= 5) { Alert.alert('Max 5 photos'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!r.canceled && r.assets[0]) set('photos', [...form.photos, r.assets[0].uri]);
  }, [form.photos, set]);

  const parsedDue = (() => { const d = new Date(form.dueDateText); return isNaN(d.getTime()) ? addDays(new Date(), 7) : d; })();

  const save = useCallback(async () => {
    Keyboard.dismiss();
    if (!form.orderName.trim()) { Alert.alert('Required', 'Order name is required.'); return; }
    if (!form.customerName.trim()) { Alert.alert('Required', 'Customer name is required.'); return; }
    setSaving(true);
    try {
      const id = await addOrder({
        orderName: form.orderName.trim(), description: form.description.trim(),
        craftCategory: form.craftCategory, tags: form.tags, photos: form.photos,
        sourceLink: form.sourceLink.trim() || undefined,
        customerName: form.customerName.trim(), customerAddress: form.customerAddress.trim(),
        deliveryTime: form.deliveryTime.trim(), customerPhone: form.customerPhone.trim() || undefined,
        customerInstagram: form.customerInstagram.trim() || undefined,
        askingPrice: parseFloat(form.askingPrice) || 0, currency: form.currency,
        isPaid: form.isPaid, paymentNotes: form.paymentNotes.trim() || undefined,
        dueDate: parsedDue, internalNotes: form.internalNotes.trim() || undefined,
      });
      router.replace(`/order/${id}`);
    } catch (e) {
      Alert.alert('Error', `Could not save: ${(e as Error).message}`);
      setSaving(false);
    }
  }, [form, parsedDue, addOrder, router]);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={[s.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}><Text style={[s.cancel, { color: colors.subText }]}>Cancel</Text></TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>New Order</Text>
        <TouchableOpacity onPress={save} style={[s.saveBtn, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          <Block title="Order Details" colors={colors}>
            <F label="Order Name *" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.orderName} onChangeText={(v) => set('orderName', v)} placeholder="e.g. Floral Hoodie Set" placeholderTextColor={colors.subText} /></F>
            <F label="Description" colors={colors}><TextInput style={[s.input, s.multi, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe the order…" placeholderTextColor={colors.subText} multiline numberOfLines={3} textAlignVertical="top" /></F>

            <F label="Craft Category" colors={colors}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((cat) => (
                  <TagChip key={cat.id} label={`${cat.emoji} ${cat.name}`}
                    selected={form.craftCategory === cat.name}
                    onPress={() => set('craftCategory', form.craftCategory === cat.name ? '' : cat.name)}
                    color={form.craftCategory === cat.name ? cat.color : undefined} />
                ))}
              </ScrollView>
            </F>

            <F label="Tags" colors={colors}>
              <View style={s.tagsWrap}>
                {form.tags.map((t) => <TagChip key={t} label={t} onRemove={() => set('tags', form.tags.filter((x) => x !== t))} />)}
                {PRESET_TAGS.filter((t) => !form.tags.includes(t)).map((t) => <TagChip key={t} label={`+ ${t}`} onPress={() => addTag(t)} />)}
              </View>
              <View style={s.row}>
                <TextInput style={[s.input, { flex: 1, backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={customTag} onChangeText={setCustomTag} placeholder="Custom tag…" placeholderTextColor={colors.subText} returnKeyType="done" onSubmitEditing={() => { addTag(customTag); setCustomTag(''); }} />
                <TouchableOpacity style={s.addBtn} onPress={() => { addTag(customTag); setCustomTag(''); }}><Text style={s.addTxt}>Add</Text></TouchableOpacity>
              </View>
            </F>

            <F label={`Photos (${form.photos.length}/5)`} colors={colors}>
              <TouchableOpacity style={[s.photoBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={pickPhoto}><Text style={s.photoBtnTxt}>{form.photos.length === 0 ? '📎  Attach photos' : `📎  ${form.photos.length} attached — add more`}</Text></TouchableOpacity>
            </F>
            <F label="Source Link (optional)" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.sourceLink} onChangeText={(v) => set('sourceLink', v)} placeholder="Instagram / WhatsApp link" placeholderTextColor={colors.subText} autoCapitalize="none" keyboardType="url" /></F>
          </Block>

          <Block title="Customer Info" colors={colors}>
            <F label="Customer Name *" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.customerName} onChangeText={(v) => set('customerName', v)} placeholder="Emma Kowalski" placeholderTextColor={colors.subText} /></F>
            <F label="Address" colors={colors}><TextInput style={[s.input, s.multi, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.customerAddress} onChangeText={(v) => set('customerAddress', v)} placeholder="Street, City, Country" placeholderTextColor={colors.subText} multiline numberOfLines={2} textAlignVertical="top" /></F>
            <F label="Phone" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} placeholder="+49 123 456789" placeholderTextColor={colors.subText} keyboardType="phone-pad" /></F>
            <F label="Instagram" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.customerInstagram} onChangeText={(v) => set('customerInstagram', v)} placeholder="@username" placeholderTextColor={colors.subText} autoCapitalize="none" /></F>
            <F label="Delivery Time" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.deliveryTime} onChangeText={(v) => set('deliveryTime', v)} placeholder="e.g. 3:00 PM" placeholderTextColor={colors.subText} /></F>
          </Block>

          <Block title="Financials" colors={colors}>
            <F label="Currency" colors={colors}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity key={c} style={[s.chip, { backgroundColor: colors.card, borderColor: colors.cardBorder }, form.currency === c && s.chipOn]} onPress={() => set('currency', c)}>
                    <Text style={[s.chipTxt, { color: colors.subText }, form.currency === c && s.chipTxtOn]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </F>
            <F label="Price" colors={colors}><TextInput style={[s.input, s.priceInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.askingPrice} onChangeText={(v) => set('askingPrice', v)} placeholder="0.00" placeholderTextColor={colors.subText} keyboardType="decimal-pad" /></F>
            <View style={[s.toggleRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}><Text style={[s.toggleLbl, { color: colors.text }]}>Already paid</Text><Switch value={form.isPaid} onValueChange={(v) => set('isPaid', v)} trackColor={{ false: Colors.border, true: Colors.sage }} thumbColor={Colors.white} /></View>
            <F label="Payment Notes" colors={colors}><TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.paymentNotes} onChangeText={(v) => set('paymentNotes', v)} placeholder="Bank transfer, PayPal…" placeholderTextColor={colors.subText} /></F>
          </Block>

          <Block title="Dates & Notes" last colors={colors}>
            <F label="Due Date (YYYY-MM-DD)" colors={colors}>
              <TextInput style={[s.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.dueDateText} onChangeText={(v) => set('dueDateText', v)} placeholder="2025-04-15" placeholderTextColor={colors.subText} keyboardType="numbers-and-punctuation" />
              <Text style={s.hint}>{format(parsedDue, 'EEEE, MMMM d, yyyy')}</Text>
            </F>
            <F label="Internal Notes" colors={colors}><TextInput style={[s.input, s.multi, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]} value={form.internalNotes} onChangeText={(v) => set('internalNotes', v)} placeholder="Private notes…" placeholderTextColor={colors.subText} multiline numberOfLines={3} textAlignVertical="top" /></F>
          </Block>

        </ScrollView>
      </KeyboardAvoidingView>
    {/* Sticky bottom save button — always visible above Android nav bar */}
      <View style={[s.stickyBar, { backgroundColor: colors.bg, borderTopColor: colors.cardBorder, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          onPress={save}
          style={[s.stickySaveBtn, saving && { opacity: 0.5 }]}
          disabled={saving}
        >
          <Text style={s.stickySaveTxt}>{saving ? 'Saving…' : 'Save Order'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Block({ title, children, last, colors }: { title: string; children: React.ReactNode; last?: boolean; colors: any }) {
  return <View style={[s.block, !last && s.blockBorder, !last && { borderBottomColor: colors.cardBorder }]}><Text style={[s.blockTitle, { color: colors.text }]}>{title}</Text>{children}</View>;
}
function F({ label, children, colors }: { label: string; children: React.ReactNode; colors: any }) {
  return <View style={{ marginBottom: 4 }}><Text style={[s.lbl, { color: colors.subText }]}>{label}</Text>{children}</View>;
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: { fontSize: 15, fontFamily: 'DMSans' },
  headerTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay' },
  saveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 7 },
  saveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  block: { paddingHorizontal: Spacing.md, paddingTop: 24, paddingBottom: 8 },
  blockBorder: { borderBottomWidth: StyleSheet.hairlineWidth },
  blockTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay', marginBottom: 16 },
  lbl: { fontSize: 11, fontFamily: 'DMSans', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'DMSans', fontSize: 15, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  multi: { minHeight: 80, paddingTop: 12 },
  priceInput: { fontFamily: 'DMMono', fontSize: 22 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  addTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  photoBtn: { borderRadius: BorderRadius.md, paddingVertical: 14, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', marginBottom: 12 },
  photoBtnTxt: { fontFamily: 'DMSans', fontSize: 14, color: Colors.rose },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: StyleSheet.hairlineWidth, marginRight: 8 },
  chipOn: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt: { fontSize: 13, fontFamily: 'DMMono' },
  chipTxtOn: { color: Colors.white },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  toggleLbl: { fontSize: 15, fontFamily: 'DMSans' },
  hint: { fontSize: 12, fontFamily: 'DMSans', color: Colors.rose, marginTop: -8, marginBottom: 12 },
  stickyBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.md, paddingTop: 10 },
  stickySaveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  stickySaveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
