import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications } from '../../hooks/useNotifications';
import { CountdownTimer } from '../../components/CountdownTimer';
import { StatusBadge } from '../../components/StatusBadge';
import { TagChip } from '../../components/TagChip';
import { InvoicePreview } from '../../components/InvoicePreview';
import { Colors, Spacing, BorderRadius, StatusColors } from '../../lib/theme';
import type { OrderStatus } from '../../types';

const STATUS_PIPELINE: OrderStatus[] = ['request', 'accepted', 'shipped', 'delivered'];
const STATUS_LABELS: Record<OrderStatus, string> = {
  request: 'Request',
  accepted: 'Accepted',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, advanceStatus, togglePaid, deleteOrder } = useOrders();
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

  const currencySymbol =
    order.currency === 'EUR' ? '€' : order.currency === 'GBP' ? '£' : '$';

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
        {/* Status + Countdown */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.statusSection}>
          <View style={styles.statusRow}>
            <StatusBadge status={order.status} />
            {order.isPaid ? (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>● PAID</Text>
              </View>
            ) : (
              <View style={styles.unpaidBadge}>
                <Text style={styles.unpaidText}>○ UNPAID</Text>
              </View>
            )}
          </View>

          {isActive && (
            <CountdownTimer dueDate={order.dueDate} style={styles.countdown} />
          )}
        </Animated.View>

        {/* Status Pipeline */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.pipeline}>
          {STATUS_PIPELINE.map((s, i) => {
            const isCompleted = STATUS_PIPELINE.indexOf(order.status as OrderStatus) >= i;
            const isCurrent = order.status === s;
            const color = StatusColors[s];

            return (
              <View key={s} style={styles.pipelineStep}>
                <View style={[
                  styles.pipelineDot,
                  isCompleted && { backgroundColor: color, borderColor: color },
                  isCurrent && styles.pipelineDotCurrent,
                ]}>
                  {isCompleted && <Text style={styles.pipelineCheck}>✓</Text>}
                </View>
                <Text style={[
                  styles.pipelineLabel,
                  isCurrent && { color, fontWeight: '600' },
                ]}>
                  {STATUS_LABELS[s]}
                </Text>
                {i < STATUS_PIPELINE.length - 1 && (
                  <View style={[
                    styles.pipelineLine,
                    isCompleted && i < STATUS_PIPELINE.indexOf(order.status as OrderStatus) && { backgroundColor: color },
                  ]} />
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* Advance Status Button */}
        {nextStatus && order.status !== 'cancelled' && (
          <View style={styles.advanceSection}>
            <TouchableOpacity
              style={[
                styles.advanceButton,
                { backgroundColor: StatusColors[nextStatus] },
                advancing && { opacity: 0.7 },
              ]}
              onPress={handleAdvance}
              disabled={advancing}
            >
              {advancing ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.advanceText}>
                  Mark as {STATUS_LABELS[nextStatus]} →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Core Details */}
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={styles.detailCard}>
          <DetailRow label="Customer" value={order.customerName} />
          <DetailRow label="Address" value={order.customerAddress} />
          {order.customerPhone && <DetailRow label="Phone" value={order.customerPhone} />}
          {order.customerInstagram && <DetailRow label="Instagram" value={order.customerInstagram} />}
          <DetailRow label="Due Date" value={format(new Date(order.dueDate), 'EEEE, MMMM d, yyyy')} />
          {order.deliveryTime && <DetailRow label="Delivery Time" value={order.deliveryTime} />}
          <DetailRow
            label="Price"
            value={`${currencySymbol}${order.askingPrice.toFixed(2)}`}
            valueStyle={{ fontFamily: 'DMMono', color: Colors.bark }}
          />
          <DetailRow label="Category" value={order.craftCategory || '—'} />
          {order.shipmentId && <DetailRow label="Shipment ID" value={order.shipmentId} mono />}
          {order.carrier && <DetailRow label="Carrier" value={order.carrier} />}
          {order.sourceLink && <DetailRow label="Source" value={order.sourceLink} />}
          {order.description && <DetailRow label="Description" value={order.description} multiline />}
          {order.internalNotes && <DetailRow label="Internal Notes" value={order.internalNotes} multiline />}
          {order.paymentNotes && <DetailRow label="Payment Notes" value={order.paymentNotes} />}
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
          <View style={styles.detailCard}>
            <DetailRow label="Created" value={format(new Date(order.createdAt), 'MMM d, yyyy')} />
            {order.acceptedAt && <DetailRow label="Accepted" value={format(new Date(order.acceptedAt), 'MMM d, yyyy')} />}
            {order.shippedAt && <DetailRow label="Shipped" value={format(new Date(order.shippedAt), 'MMM d, yyyy')} />}
            {order.deliveredAt && <DetailRow label="Delivered" value={format(new Date(order.deliveredAt), 'MMM d, yyyy')} />}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.paidButton]}
            onPress={() => togglePaid(order)}
          >
            <Text style={styles.paidButtonText}>
              {order.isPaid ? 'Mark Unpaid' : 'Mark as Paid ✓'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.invoiceButton]}
            onPress={() => setShowInvoice(!showInvoice)}
          >
            <Text style={styles.invoiceButtonText}>
              {showInvoice ? 'Hide Invoice' : '🧾 Generate Invoice'}
            </Text>
          </TouchableOpacity>

          {showInvoice && (
            <InvoicePreview
              order={order}
              businessName="Sofi Dream"
              businessTagline="Handmade with love ✦"
            />
          )}

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
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
              placeholderTextColor={Colors.muted}
              value={shipmentId}
              onChangeText={setShipmentId}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Carrier (e.g. DHL, PostNL)"
              placeholderTextColor={Colors.muted}
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowMultiline: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.bark,
    flex: 2,
    textAlign: 'right',
  },
  valueMultiline: {
    textAlign: 'left',
    flex: 0,
  },
  mono: {
    fontFamily: 'DMMono',
    fontSize: 12,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 20,
    color: Colors.muted,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
  },
  editButton: {
    padding: 4,
  },
  editText: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.rose,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
    color: Colors.muted,
  },
  backLink: {
    fontFamily: 'DMSans',
    color: Colors.rose,
    fontSize: 14,
  },
  statusSection: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countdown: {
    fontSize: 18,
    fontFamily: 'DMMono',
  },
  paidBadge: {
    backgroundColor: `${Colors.sage}22`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paidText: {
    fontSize: 11,
    fontFamily: 'DMMono',
    color: Colors.sage,
    letterSpacing: 0.5,
  },
  unpaidBadge: {
    backgroundColor: `${Colors.coral}22`,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unpaidText: {
    fontSize: 11,
    fontFamily: 'DMMono',
    color: Colors.coral,
    letterSpacing: 0.5,
  },
  pipeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pipelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  pipelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  pipelineDotCurrent: {
    borderWidth: 3,
  },
  pipelineCheck: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '700',
  },
  pipelineLabel: {
    fontSize: 10,
    fontFamily: 'DMMono',
    color: Colors.muted,
    textAlign: 'center',
  },
  pipelineLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
    zIndex: -1,
  },
  advanceSection: {
    marginBottom: Spacing.md,
  },
  advanceButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  advanceText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tagsSection: {
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photosSection: {
    marginBottom: Spacing.md,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  timelineSection: {
    marginBottom: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  paidButton: {
    backgroundColor: Colors.sage,
  },
  paidButtonText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  invoiceButton: {
    borderWidth: 1,
    borderColor: Colors.rose,
    backgroundColor: `${Colors.rose}11`,
  },
  invoiceButtonText: {
    color: Colors.rose,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: Colors.coral,
    backgroundColor: `${Colors.coral}11`,
  },
  deleteText: {
    color: Colors.coral,
    fontFamily: 'DMSans',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
  },
  modalInput: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: 'DMSans',
    fontSize: 15,
    color: Colors.bark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancel: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'DMSans',
    color: Colors.muted,
    fontWeight: '600',
  },
  modalConfirm: {
    flex: 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.sky,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: 'DMSans',
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
