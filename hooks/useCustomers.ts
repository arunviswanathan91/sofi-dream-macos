import { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const fetched = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name as string,
          address: data.address as string,
          phone: data.phone as string | undefined,
          instagram: data.instagram as string | undefined,
          totalOrders: (data.totalOrders as number) ?? 0,
          totalSpent: (data.totalSpent as number) ?? 0,
          orderIds: (data.orderIds as string[]) ?? [],
          createdAt: (data.createdAt as Timestamp).toDate(),
        } as Customer;
      });
      setCustomers(fetched.sort((a, b) => b.totalSpent - a.totalSpent));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { customers, loading };
}
