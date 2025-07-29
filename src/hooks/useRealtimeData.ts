import { useEffect, useState } from 'react';

interface RealtimeOptions {
  eventName: 'videoUpdate' | 'contestUpdate';
  onUpdate?: (payload: any) => void;
}

export function useRealtimeData({ eventName, onUpdate }: RealtimeOptions) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      setLastUpdate(new Date());
      if (onUpdate) {
        onUpdate(event.detail);
      }
    };

    window.addEventListener(eventName, handleUpdate as EventListener);

    return () => {
      window.removeEventListener(eventName, handleUpdate as EventListener);
    };
  }, [eventName, onUpdate]);

  return { lastUpdate };
}