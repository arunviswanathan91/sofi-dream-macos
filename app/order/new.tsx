import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { format, addDays } from 'date-fns';
import { useOrders } from '../../hooks/useOrders';
import { useCategories } from '../../hooks/useCategories';
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
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={s.headerTitle}>New Order</Text>
        <TouchableOpacity onPress={save} style={[s.saveBtn, saving && { opacity: 0.5 }]} disabled={saving}>
          <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

          <Block title="Order Details">
            <F label="Order Name *"><TextInput style={s.input} value={form.orderName} onChangeText={(v) => set('orderName', v)} placeholder="e.g. Floral Hoodie Set" placeholderTextColor={Colors.muted} /></F>
            <F label="Description"><TextInput style={[s.input, s.multi]} value={form.description} onChangeText={(v) => set('description', v)} placeholder="Describe the order…" placeholderTextColor={Colors.muted} multiline numberOfLines={3} textAlignVertical="top" /></F>

            <F label="Craft Category">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categories.map((cat) => (
                  <TagChip key={cat.id} label={`${cat.emoji} ${cat.name}`}
                    selected={form.craftCategory === cat.name}
                    onPress={() => set('craftCategory', form.craftCategory === cat.name ? '' : cat.name)}
                    color={form.craftCategory === cat.name ? cat.color : undefined} />
                ))}
              </ScrollView>
            </F>

            <F label="Tags">
              <View style={s.tagsWrap}>
                {form.tags.map((t) => <TagChip key={t} label={t} onRemove={() => set('tags', form.tags.filter((x) => x !== t))} />)}
                {PRESET_TAGS.filter((t) => !form.tags.includes(t)).map((t) => <TagChip key={t} label={`+ ${t}`} onPress={() => addTag(t)} />)}
              </View>
              <View style={s.row}>
                <TextInput style={[s.input, { flex: 1 }]} value={customTag} onChangeText={setCustomTag} placeholder="Custom tag…" placeholderTextColor={Colors.muted} returnKeyType="done" onSubmitEditing={() => { addTag(customTag); setCustomTag(''); }} />
                <TouchableOpacity style={s.addBtn} onPress={() => { addTag(customTag); setCustomTag(''); }}><Text style={s.addTxt}>Add</Text></TouchableOpacity>
              </View>
            </F>

            <F label={`Photos (${form.photos.length}/5)`}>
              <TouchableOpacity style={s.photoBtn} onPress={pickPhoto}><Text style={s.photoBtnTxt}>{form.photos.length === 0 ? '📎  Attach photos' : `📎  ${form.photos.length} attached — add more`}</Text></TouchableOpacity>
            </F>
            <F label="Source Link (optional)"><TextInput style={s.input} value={form.sourceLink} onChangeText={(v) => set('sourceLink', v)} placeholder="Instagram / WhatsApp link" placeholderTextColor={Colors.muted} autoCapitalize="none" keyboardType="url" /></F>
          </Block>

          <Block title="Customer Info">
            <F label="Customer Name *"><TextInput style={s.input} value={form.customerName} onChangeText={(v) => set('customerName', v)} placeholder="Emma Kowalski" placeholderTextColor={Colors.muted} /></F>
            <F label="Address"><TextInput style={[s.input, s.multi]} value={form.customerAddress} onChangeText={(v) => set('customerAddress', v)} placeholder="Street, City, Country" placeholderTextColor={Colors.muted} multiline numberOfLines={2} textAlignVertical="top" /></F>
            <F label="Phone"><TextInput style={s.input} value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} placeholder="+49 123 456789" placeholderTextColor={Colors.muted} keyboardType="phone-pad" /></F>
            <F label="Instagram"><TextInput style={s.input} value={form.customerInstagram} onChangeText={(v) => set('customerInstagram', v)} placeholder="@username" placeholderTextColor={Colors.muted} autoCapitalize="none" /></F>
            <F label="Delivery Time"><TextInput style={s.input} value={form.deliveryTime} onChangeText={(v) => set('deliveryTime', v)} placeholder="e.g. 3:00 PM" placeholderTextColor={Colors.muted} /></F>
          </Block>

          <Block title="Financials">
            <F label="Currency">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CURRENCIES.map((c) => (
                  <TouchableOpacity key={c} style={[s.chip, form.currency === c && s.chipOn]} onPress={() => set('currency', c)}>
                    <Text style={[s.chipTxt, form.currency === c && s.chipTxtOn]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </F>
            <F label="Price"><TextInput style={[s.input, s.priceInput]} value={form.askingPrice} onChangeText={(v) => set('askingPrice', v)} placeholder="0.00" placeholderTextColor={Colors.muted} keyboardType="decimal-pad" /></F>
            <View style={s.toggleRow}><Text style={s.toggleLbl}>Already paid</Text><Switch value={form.isPaid} onValueChange={(v) => set('isPaid', v)} trackColor={{ false: Colors.border, true: Colors.sage }} thumbColor={Colors.white} /></View>
            <F label="Payment Notes"><TextInput style={s.input} value={form.paymentNotes} onChangeText={(v) => set('paymentNotes', v)} placeholder="Bank transfer, PayPal…" placeholderTextColor={Colors.muted} /></F>
          </Block>

          <Block title="Dates & Notes" last>
            <F label="Due Date (YYYY-MM-DD)">
              <TextInput style={s.input} value={form.dueDateText} onChangeText={(v) => set('dueDateText', v)} placeholder="2025-04-15" placeholderTextColor={Colors.muted} keyboardType="numbers-and-punctuation" />
              <Text style={s.hint}>{format(parsedDue, 'EEEE, MMMM d, yyyy')}</Text>
            </F>
            <F label="Internal Notes"><TextInput style={[s.input, s.multi]} value={form.internalNotes} onChangeText={(v) => set('internalNotes', v)} placeholder="Private notes…" placeholderTextColor={Colors.muted} multiline numberOfLines={3} textAlignVertical="top" /></F>
          </Block>

        </ScrollView>
      </KeyboardAvoidingView>
    {/* Sticky bottom save button — always visible above Android nav bar */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 8 }]}>
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

function Block({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return <View style={[s.block, !last && s.blockBorder]}><Text style={s.blockTitle}>{title}</Text>{children}</View>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={{ marginBottom: 4 }}><Text style={s.lbl}>{label}</Text>{children}</View>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  cancel: { fontSize: 15, fontFamily: 'DMSans', color: Colors.muted },
  headerTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay', color: Colors.bark },
  saveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 7 },
  saveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
  block: { paddingHorizontal: Spacing.md, paddingTop: 24, paddingBottom: 8 },
  blockBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  blockTitle: { fontSize: 17, fontFamily: 'PlayfairDisplay', color: Colors.bark, marginBottom: 16 },
  lbl: { fontSize: 11, fontFamily: 'DMSans', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'DMSans', fontSize: 15, color: Colors.bark, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginBottom: 12 },
  multi: { minHeight: 80, paddingTop: 12 },
  priceInput: { fontFamily: 'DMMono', fontSize: 22 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  addTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  photoBtn: { borderRadius: BorderRadius.md, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', marginBottom: 12, backgroundColor: Colors.warmWhite },
  photoBtnTxt: { fontFamily: 'DMSans', fontSize: 14, color: Colors.rose },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.warmWhite, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginRight: 8 },
  chipOn: { backgroundColor: Colors.rose, borderColor: Colors.rose },
  chipTxt: { fontSize: 13, fontFamily: 'DMMono', color: Colors.muted },
  chipTxtOn: { color: Colors.white },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.warmWhite, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginBottom: 12 },
  toggleLbl: { fontSize: 15, fontFamily: 'DMSans', color: Colors.bark },
  hint: { fontSize: 12, fontFamily: 'DMSans', color: Colors.rose, marginTop: -8, marginBottom: 12 },
  stickyBar: { backgroundColor: Colors.cream, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border, paddingHorizontal: Spacing.md, paddingTop: 10 },
  stickySaveBtn: { backgroundColor: Colors.rose, borderRadius: BorderRadius.md, paddingVertical: 15, alignItems: 'center' },
  stickySaveTxt: { color: Colors.white, fontFamily: 'DMSans', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
