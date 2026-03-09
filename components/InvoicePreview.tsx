import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../lib/reports';
import { Colors, Spacing, BorderRadius } from '../lib/theme';
import type { Order } from '../types';

interface Props {
  order: Order;
  businessName: string;
  businessTagline?: string;
}

export function InvoicePreview({ order, businessName, businessTagline }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const html = generateInvoiceHTML(order, businessName, businessTagline);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice — ${order.orderName}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol =
    order.currency === 'EUR' ? '€' : order.currency === 'GBP' ? '£' : '$';

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <View style={styles.previewHeader}>
          <Text style={styles.businessName}>{businessName.toUpperCase()}</Text>
          <Text style={styles.invoiceLabel}>INVOICE</Text>
        </View>
        <View style={styles.divider} />
        <Text style={styles.billTo}>{order.customerName}</Text>
        <Text style={styles.address}>{order.customerAddress}</Text>
        <View style={styles.divider} />
        <View style={styles.lineItem}>
          <Text style={styles.itemName}>{order.orderName}</Text>
          <Text style={styles.itemPrice}>
            {currencySymbol}{order.askingPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL DUE</Text>
          <Text style={styles.totalValue}>
            {currencySymbol}{order.askingPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: order.isPaid ? `${Colors.sage}22` : `${Colors.coral}22` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: order.isPaid ? Colors.sage : Colors.coral },
              ]}
            >
              {order.isPaid ? '● PAID' : '○ UNPAID'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGenerate}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.buttonText}>Generate & Share PDF Invoice</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  preview: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    letterSpacing: 2,
  },
  invoiceLabel: {
    fontSize: 14,
    fontFamily: 'DMMono',
    color: Colors.rose,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  billTo: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.bark,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    marginTop: 2,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.bark,
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'DMMono',
    color: Colors.bark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'DMMono',
    color: Colors.muted,
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'DMMono',
    color: Colors.bark,
    fontWeight: '600',
  },
  statusRow: {
    marginTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'DMMono',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.rose,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
});
