"use client";

import { useEffect, useState } from "react";

export function PracticeTimer() {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (left === null || left <= 0) return;
    const id = window.setTimeout(() => setLeft((value) => (value === null ? null : value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [left]);

  return (
    <button
      type="button"
      onClick={() => setLeft(60)}
      className="rounded-full border border-line px-3 py-1.5 text-sm"
    >
      {left === null ? "Practice 60 seconds" : left === 0 ? "Time. Start again" : `${left}s left`}
    </button>
  );
}
