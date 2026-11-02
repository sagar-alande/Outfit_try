"use client";

import { useEffect, useState } from "react";

const KEY = "boldfit-18";

export function AgeGate({ onPass }: { onPass: () => void }) {
  const [ready, setReady] = useState(false);
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === "1") onPass();
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [onPass]);

  if (!ready) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">
          18+ only
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-50">Boldfit</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">
          This studio restyles adult photos: body shape and clothing only. Face
          and background stay the same. It is not for minors and not for editing
          someone without permission.
        </p>
        <label className="mt-5 flex gap-3 text-sm text-stone-200">
          <input
            type="checkbox"
            checked={age}
            onChange={(e) => setAge(e.target.checked)}
            className="mt-1"
          />
          I confirm I am 18 or older.
        </label>
        <label className="mt-3 flex gap-3 text-sm text-stone-200">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1"
          />
          Photos I upload are of me, or I have permission to edit this likeness.
        </label>
        <button
          type="button"
          disabled={!age || !consent}
          onClick={() => {
            try {
              sessionStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            onPass();
          }}
          className="mt-6 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Enter studio
        </button>
      </div>
    </div>
  );
}
