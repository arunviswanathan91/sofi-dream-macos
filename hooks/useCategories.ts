import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { getLocalCategories, saveLocalCategories } from '../lib/localStore';
import { DEFAULT_CATEGORIES } from '../types';
import type { CraftCategory } from '../types';
import { generateId } from '../lib/localStore';

export function useCategories() {
  const [categories, setCategories] = useState<CraftCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      getLocalCategories().then((cats) => {
        setCategories(cats);
        setLoading(false);
      });
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        if (snapshot.empty) {
          DEFAULT_CATEGORIES.forEach((cat) =>
            setDoc(doc(db, 'categories', cat.id), cat).catch(console.error)
          );
          setCategories(DEFAULT_CATEGORIES);
        } else {
          const cats = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CraftCategory, 'id'>),
          }));
          setCategories(cats);
        }
        setLoading(false);
      },
      () => {
        getLocalCategories().then((cats) => { setCategories(cats); setLoading(false); });
      }
    );
    return unsubscribe;
  }, []);

  const addCategory = useCallback(async (cat: Omit<CraftCategory, 'id'>): Promise<void> => {
    if (!isFirebaseConfigured) {
      const newCat: CraftCategory = { ...cat, id: generateId() };
      const updated = [...categories, newCat];
      setCategories(updated);
      await saveLocalCategories(updated);
      return;
    }
    await addDoc(collection(db, 'categories'), cat);
  }, [categories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<CraftCategory>): Promise<void> => {
    if (!isFirebaseConfigured) {
      const updated = categories.map((c) => c.id === id ? { ...c, ...updates } : c);
      setCategories(updated);
      await saveLocalCategories(updated);
      return;
    }
    await updateDoc(doc(db, 'categories', id), updates as Record<string, unknown>);
  }, [categories]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    if (!isFirebaseConfigured) {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      await saveLocalCategories(updated);
      return;
    }
    await deleteDoc(doc(db, 'categories', id));
  }, [categories]);

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
