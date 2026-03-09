import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing } from '../lib/theme';

const screenWidth = Dimensions.get('window').width;

interface LineProps {
  data: { date: string; amount: number }[];
  title?: string;
}

interface BarProps {
  data: Record<string, number>;
  title?: string;
}

export function RevenueLineChart({ data, title }: LineProps) {
  const labels = data.map((d) => {
    const parts = d.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  }).filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1);

  const values = data.map((d) => d.amount);
  const hasData = values.some((v) => v > 0);

  if (!hasData) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No revenue data yet</Text>
      </View>
    );
  }

  return (
    <View>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <LineChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={screenWidth - 48}
        height={160}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={false}
        withInnerLines={false}
      />
    </View>
  );
}

export function RevenueByCategoryChart({ data, title }: BarProps) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 5);

  if (entries.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No category data yet</Text>
      </View>
    );
  }

  const labels = entries.map(([k]) => k.slice(0, 8));
  const values = entries.map(([, v]) => v);

  return (
    <View>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <BarChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={screenWidth - 48}
        height={160}
        chartConfig={barChartConfig}
        style={styles.chart}
        showValuesOnTopOfBars
        yAxisLabel="€"
        yAxisSuffix=""
        fromZero
      />
    </View>
  );
}

const chartConfig = {
  backgroundGradientFrom: Colors.warmWhite,
  backgroundGradientTo: Colors.warmWhite,
  color: (opacity = 1) => `rgba(201, 123, 90, ${opacity})`,
  labelColor: () => Colors.muted,
  strokeWidth: 2,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: Colors.rose,
  },
  propsForBackgroundLines: {
    stroke: Colors.border,
    strokeDasharray: '4',
  },
};

const barChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(212, 168, 83, ${opacity})`,
};

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    marginVertical: Spacing.sm,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: Colors.muted,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  emptyChart: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.border,
    borderRadius: 12,
    marginVertical: Spacing.sm,
  },
  emptyText: {
    color: Colors.muted,
    fontFamily: 'DMSans',
    fontSize: 13,
  },
});
