import { getCurrencySymbol } from './theme';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import type { Order, WeeklyReport } from '../types';

export function generateReport(orders: Order[], start: Date, end: Date): WeeklyReport {
  const periodOrders = orders.filter((o) => {
    const createdAt = new Date(o.createdAt);
    return createdAt >= start && createdAt <= end;
  });

  const completedOrders = periodOrders.filter((o) => o.status === 'delivered');
  const acceptedOrders = periodOrders.filter((o) =>
    ['accepted', 'shipped', 'delivered'].includes(o.status)
  );
  const shippedOrders = periodOrders.filter((o) =>
    ['shipped', 'delivered'].includes(o.status)
  );

  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.isPaid ? o.askingPrice : 0), 0);
  const unpaidTotal = periodOrders
    .filter((o) => !o.isPaid && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.askingPrice, 0);

  const averageOrderValue =
    completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Revenue by category
  const revenueByCategory: Record<string, number> = {};
  completedOrders.forEach((o) => {
    if (!revenueByCategory[o.craftCategory]) {
      revenueByCategory[o.craftCategory] = 0;
    }
    revenueByCategory[o.craftCategory] += o.isPaid ? o.askingPrice : 0;
  });

  const topCategory =
    Object.entries(revenueByCategory).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';

  // Revenue by customer
  const revenueByCustomer: Record<string, number> = {};
  completedOrders.forEach((o) => {
    if (!revenueByCustomer[o.customerName]) {
      revenueByCustomer[o.customerName] = 0;
    }
    revenueByCustomer[o.customerName] += o.isPaid ? o.askingPrice : 0;
  });

  const topCustomerEntry = Object.entries(revenueByCustomer).sort(
    ([, a], [, b]) => b - a
  )[0];
  const topCustomer = topCustomerEntry
    ? { name: topCustomerEntry[0], spent: topCustomerEntry[1] }
    : { name: '', spent: 0 };

  // Revenue by day
  const days = eachDayOfInterval({ start, end });
  const revenueByDay = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayOrders = completedOrders.filter(
      (o) => format(new Date(o.deliveredAt ?? o.createdAt), 'yyyy-MM-dd') === dayStr
    );
    return {
      date: dayStr,
      amount: dayOrders.reduce((sum, o) => sum + (o.isPaid ? o.askingPrice : 0), 0),
    };
  });

  return {
    period: { start, end },
    totalRevenue,
    ordersCompleted: completedOrders.length,
    ordersAccepted: acceptedOrders.length,
    ordersShipped: shippedOrders.length,
    averageOrderValue,
    topCategory,
    topCustomer,
    revenueByCategory,
    revenueByDay,
    unpaidTotal,
  };
}

