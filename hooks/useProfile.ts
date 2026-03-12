import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { getLocalProfile, saveLocalProfile } from '../lib/localStore';
import { DEFAULT_BUSINESS_PROFILE } from '../types';
import type { BusinessProfile } from '../types';

export function useProfile() {
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      getLocalProfile().then((p) => {
        setProfile(p);
        setLoading(false);
      });
      return;
    }

    const docRef = doc(db, 'settings', 'profile');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setProfile({ ...DEFAULT_BUSINESS_PROFILE, ...(snap.data() as Partial<BusinessProfile>) });
        }
        setLoading(false);
      },
      () => {
        // Firebase failed — fall back to local
        getLocalProfile().then((p) => {
          setProfile(p);
          setLoading(false);
        });
      }
    );
    return unsubscribe;
  }, []);

  const saveProfile = useCallback(async (updates: Partial<BusinessProfile>): Promise<void> => {
    const next = { ...profile, ...updates };
    setProfile(next);
    await saveLocalProfile(next);
    if (isFirebaseConfigured) {
      await setDoc(doc(db, 'settings', 'profile'), next, { merge: true });
    }
  }, [profile]);

  return { profile, loading, saveProfile };
}
