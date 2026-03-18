import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Spacing } from '../lib/theme';
import type { ThemeColors } from '../context/ThemeContext';

interface LineProps {
  data: { date: string; amount: number }[];
  title?: string;
  colors: ThemeColors;
}

interface BarProps {
  data: Record<string, number>;
  title?: string;
  colors: ThemeColors;
  currencySymbol?: string;
}

export function RevenueLineChart({ data, title, colors }: LineProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  const labels = data.map((d) => {
    const parts = d.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  }).filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1);

  const values = data.map((d) => d.amount);
  const hasData = values.some((v) => v > 0);

  if (!hasData) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: colors.cardBorder }]}>
        <Text style={[styles.emptyText, { color: colors.subText }]}>No revenue data yet</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(201, 123, 90, ${opacity})`,
    labelColor: () => colors.subText,
    strokeWidth: 2,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.rose,
    },
    propsForBackgroundLines: {
      stroke: colors.cardBorder,
      strokeDasharray: '4',
    },
  };

  return (
    <View>
      {title && <Text style={[styles.chartTitle, { color: colors.subText }]}>{title}</Text>}
      <LineChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={chartWidth}
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

export function RevenueByCategoryChart({ data, title, colors, currencySymbol = '€' }: BarProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 5);

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: colors.cardBorder }]}>
        <Text style={[styles.emptyText, { color: colors.subText }]}>No category data yet</Text>
      </View>
    );
  }

  const labels = entries.map(([k]) => k.slice(0, 8));
  const values = entries.map(([, v]) => v);

  const barChartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(212, 168, 83, ${opacity})`,
    labelColor: () => colors.subText,
    strokeWidth: 2,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: Colors.rose,
    },
    propsForBackgroundLines: {
      stroke: colors.cardBorder,
      strokeDasharray: '4',
    },
  };

  return (
    <View>
      {title && <Text style={[styles.chartTitle, { color: colors.subText }]}>{title}</Text>}
      <BarChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={chartWidth}
        height={160}
        chartConfig={barChartConfig}
        style={styles.chart}
        showValuesOnTopOfBars
        yAxisLabel={currencySymbol}
        yAxisSuffix=""
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    marginVertical: Spacing.sm,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: 'DMSans',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  emptyChart: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: Spacing.sm,
  },
  emptyText: {
    fontFamily: 'DMSans',
    fontSize: 13,
  },
});