export function generateInvoiceHTML(
  order: Order,
  businessName: string,
  businessTagline?: string,
  invoiceNumber?: string,
  businessAddress?: string,
  gstNumber?: string
): string {
  const currencySymbol = getCurrencySymbol(order.currency);
  const invoiceNum = invoiceNumber ?? `INV-${format(new Date(), 'yyyy')}-${order.id.slice(0, 6).toUpperCase()}`;
  const today = format(new Date(), 'MMM d, yyyy');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #FAF7F2; color: #3D2B1F; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .business-name { font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #3D2B1F; }
    .business-tagline { font-size: 12px; color: #8A7B72; margin-top: 4px; }
    .invoice-label { font-size: 20px; color: #C97B5A; font-weight: bold; letter-spacing: 1px; }
    .invoice-meta { text-align: right; font-size: 12px; color: #8A7B72; margin-top: 4px; }
    .divider { height: 2px; background: linear-gradient(to right, #C97B5A, #D4A853); margin: 20px 0; }
    .bill-to { margin: 20px 0 30px; }
    .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #8A7B72; margin-bottom: 8px; }
    .bill-to p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7B72; border-bottom: 1px solid #E2D8CF; }
    td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F0E8DF; }
    .total-row { font-size: 16px; font-weight: bold; color: #3D2B1F; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; letter-spacing: 1px; }
    .status-paid { background: #8BAF8D22; color: #8BAF8D; }
    .status-unpaid { background: #E07B6A22; color: #E07B6A; }
    .business-address { font-size: 11px; color: #8A7B72; margin-top: 2px; }
    .business-gst { font-size: 11px; color: #8A7B72; margin-top: 2px; font-family: monospace; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #8A7B72; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="business-name">${businessName.toUpperCase()}</div>
      <div class="business-tagline">${businessTagline ?? ''}</div>
      ${businessAddress ? `<div class="business-address">${businessAddress}</div>` : ''}
      ${gstNumber ? `<div class="business-gst">GST: ${gstNumber}</div>` : ''}
    </div>
    <div>
      <div class="invoice-label">INVOICE</div>
      <div class="invoice-meta">${invoiceNum}<br />Date: ${today}</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="bill-to">
    <h3>Bill To</h3>
    <p><strong>${order.customerName}</strong></p>
    <p>${order.customerAddress.replace(/\n/g, '<br />')}</p>
    ${order.customerPhone ? `<p>${order.customerPhone}</p>` : ''}
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Description</th>
        <th style="text-align:right">Price</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${order.orderName}</strong></td>
        <td>${order.description ?? ''}</td>
        <td style="text-align:right; font-family:monospace">${currencySymbol}${order.askingPrice.toFixed(2)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2" style="text-align:right; padding-top:16px">Total Due</td>
        <td style="text-align:right; font-family:monospace">${currencySymbol}${order.askingPrice.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3" style="text-align:right; padding-top:8px">
          <span class="status-badge ${order.isPaid ? 'status-paid' : 'status-unpaid'}">
            ${order.isPaid ? '● PAID' : '○ UNPAID'}
          </span>
        </td>
      </tr>
    </tfoot>
  </table>
  ${order.paymentNotes ? `<p style="font-size:12px;color:#8A7B72;margin-top:16px">Note: ${order.paymentNotes}</p>` : ''}
  <div class="footer">
    <p>Thank you for your order! ✦</p>
    <p style="margin-top:4px">Generated by Sofi Dream App</p>
  </div>
</body>
</html>
  `;
}

export function generateMonthlyReportHTML(
  report: WeeklyReport,
  orders: Order[],
  businessName: string,
  defaultCurrency?: string
): string {
  const periodLabel = `${format(report.period.start, 'MMMM yyyy')} Report`;
  const currencySymbol = getCurrencySymbol(orders[0]?.currency ?? defaultCurrency ?? 'EUR');

  const orderRows = orders
    .filter((o) => {
      const date = new Date(o.createdAt);
      return date >= report.period.start && date <= report.period.end;
    })
    .map(
      (o) => `
    <tr>
      <td>${o.orderName}</td>
      <td>${o.customerName}</td>
      <td>${o.craftCategory}</td>
      <td>${format(new Date(o.createdAt), 'MMM d')}</td>
      <td style="text-align:right;font-family:monospace">${currencySymbol}${o.askingPrice.toFixed(2)}</td>
      <td><span style="text-transform:capitalize">${o.status}</span></td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #FAF7F2; color: #3D2B1F; padding: 40px; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    .period { color: #8A7B72; font-size: 14px; margin-bottom: 30px; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
    .stat-card { background: white; border-radius: 8px; padding: 16px; border-left: 3px solid #C97B5A; }
    .stat-value { font-size: 24px; font-weight: bold; color: #C97B5A; font-family: monospace; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A7B72; margin-top: 4px; }
    .divider { height: 1px; background: #E2D8CF; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 10px; background: #3D2B1F; color: white; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 10px; border-bottom: 1px solid #F0E8DF; }
    .business-address { font-size: 11px; color: #8A7B72; margin-top: 2px; }
    .business-gst { font-size: 11px; color: #8A7B72; margin-top: 2px; font-family: monospace; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #8A7B72; }
  </style>
</head>
<body>
  <h1>${businessName}</h1>
  <div class="period">${periodLabel}</div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${currencySymbol}${report.totalRevenue.toFixed(2)}</div>
      <div class="stat-label">Total Revenue</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.ordersCompleted}</div>
      <div class="stat-label">Completed Orders</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${currencySymbol}${report.averageOrderValue.toFixed(2)}</div>
      <div class="stat-label">Avg Order Value</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.topCategory || '—'}</div>
      <div class="stat-label">Top Category</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.topCustomer.name || '—'}</div>
      <div class="stat-label">Top Customer</div>
    </div>
    <div class="stat-card" style="border-color:#E07B6A">
      <div class="stat-value" style="color:#E07B6A">${currencySymbol}${report.unpaidTotal.toFixed(2)}</div>
      <div class="stat-label">Unpaid Total</div>
    </div>
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Category</th>
        <th>Date</th>
        <th style="text-align:right">Price</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${orderRows}</tbody>
  </table>
  <div class="footer">
    <p>Generated by Sofi Dream App ✦ ${format(new Date(), 'MMMM d, yyyy')}</p>
  </div>
</body>
</html>
  `;
}
