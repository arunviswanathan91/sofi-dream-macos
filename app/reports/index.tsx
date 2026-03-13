import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { useOrders } from '../../hooks/useOrders';
import { useProfile } from '../../hooks/useProfile';
import * as FileSystem from 'expo-file-system';
import { getCurrencySymbol } from '../../lib/theme';
import { useReports } from '../../hooks/useReports';
import { useTheme } from '../../context/ThemeContext';
import { RevenueLineChart, RevenueByCategoryChart } from '../../components/EarningsChart';
import { StatTile } from '../../components/StatTile';
import { generateMonthlyReportHTML } from '../../lib/reports';
import { Colors, Spacing, BorderRadius } from '../../lib/theme';
import type { ReportPeriod } from '../../hooks/useReports';

const PERIOD_OPTIONS: { label: string; value: ReportPeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' },
];

export default function ReportsScreen() {
  const { orders } = useOrders();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const symbol = getCurrencySymbol(profile.currency);
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const [exporting, setExporting] = useState(false);
  const { report } = useReports(orders, period);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const html = generateMonthlyReportHTML(report, orders, profile.name, profile.currency);
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
      const headers = ['Invoice #', 'Order Name', 'Customer', 'Category', 'Due Date', 'Price', 'Currency', 'Status', 'Paid', 'Tags', 'Internal Notes'];
      const escapeCSV = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const rows = orders.map((o) => [
        escapeCSV(o.invoiceNumber ?? ''),
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

  // Adaptive stats columns: 4 on expanded tablet, 3 on medium, 3 on phone (2 rows of 3)
  const statsPerRow = isTablet ? (width >= 840 ? 4 : 3) : 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Reports</Text>

        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelector}
          contentContainerStyle={styles.periodSelectorContent}
        >
          {PERIOD_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.periodChip,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                period === p.value && styles.periodChipActive,
              ]}
              onPress={() => setPeriod(p.value)}
            >
              <Text style={[styles.periodText, { color: colors.subText }, period === p.value && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Summary Stats — adaptive grid */}
        <View style={[styles.statsGrid, isTablet && { paddingHorizontal: Spacing.md }]}>
          {[
            { label: 'Revenue', value: report.totalRevenue, prefix: symbol, accentColor: Colors.rose },
            { label: 'Completed', value: report.ordersCompleted, accentColor: Colors.sage },
            { label: 'Avg Value', value: report.averageOrderValue, prefix: symbol, accentColor: Colors.gold },
            { label: 'Accepted', value: report.ordersAccepted, accentColor: Colors.sky },
            { label: 'Shipped', value: report.ordersShipped, accentColor: Colors.lilac },
            { label: 'Unpaid', value: report.unpaidTotal, prefix: symbol, accentColor: Colors.coral },
          ].map((stat, i) => (
            <View key={stat.label} style={[styles.statTileWrapper, { width: `${100 / statsPerRow}%` }]}>
              <StatTile
                label={stat.label}
                value={stat.value}
                prefix={stat.prefix}
                accentColor={stat.accentColor}
              />
            </View>
          ))}
        </View>

        {/* Top Stats */}
        {(report.topCategory || report.topCustomer.name) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>Highlights</Text>
            <View style={[styles.highlightsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {report.topCategory ? (
                <View style={styles.highlightRow}>
                  <Text style={[styles.highlightLabel, { color: colors.subText }]}>Top Category</Text>
                  <Text style={[styles.highlightValue, { color: colors.text }]}>{report.topCategory}</Text>
                </View>
              ) : null}
              {report.topCustomer.name ? (
                <View style={styles.highlightRow}>
                  <Text style={[styles.highlightLabel, { color: colors.subText }]}>Top Customer</Text>
                  <Text style={[styles.highlightValue, { color: colors.text }]}>
                    {report.topCustomer.name} · {symbol}{report.topCustomer.spent.toFixed(2)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Revenue Over Time</Text>
          <RevenueLineChart data={report.revenueByDay} />
        </View>

        {/* Category Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Revenue by Category</Text>
          <RevenueByCategoryChart data={report.revenueByCategory} />
        </View>

        {/* Export Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>Export</Text>
          <View style={[styles.exportButtons, isTablet && styles.exportButtonsRow]}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: Colors.rose }, isTablet && { flex: 1 }]}
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
              style={[styles.exportButton, { backgroundColor: Colors.sage }, isTablet && { flex: 1 }]}
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
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  periodSelector: {
    marginBottom: Spacing.md,
  },
  periodSelectorContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  periodChipActive: {
    backgroundColor: Colors.rose,
    borderColor: Colors.rose,
  },
  periodText: {
    fontSize: 13,
    fontFamily: 'DMSans',
  },
  periodTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statTileWrapper: {
    padding: 3,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  highlightsCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
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
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  highlightValue: {
    fontSize: 14,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  exportButtons: {
    gap: Spacing.sm,
  },
  exportButtonsRow: {
    flexDirection: 'row',
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
