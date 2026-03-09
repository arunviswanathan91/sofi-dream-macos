import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_CATEGORIES } from '../types';
import type { CraftCategory } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<CraftCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (snapshot.empty) {
        // Seed default categories
        DEFAULT_CATEGORIES.forEach((cat) => {
          setDoc(doc(db, 'categories', cat.id), cat).catch(console.error);
        });
        setCategories(DEFAULT_CATEGORIES);
      } else {
        const cats = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CraftCategory, 'id'>),
        }));
        setCategories(cats);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addCategory = useCallback(async (cat: Omit<CraftCategory, 'id'>): Promise<void> => {
    await addDoc(collection(db, 'categories'), cat);
  }, []);

  const updateCategory = useCallback(
    async (id: string, updates: Partial<CraftCategory>): Promise<void> => {
      await updateDoc(doc(db, 'categories', id), updates as Record<string, unknown>);
    },
    []
  );

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'categories', id));
  }, []);

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
