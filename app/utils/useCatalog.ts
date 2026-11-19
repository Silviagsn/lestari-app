import { useEffect, useRef, useState } from 'react';

type CatalogData<Item, Activity> = {
  items: Item[];
  savedIds: number[];
  activity: Activity[];
};

type CatalogAction =
  | { action: 'save'; id: number; saved: boolean }
  | { action: 'enroll'; id: number }
  | { action: 'apply'; id: number; application: Record<string, string> };

export function useCatalog<Item, Activity>(
  catalog: 'jobs' | 'workshops',
  activityId: (activity: Activity) => number,
) {
  const endpoint = `/api/catalog/${catalog}`;
  const [data, setData] = useState<CatalogData<Item, Activity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const writing = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setData(payload);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(failure instanceof Error && failure.message === 'Silakan masuk kembali.'
            ? failure.message
            : 'Data gagal dimuat. Silakan buka ulang halaman ini.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [endpoint]);

  async function mutate(action: CatalogAction) {
    if (!data || writing.current) return false;
    writing.current = true;
    setPending(true);
    setError('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      if (response.status >= 500) throw new Error('Data gagal disimpan. Silakan coba lagi.');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setData((current) => {
        if (!current) return current;
        if (action.action === 'save') {
          const savedIds = current.savedIds.filter((id) => id !== action.id);
          if (payload.saved) savedIds.push(action.id);
          return { ...current, savedIds };
        }
        const activity = current.activity.filter((entry) => activityId(entry) !== action.id);
        return { ...current, activity: [payload.activity, ...activity] };
      });
      return true;
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Data gagal disimpan. Silakan coba lagi.');
      return false;
    } finally {
      writing.current = false;
      setPending(false);
    }
  }

  return { data, loading, pending, error, mutate };
}
