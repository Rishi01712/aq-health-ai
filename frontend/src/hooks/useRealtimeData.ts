// src/hooks/useRealtimeData.ts
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface SensorData {
  pm25?: number;
  pm10?: number;
  temp?: number;
  humidity?: number;
  timestamp?: number;
}

export const useRealtimeData = () => {
  const [data, setData] = useState<SensorData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataRef = ref(db, 'latest-reading');  // we will write here from hardware/backend

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const value = snapshot.val();
      setData(value || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, loading };
};