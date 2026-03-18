import { useEffect, useRef, useState } from 'react';

export const useCountdown = (ttlMin: number, onExpire: () => void, resetKey?: number) => {
  const [secondsLeft, setSecondsLeft] = useState(ttlMin * 60);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsLeft(ttlMin * 60);
  }, [ttlMin]);

  useEffect(() => {
    if (resetKey === undefined) return;
    setSecondsLeft(ttlMin * 60);
  }, [resetKey, ttlMin]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  return secondsLeft;
};
