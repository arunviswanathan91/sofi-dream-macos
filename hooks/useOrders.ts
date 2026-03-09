import { useState, useEffect, useCallback } from 'react';
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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Order, OrderFormData, Customer, OrderStatus } from '../types';

function orderFromFirestore(data: Record<string, unknown>, id: string): Order {
  return {
    id,
    orderName: data.orderName as string,
    description: (data.description as string) ?? '',
    photos: (data.photos as string[]) ?? [],
    sourceLink: data.sourceLink as string | undefined,
    customerName: data.customerName as string,
    customerAddress: data.customerAddress as string,
    deliveryTime: (data.deliveryTime as string) ?? '',
    customerPhone: data.customerPhone as string | undefined,
    customerInstagram: data.customerInstagram as string | undefined,
    askingPrice: (data.askingPrice as number) ?? 0,
    currency: (data.currency as string) ?? 'EUR',
    isPaid: (data.isPaid as boolean) ?? false,
    paymentNotes: data.paymentNotes as string | undefined,
    dueDate: (data.dueDate as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    acceptedAt: data.acceptedAt ? (data.acceptedAt as Timestamp).toDate() : undefined,
    shippedAt: data.shippedAt ? (data.shippedAt as Timestamp).toDate() : undefined,
    deliveredAt: data.deliveredAt ? (data.deliveredAt as Timestamp).toDate() : undefined,
    status: (data.status as OrderStatus) ?? 'request',
    shipmentId: data.shipmentId as string | undefined,
    carrier: data.carrier as string | undefined,
    tags: (data.tags as string[]) ?? [],
    craftCategory: (data.craftCategory as string) ?? '',
    internalNotes: data.internalNotes as string | undefined,
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((doc) =>
          orderFromFirestore(doc.data() as Record<string, unknown>, doc.id)
        );
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const addOrder = useCallback(async (formData: OrderFormData): Promise<string> => {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...formData,
      status: 'request' as OrderStatus,
      createdAt: Timestamp.fromDate(new Date()),
      dueDate: Timestamp.fromDate(formData.dueDate),
      photos: formData.photos ?? [],
      tags: formData.tags ?? [],
    });

    // Update customer record
    await upsertCustomer(formData.customerName, formData.customerAddress, docRef.id, formData.askingPrice, formData.customerPhone, formData.customerInstagram);

    return docRef.id;
  }, []);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>): Promise<void> => {
    const docRef = doc(db, 'orders', id);
    const firestoreUpdates: Record<string, unknown> = { ...updates };

    // Convert Date fields to Timestamps
    if (updates.dueDate) firestoreUpdates.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
    if (updates.acceptedAt) firestoreUpdates.acceptedAt = Timestamp.fromDate(new Date(updates.acceptedAt));
    if (updates.shippedAt) firestoreUpdates.shippedAt = Timestamp.fromDate(new Date(updates.shippedAt));
    if (updates.deliveredAt) firestoreUpdates.deliveredAt = Timestamp.fromDate(new Date(updates.deliveredAt));

    await updateDoc(docRef, firestoreUpdates);
  }, []);

  const deleteOrder = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'orders', id));
  }, []);

  const advanceStatus = useCallback(
    async (order: Order, newStatus: OrderStatus, extra?: { shipmentId?: string; carrier?: string }): Promise<void> => {
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

  return {
    orders,
    loading,
    error,
    addOrder,
    updateOrder,
    deleteOrder,
    advanceStatus,
    togglePaid,
  };
}

async function upsertCustomer(
  name: string,
  address: string,
  orderId: string,
  amount: number,
  phone?: string,
  instagram?: string
): Promise<void> {
  const customersRef = collection(db, 'customers');
  const { getDocs, query: fsQuery, where } = await import('firebase/firestore');

  const q = fsQuery(customersRef, where('name', '==', name));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(customersRef, {
      name,
      address,
      phone: phone ?? null,
      instagram: instagram ?? null,
      totalOrders: 1,
      totalSpent: amount,
      orderIds: [orderId],
      createdAt: Timestamp.fromDate(new Date()),
    });
  } else {
    const customerDoc = snapshot.docs[0];
    const data = customerDoc.data() as Customer;
    await updateDoc(doc(db, 'customers', customerDoc.id), {
      totalOrders: (data.totalOrders ?? 0) + 1,
      totalSpent: (data.totalSpent ?? 0) + amount,
      orderIds: [...(data.orderIds ?? []), orderId],
      address,
      phone: phone ?? data.phone ?? null,
      instagram: instagram ?? data.instagram ?? null,
    });
  }
}
