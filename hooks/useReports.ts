import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  subWeeks,
  subMonths,
} from 'date-fns';
import { generateReport } from '../lib/reports';
import type { Order, WeeklyReport } from '../types';

export type ReportPeriod = 'week' | 'month' | 'quarter' | 'custom';

export function useReports(
  orders: Order[],
  period: ReportPeriod,
  customStart?: Date,
  customEnd?: Date
) {
  const report = useMemo((): WeeklyReport => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'quarter':
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case 'custom':
        start = customStart ?? startOfMonth(now);
        end = customEnd ?? endOfMonth(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return generateReport(orders, start, end);
  }, [orders, period, customStart, customEnd]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const activeOrders = orders.filter((o) =>
      ['request', 'accepted'].includes(o.status)
    ).length;

    const dueThisWeek = orders.filter((o) => {
      const due = new Date(o.dueDate);
      return (
        ['request', 'accepted'].includes(o.status) &&
        due >= now &&
        due <= weekEnd
      );
    }).length;

    const shippedCount = orders.filter((o) => o.status === 'shipped').length;

    const monthRevenue = orders
      .filter((o) => {
        const date = new Date(o.createdAt);
        return o.status === 'delivered' && o.isPaid && date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, o) => sum + o.askingPrice, 0);

    const urgentOrders = orders
      .filter((o) => {
        if (!['accepted', 'request'].includes(o.status)) return false;
        const due = new Date(o.dueDate);
        const daysLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft <= 3;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return { activeOrders, dueThisWeek, shippedCount, monthRevenue, urgentOrders };
  }, [orders]);

  return { report, dashboardStats };
}
