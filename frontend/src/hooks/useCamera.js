import { useRef, useState, useCallback } from 'react';

export function useCamera() {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const [active, setActive]   = useState(false);
  const [error,  setError]    = useState(null);
  const [facing, setFacing]   = useState('environment'); // 'environment' | 'user'

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setActive(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [facing]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  const flipCamera = useCallback(() => {
    stop();
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'));
  }, [stop]);

  return { videoRef, active, error, facing, start, stop, capture, flipCamera };
}
