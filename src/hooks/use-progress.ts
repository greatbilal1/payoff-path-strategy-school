import { useCallback, useEffect, useState } from "react";

const KEY = "options-course-progress";

export function useProgress() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = useCallback((id: string, value = true) => {
    setDone((d) => {
      const next = value ? [...new Set([...d, id])] : d.filter((x) => x !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return { done, toggle };
}
