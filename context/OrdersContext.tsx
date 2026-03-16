/**
 * OrdersContext — singleton shared state for all order data.
 * Wraps the app at the root level so every screen sees the same
 * orders array and mutations are instantly reflected everywhere.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  getDocs,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  getLocalOrders,
  addLocalOrder,
  updateLocalOrder,
  deleteLocalOrder,
  generateId,
} from '../lib/localStore';
import type { Order, OrderFormData, OrderStatus } from '../types';

// ─── Types ──────────────────────────────────────────────────────
interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  addOrder: (formData: OrderFormData) => Promise<string>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  advanceStatus: (
    order: Order,
    newStatus: OrderStatus,
    extra?: { shipmentId?: string; carrier?: string }
  ) => Promise<void>;
  togglePaid: (order: Order) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

// ─── Firestore deserialiser ──────────────────────────────────────
function orderFromFirestore(data: Record<string, unknown>, id: string): Order {
  const toDate = (v: unknown): Date =>
    v instanceof Timestamp ? v.toDate() : new Date(v as string);

  return {
    id,
    orderName: (data.orderName as string) ?? '',
    description: (data.description as string) ?? '',
    photos: (data.photos as string[]) ?? [],
    sourceLink: (data.sourceLink as string) || undefined,
    customerName: (data.customerName as string) ?? '',
    customerAddress: (data.customerAddress as string) ?? '',
    deliveryTime: (data.deliveryTime as string) ?? '',
    customerPhone: (data.customerPhone as string) || undefined,
    customerInstagram: (data.customerInstagram as string) || undefined,
    askingPrice: (data.askingPrice as number) ?? 0,
    currency: (data.currency as string) ?? 'EUR',
    isPaid: (data.isPaid as boolean) ?? false,
    paymentNotes: (data.paymentNotes as string) || undefined,
    dueDate: toDate(data.dueDate),
    createdAt: toDate(data.createdAt),
    acceptedAt: data.acceptedAt ? toDate(data.acceptedAt) : undefined,
    shippedAt: data.shippedAt ? toDate(data.shippedAt) : undefined,
    deliveredAt: data.deliveredAt ? toDate(data.deliveredAt) : undefined,
    status: (data.status as OrderStatus) ?? 'request',
    shipmentId: (data.shipmentId as string) || undefined,
    carrier: (data.carrier as string) || undefined,
    invoiceNumber: (data.invoiceNumber as string) || undefined,
    tags: (data.tags as string[]) ?? [],
    craftCategory: (data.craftCategory as string) ?? '',
    internalNotes: (data.internalNotes as string) || undefined,
  };
}

// ─── Provider ───────────────────────────────────────────────────
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      getLocalOrders()
        .then(setOrders)
        .finally(() => setLoading(false));
      return;
    }

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((d) =>
          orderFromFirestore(d.data() as Record<string, unknown>, d.id)
        );
        setOrders(fetched);
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore unavailable, using local store:', err.message);
        getLocalOrders()
          .then(setOrders)
          .finally(() => setLoading(false));
      }
    );
    return unsubscribe;
  }, []);

  const addOrder = useCallback(async (formData: OrderFormData): Promise<string> => {
    const year = new Date().getFullYear();
    const shortId = Math.random().toString(36).slice(2, 8).toUpperCase();
    const invoiceNumber = `INV-${year}-${shortId}`;

    if (!isFirebaseConfigured) {
      const id = generateId();
      const order: Order = {
        ...formData,
        id,
        invoiceNumber,
        status: 'request',
        createdAt: new Date(),
        photos: formData.photos ?? [],
        tags: formData.tags ?? [],
      };
      await addLocalOrder(order);
      // Update shared state immediately
      setOrders((prev) => [order, ...prev]);
      return id;
    }

    const docRef = await addDoc(collection(db, 'orders'), {
      ...formData,
      invoiceNumber,
      status: 'request' as OrderStatus,
      createdAt: Timestamp.fromDate(new Date()),
      dueDate: Timestamp.fromDate(new Date(formData.dueDate)),
      photos: formData.photos ?? [],
      tags: formData.tags ?? [],
      sourceLink: formData.sourceLink ?? null,
      customerPhone: formData.customerPhone ?? null,
      customerInstagram: formData.customerInstagram ?? null,
      paymentNotes: formData.paymentNotes ?? null,
      internalNotes: formData.internalNotes ?? null,
    });

    upsertCustomer(
      formData.customerName,
      formData.customerAddress,
      docRef.id,
      formData.askingPrice,
      formData.customerPhone,
      formData.customerInstagram
    ).catch((e) => console.warn('Customer upsert failed:', e));

    return docRef.id;
  }, []);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>): Promise<void> => {
    if (!isFirebaseConfigured) {
      await updateLocalOrder(id, updates);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
      );
      return;
    }

    const firestoreUpdates: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v instanceof Date) {
        firestoreUpdates[k] = Timestamp.fromDate(v);
      } else {
        firestoreUpdates[k] = v ?? null;
      }
    }
    await updateDoc(doc(db, 'orders', id), firestoreUpdates);
    // Optimistic update for Firebase too (real-time listener will confirm)
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  }, []);

  const deleteOrder = useCallback(async (id: string): Promise<void> => {
    // Optimistic update — remove from state immediately
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (!isFirebaseConfigured) {
      await deleteLocalOrder(id);
      return;
    }
    await deleteDoc(doc(db, 'orders', id));
  }, []);

  const advanceStatus = useCallback(
    async (
      order: Order,
      newStatus: OrderStatus,
      extra?: { shipmentId?: string; carrier?: string }
    ): Promise<void> => {
      const now = new Date();
      const updates: Partial<Order> = { status: newStatus };
      if (newStatus === 'accepted') updates.acceptedAt = now;
      if (newStatus === 'shipped') {
        updates.shippedAt = now;
        if (extra?.shipmentId) updates.shipmentId = extra.shipmentId;
        if (extra?.carrier) updates.carrier = extra.carrier;
      }
      if (newStatus === 'delivered') updates.deliveredAt = now;
      await updateOrder(order.id, updates);
    },
    [updateOrder]
  );

  const togglePaid = useCallback(
    async (order: Order): Promise<void> => {
      await updateOrder(order.id, { isPaid: !order.isPaid });
    },
    [updateOrder]
  );

  return (
    <OrdersContext.Provider
      value={{ orders, loading, addOrder, updateOrder, deleteOrder, advanceStatus, togglePaid }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────
export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside <OrdersProvider>');
  return ctx;
}

// ─── Customer upsert (Firebase only) ───────────────────────────
async function upsertCustomer(
  name: string,
  address: string,
  orderId: string,
  amount: number,
  phone?: string,
  instagram?: string
): Promise<void> {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(customersRef, {
      name, address,
      phone: phone ?? null,
      instagram: instagram ?? null,
      totalOrders: 1,
      totalSpent: amount,
      orderIds: [orderId],
      createdAt: Timestamp.fromDate(new Date()),
    });
  } else {
    const customerDoc = snapshot.docs[0];
    const data = customerDoc.data();
    await updateDoc(doc(db, 'customers', customerDoc.id), {
      totalOrders: ((data.totalOrders as number) ?? 0) + 1,
      totalSpent: ((data.totalSpent as number) ?? 0) + amount,
      orderIds: [...((data.orderIds as string[]) ?? []), orderId],
      address,
      phone: phone ?? data.phone ?? null,
      instagram: instagram ?? data.instagram ?? null,
    });
  }
}
