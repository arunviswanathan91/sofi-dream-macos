import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useOrders } from '../../hooks/useOrders';
import { useProfile } from '../../hooks/useProfile';
import * as FileSystem from 'expo-file-system';
import { getCurrencySymbol } from '../../lib/theme';
import { useReports } from '../../hooks/useReports';
import { RevenueLineChart, RevenueByCategoryChart } from '../../components/EarningsChart';
import { StatTile } from '../../components/StatTile';
import { generateMonthlyReportHTML } from '../../lib/reports';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import type { ReportPeriod } from '../../hooks/useReports';

const PERIOD_OPTIONS: { label: string; value: ReportPeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
];

export default function ReportsScreen() {
  const { orders } = useOrders();
  const { profile } = useProfile();
  const symbol = getCurrencySymbol(profile.currency);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [exporting, setExporting] = useState(false);
  const { report } = useReports(orders, period);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html = generateMonthlyReportHTML(report, orders, profile.name);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${profile.name} — ${format(new Date(), 'MMMM yyyy')} Report`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const headers = ['Order Name', 'Customer', 'Category', 'Due Date', 'Price', 'Currency', 'Status', 'Paid', 'Tags', 'Internal Notes'];
      const escapeCSV = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const rows = orders.map((o) => [
        escapeCSV(o.orderName),
        escapeCSV(o.customerName),
        escapeCSV(o.craftCategory),
        format(new Date(o.dueDate), 'yyyy-MM-dd'),
        o.askingPrice.toFixed(2),
        o.currency,
        o.status,
        o.isPaid ? 'Yes' : 'No',
        escapeCSV(o.tags.join('; ')),
        escapeCSV(o.internalNotes ?? ''),
      ]);
      const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
      const fileName = `${FileSystem.documentDirectory}sofi-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      await FileSystem.writeAsStringAsync(fileName, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileName, {
        mimeType: 'text/csv',
        dialogTitle: `${profile.name} — Orders Export`,
        UTI: 'public.comma-separated-values-text',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to export CSV.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Reports</Text>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIOD_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.periodChip, period === p.value && styles.periodChipActive]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={[styles.periodText, period === p.value && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatTile label="Revenue" value={report.totalRevenue} prefix={symbol} accentColor={Colors.rose} />
          <StatTile label="Completed" value={report.ordersCompleted} accentColor={Colors.sage} />
          <StatTile label="Avg Value" value={report.averageOrderValue} prefix={symbol} accentColor={Colors.gold} />
        </View>

        <View style={styles.statsRow}>
          <StatTile label="Accepted" value={report.ordersAccepted} accentColor={Colors.sky} />
          <StatTile label="Shipped" value={report.ordersShipped} accentColor={Colors.lilac} />
          <StatTile label="Unpaid" value={report.unpaidTotal} prefix={symbol} accentColor={Colors.coral} />
        </View>

        {/* Top Stats */}
        {(report.topCategory || report.topCustomer.name) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            <View style={styles.highlightsCard}>
              {report.topCategory ? (
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>Top Category</Text>
                  <Text style={styles.highlightValue}>{report.topCategory}</Text>
                </View>
              ) : null}
              {report.topCustomer.name ? (
                <View style={styles.highlightRow}>
                  <Text style={styles.highlightLabel}>Top Customer</Text>
                  <Text style={styles.highlightValue}>
                    {report.topCustomer.name} · {symbol}{report.topCustomer.spent.toFixed(2)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Over Time</Text>
          <RevenueLineChart data={report.revenueByDay} />
        </View>

        {/* Category Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue by Category</Text>
          <RevenueByCategoryChart data={report.revenueByCategory} />
        </View>

        {/* Export Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: Colors.rose }]}
              onPress={handleExportPDF}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.exportButtonText}>Export PDF Report</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: Colors.sage }]}
              onPress={handleExportCSV}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>Export CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingBottom: 24 },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay',
    color: Colors.bark,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  periodChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.warmWhite,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  periodText: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.muted,
  },
  periodTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
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
  highlightsCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  highlightLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  highlightValue: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: Colors.bark,
    fontWeight: '600',
  },
  exportButtons: {
    gap: Spacing.sm,
  },
  exportButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  exportButtonText: {
    color: Colors.white,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
});
