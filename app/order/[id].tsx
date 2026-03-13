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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.subText }]}>Order not found</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.subText }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
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
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={[styles.pipeline, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {STATUS_PIPELINE.map((s, i) => {
            const isCompleted = STATUS_PIPELINE.indexOf(order.status as OrderStatus) >= i;
            const isCurrent = order.status === s;
            const color = StatusColors[s];

            return (
              <View key={s} style={styles.pipelineStep}>
                <View style={[
                  styles.pipelineDot,
                  { backgroundColor: colors.bg, borderColor: colors.cardBorder },
                  isCompleted && { backgroundColor: color, borderColor: color },
                  isCurrent && styles.pipelineDotCurrent,
                ]}>
                  {isCompleted && <Text style={styles.pipelineCheck}>✓</Text>}
                </View>
                <Text style={[
                  styles.pipelineLabel,
                  { color: colors.subText },
                  isCurrent && { color, fontWeight: '600' },
                ]}>
                  {STATUS_LABELS[s]}
                </Text>
                {i < STATUS_PIPELINE.length - 1 && (
                  <View style={[
                    styles.pipelineLine,
                    { backgroundColor: colors.cardBorder },
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
        <Animated.View entering={FadeInDown.delay(150).duration(300)} style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <DetailRow label="Customer" value={order.customerName} colors={colors} />
          <DetailRow label="Address" value={order.customerAddress} colors={colors} />
          {order.customerPhone && <DetailRow label="Phone" value={order.customerPhone} colors={colors} />}
          {order.customerInstagram && <DetailRow label="Instagram" value={order.customerInstagram} colors={colors} />}
          <DetailRow label="Due Date" value={format(new Date(order.dueDate), 'EEEE, MMMM d, yyyy')} colors={colors} />
          {order.deliveryTime && <DetailRow label="Delivery Time" value={order.deliveryTime} colors={colors} />}
          <DetailRow
            label="Price"
            value={`${currencySymbol}${order.askingPrice.toFixed(2)}`}
            valueStyle={{ fontFamily: 'DMMono', color: colors.text }}
            colors={colors}
          />
          <DetailRow label="Category" value={order.craftCategory || '—'} colors={colors} />
          {order.invoiceNumber && <DetailRow label="Invoice #" value={order.invoiceNumber} mono colors={colors} />}
          {order.shipmentId && <DetailRow label="Shipment ID" value={order.shipmentId} mono colors={colors} />}
          {order.carrier && <DetailRow label="Carrier" value={order.carrier} colors={colors} />}
          {order.sourceLink && <DetailRow label="Source" value={order.sourceLink} colors={colors} />}
          {order.description && <DetailRow label="Description" value={order.description} multiline colors={colors} />}
          {order.internalNotes && <DetailRow label="Internal Notes" value={order.internalNotes} multiline colors={colors} />}
          {order.paymentNotes && <DetailRow label="Payment Notes" value={order.paymentNotes} colors={colors} />}
        </Animated.View>

        {/* Tags */}
        {order.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionLabel, { color: colors.subText }]}>Tags</Text>
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
            <Text style={[styles.sectionLabel, { color: colors.subText }]}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {order.photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={[styles.sectionLabel, { color: colors.subText }]}>Timeline</Text>
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <DetailRow label="Created" value={format(new Date(order.createdAt), 'MMM d, yyyy')} colors={colors} />
            {order.acceptedAt && <DetailRow label="Accepted" value={format(new Date(order.acceptedAt), 'MMM d, yyyy')} colors={colors} />}
            {order.shippedAt && <DetailRow label="Shipped" value={format(new Date(order.shippedAt), 'MMM d, yyyy')} colors={colors} />}
            {order.deliveredAt && <DetailRow label="Delivered" value={format(new Date(order.deliveredAt), 'MMM d, yyyy')} colors={colors} />}
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
              businessName={profile.name}
              businessTagline={profile.tagline}
              businessAddress={profile.address}
              gstNumber={profile.gstNumber}
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
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Mark as Shipped</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
              placeholder="Shipment / Tracking ID (optional)"
              placeholderTextColor={colors.subText}
              value={shipmentId}
              onChangeText={setShipmentId}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
              placeholder="Carrier (e.g. DHL, PostNL)"
              placeholderTextColor={colors.subText}
              value={carrier}
              onChangeText={setCarrier}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: colors.cardBorder }]}
                onPress={() => setShowShipModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.subText }]}>Cancel</Text>
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
  colors,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  multiline?: boolean;
  mono?: boolean;
  colors: any;
}) {
  return (
    <View style={[detailStyles.row, multiline && detailStyles.rowMultiline, { borderBottomColor: colors.cardBorder }]}>
      <Text style={[detailStyles.label, { color: colors.subText }]}>{label}</Text>
      <Text
        style={[
          detailStyles.value,
          { color: colors.text },
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
  },
  rowMultiline: {
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontFamily: 'DMSans',
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontSize: 20,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
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
    borderWidth: 2,
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
    textAlign: 'center',
  },
  pipelineLine: {
    position: 'absolute',
    top: 14,
    left: '50%',
    right: '-50%',
    height: 2,
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
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
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
  },
  modalInput: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: 'DMSans',
    fontSize: 15,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalCancel: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'DMSans',
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
