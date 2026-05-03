import { useState, useEffect, useCallback } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyPos = useCallback((pos) => {
    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    // Single watchPosition — covers first-fix + continuous updates
    const watcher = navigator.geolocation.watchPosition(
      (pos) => applyPos(pos),
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 30_000 },
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [applyPos]);

  return { position, error, loading };
}
