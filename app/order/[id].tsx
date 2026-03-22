import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { getCurrencySymbol } from '../../lib/theme';
import { useNotifications } from '../../hooks/useNotifications';
import { CountdownTimer } from '../../components/CountdownTimer';
import { StatusBadge } from '../../components/StatusBadge';
import { TagChip } from '../../components/TagChip';
import { InvoicePreview } from '../../components/InvoicePreview';
import { Colors, Spacing, BorderRadius, StatusColors } from '../../lib/theme';
import type { OrderStatus } from '../../types';

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
  onPrimaryContainer: '#522232',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
};

const STATUS_PIPELINE: OrderStatus[] = ['request', 'accepted', 'shipped', 'delivered'];
const STATUS_LABELS: Record<OrderStatus, string> = {
  request: 'Request',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function getStatusRibbonColor(status: OrderStatus | string): string {
  switch (status) {
    case 'accepted': return T.tertiary;
    case 'request': return T.tertiary;
    case 'shipped': return T.primary;
    case 'delivered': return T.primaryContainer;
    default: return T.outlineVariant;
  }
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, advanceStatus, togglePaid, deleteOrder } = useOrders();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { scheduleForOrder, cancelForOrder } = useNotifications();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const [showShipModal, setShowShipModal] = useState(false);
  const [shipmentId, setShipmentId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Order not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStageIndex = STATUS_PIPELINE.indexOf(order.status as OrderStatus);
  const nextStatus = currentStageIndex < STATUS_PIPELINE.length - 1
    ? STATUS_PIPELINE[currentStageIndex + 1]
    : null;

  const currencySymbol = getCurrencySymbol(order.currency);
  const ribbonColor = getStatusRibbonColor(order.status);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    if (nextStatus === 'shipped') {
      setShowShipModal(true);
      return;
    }

    Alert.alert(
      `Mark as ${STATUS_LABELS[nextStatus]}?`,
      `This will update the order status to "${STATUS_LABELS[nextStatus]}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setAdvancing(true);
            await advanceStatus(order, nextStatus);
            if (nextStatus === 'accepted') {
              await scheduleForOrder({ ...order, status: 'accepted', acceptedAt: new Date() });
            }
            if (nextStatus === 'delivered') {
              await cancelForOrder(order.id);
            }
            setAdvancing(false);
          },
        },
      ]
    );
  };

  const handleShipConfirm = async () => {
    setAdvancing(true);
    setShowShipModal(false);
    await advanceStatus(order, 'shipped', { shipmentId, carrier });
    setAdvancing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete "${order.orderName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelForOrder(order.id);
            await deleteOrder(order.id);
            router.back();
          },
        },
      ]
    );
  };

  const isActive = ['request', 'accepted'].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: back arrow + PlayfairDisplay title + edit */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {order.orderName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/order/edit/${order.id}`)}
          style={styles.editButton}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero section: customer name + status chip */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.heroSection}>
          <View style={styles.heroLeft}>
            <View style={[styles.statusChipRow]}>
              <View style={[styles.inProgressChip, { backgroundColor: ribbonColor + '22' }]}>
                <View style={[styles.inProgressDot, { backgroundColor: ribbonColor }]} />
                <Text style={[styles.inProgressText, { color: ribbonColor }]}>
                  {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                </Text>
              </View>
              {order.isPaid ? (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>PAID</Text>
                </View>
              ) : (
                <View style={styles.unpaidBadge}>
                  <Text style={styles.unpaidText}>UNPAID</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroCustomer}>{order.customerName}</Text>
            <Text style={styles.heroOrderId}>#{order.id.slice(-8).toUpperCase()}</Text>
          </View>
          {isActive && (
            <CountdownTimer dueDate={order.dueDate} style={styles.countdown} />
          )}
        </Animated.View>

        {/* Status Pipeline: pill chips row */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.pipeline}>
          {STATUS_PIPELINE.map((s, i) => {
            const isCompleted = STATUS_PIPELINE.indexOf(order.status as OrderStatus) >= i;
            const isCurrent = order.status === s;
            const chipColor = isCurrent
              ? (s === 'accepted' || s === 'request' ? T.tertiary : T.primary)
              : T.surfaceHighest;

            return (
              <React.Fragment key={s}>
                <View style={[
                  styles.pipelineChip,
                  isCurrent && { backgroundColor: chipColor },
                  !isCurrent && isCompleted && { backgroundColor: T.secondaryContainer },
                ]}>
                  <Text style={[
                    styles.pipelineChipText,
                    isCurrent && { color: '#FFFFFF', fontWeight: '700' },
                    !isCurrent && isCompleted && { color: T.secondary },
                    !isCurrent && !isCompleted && { color: T.subText },
                  ]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </View>
                {i < STATUS_PIPELINE.length - 1 && (
                  <View style={[
                    styles.pipelineConnector,
                    isCompleted && i < STATUS_PIPELINE.indexOf(order.status as OrderStatus) && { backgroundColor: T.primaryContainer },
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </Animated.View>

        {/* Advance Status Button */}
        {nextStatus && order.status !== 'cancelled' && (
          <View style={styles.advanceSection}>
            <TouchableOpacity
              style={[
                styles.advanceButton,
                { backgroundColor: getStatusRibbonColor(nextStatus) },
                advancing && { opacity: 0.7 },
              ]}
              onPress={handleAdvance}
              disabled={advancing}
            >
              {advancing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.advanceText}>
                  Mark as {STATUS_LABELS[nextStatus]} →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Main detail card — bg surfaceLowest, 24px radius, left ribbon */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.mainCard}>
          <View style={[styles.mainCardRibbon, { backgroundColor: ribbonColor }]} />
          <View style={styles.mainCardContent}>
            <DetailRow label="Customer" value={order.customerName} />
            <DetailRow label="Address" value={order.customerAddress} />
            {order.customerPhone && <DetailRow label="Phone" value={order.customerPhone} />}
            {order.customerInstagram && <DetailRow label="Instagram" value={order.customerInstagram} />}
            <DetailRow label="Due Date" value={format(new Date(order.dueDate), 'EEEE, MMMM d, yyyy')} />
            {order.deliveryTime && <DetailRow label="Delivery Time" value={order.deliveryTime} />}
            <DetailRow
              label="Price"
              value={`${currencySymbol}${order.askingPrice.toFixed(2)}`}
              valueStyle={{ fontFamily: 'DMSans', fontWeight: '700', color: T.primary, fontSize: 16 }}
            />
            <DetailRow label="Category" value={order.craftCategory || '—'} />
            {order.invoiceNumber && <DetailRow label="Invoice #" value={order.invoiceNumber} mono />}
            {order.shipmentId && <DetailRow label="Shipment ID" value={order.shipmentId} mono />}
            {order.carrier && <DetailRow label="Carrier" value={order.carrier} />}
            {order.sourceLink && <DetailRow label="Source" value={order.sourceLink} />}
            {order.description && <DetailRow label="Description" value={order.description} multiline />}
            {order.internalNotes && <DetailRow label="Internal Notes" value={order.internalNotes} multiline />}
            {order.paymentNotes && <DetailRow label="Payment Notes" value={order.paymentNotes} />}
          </View>
        </Animated.View>

        {/* Tags */}
        {order.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionLabel}>Tags</Text>
            <View style={styles.tagsRow}>
              {order.tags.map((tag) => (
                <TagChip key={tag} label={tag} />
              ))}
            </View>
          </View>
        )}

        {/* Photos */}
        {order.photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionLabel}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {order.photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionLabel}>Timeline</Text>
          <View style={styles.timelineCard}>
            <DetailRow label="Created" value={format(new Date(order.createdAt), 'MMM d, yyyy')} />
            {order.acceptedAt && <DetailRow label="Accepted" value={format(new Date(order.acceptedAt), 'MMM d, yyyy')} />}
            {order.shippedAt && <DetailRow label="Shipped" value={format(new Date(order.shippedAt), 'MMM d, yyyy')} />}
            {order.deliveredAt && <DetailRow label="Delivered" value={format(new Date(order.deliveredAt), 'MMM d, yyyy')} />}
          </View>
        </View>

        {/* Action Buttons — pill shape */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.paidButton}
            onPress={() => togglePaid(order)}
          >
            <Text style={styles.paidButtonText}>
              {order.isPaid ? 'Mark Unpaid' : 'Mark as Paid ✓'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.invoiceButton}
            onPress={() => setShowInvoice(!showInvoice)}
          >
            <Text style={styles.invoiceButtonText}>
              {showInvoice ? 'Hide Invoice' : '🧾 Generate Invoice'}
            </Text>
          </TouchableOpacity>

          {showInvoice && (
            <InvoicePreview
              order={order}
              businessName={profile.name}
              businessTagline={profile.tagline}
              businessAddress={profile.address}
              gstNumber={profile.gstNumber}
            />
          )}

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete Order</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 60 }} />
      </ScrollView>

      {/* Ship Modal */}
      <Modal visible={showShipModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark as Shipped</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Shipment / Tracking ID (optional)"
              placeholderTextColor={T.outline}
              value={shipmentId}
              onChangeText={setShipmentId}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Carrier (e.g. DHL, PostNL)"
              placeholderTextColor={T.outline}
              value={carrier}
              onChangeText={setCarrier}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowShipModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleShipConfirm}>
                <Text style={styles.modalConfirmText}>Mark Shipped →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueStyle,
  multiline,
  mono,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  multiline?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={[detailStyles.row, multiline && detailStyles.rowMultiline]}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text
        style={[
          detailStyles.value,
          mono && detailStyles.mono,
          multiline && detailStyles.valueMultiline,
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.outlineVariant + '40',
  },
  rowMultiline: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: T.subText,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: T.text,
    flex: 2,
    textAlign: 'right',
  },
  valueMultiline: {
    textAlign: 'left',
    flex: 0,
  },
  mono: {
    fontFamily: 'DMSans',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: T.bg,
    gap: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: T.surfaceLow,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    color: T.primary,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: T.surfaceLow,
  },
  editText: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
    color: T.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Not found
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
    color: T.subText,
  },
  backLink: {
    fontFamily: 'DMSans',
    color: T.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Hero section
  heroSection: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inProgressChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  inProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inProgressText: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paidBadge: {
    backgroundColor: '#22C55E22',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidText: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  unpaidBadge: {
    backgroundColor: T.tertiary + '22',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unpaidText: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.tertiary,
    letterSpacing: 0.5,
  },
  heroCustomer: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.primary,
    letterSpacing: -0.5,
  },
  heroOrderId: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '500',
    color: T.subText,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  countdown: {
    fontSize: 16,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.tertiary,
  },
  // Status pipeline
  pipeline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceLow,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  pipelineChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: T.surfaceHighest,
    flexShrink: 1,
  },
  pipelineChipText: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '600',
    textAlign: 'center',
  },
  pipelineConnector: {
    flex: 1,
    height: 2,
    backgroundColor: T.outlineVariant,
    marginHorizontal: 4,
  },
  // Advance button
  advanceSection: {
    marginBottom: 16,
  },
  advanceButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  advanceText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  // Main card
  mainCard: {
    backgroundColor: T.surfaceLowest,
    borderRadius: 24,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: T.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 3,
  },
  mainCardRibbon: {
    width: 4,
    alignSelf: 'stretch',
  },
  mainCardContent: {
    flex: 1,
    padding: 16,
  },
  // Section label
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: T.subText,
    marginBottom: 8,
  },
  // Tags
  tagsSection: {
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // Photos
  photosSection: {
    marginBottom: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 10,
  },
  // Timeline
  timelineSection: {
    marginBottom: 16,
  },
  timelineCard: {
    backgroundColor: T.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: T.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  // Actions
  actions: {
    gap: 10,
    marginBottom: 16,
  },
  paidButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: T.primaryContainer,
  },
  paidButtonText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  invoiceButton: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: T.primaryContainer,
    backgroundColor: T.primaryContainer + '18',
  },
  invoiceButtonText: {
    color: T.primary,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BA1A1A44',
    backgroundColor: '#BA1A1A0D',
  },
  deleteText: {
    color: '#BA1A1A',
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  // Ship Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
    backgroundColor: T.bg,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  modalInput: {
    backgroundColor: T.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontFamily: 'DMSans',
    fontSize: 15,
    color: T.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: T.surfaceHighest,
  },
  modalCancelText: {
    fontFamily: 'DMSans',
    fontWeight: '600',
    color: T.subText,
  },
  modalConfirm: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: T.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: 'DMSans',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
