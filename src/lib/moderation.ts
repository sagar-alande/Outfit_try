/**
 * Adult-only gates. This does not filter revealing clothing.
 * It only blocks likely minors and missing consent.
 */

export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

function dataUrlMeta(dataUrl: string): { mime: string; bytes: Buffer } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    return { mime: match[1], bytes: Buffer.from(match[2], "base64") };
  } catch {
    return null;
  }
}

export function assertAdultConsent(input: {
  ageConfirmed: boolean;
  likenessConsent: boolean;
  personDataUrl: string;
}): ModerationResult {
  if (!input.ageConfirmed) {
    return { ok: false, reason: "You must confirm you are 18 or older." };
  }
  if (!input.likenessConsent) {
    return {
      ok: false,
      reason:
        "Confirm this photo is of you or that you have permission to edit this likeness.",
    };
  }

  const meta = dataUrlMeta(input.personDataUrl);
  if (!meta) {
    return { ok: false, reason: "Upload a valid person image." };
  }
  if (!meta.mime.startsWith("image/")) {
    return { ok: false, reason: "Person file must be an image." };
  }
  if (meta.bytes.length < 2_000) {
    return { ok: false, reason: "Image is too small to use." };
  }
  if (meta.bytes.length > 12_000_000) {
    return { ok: false, reason: "Image is too large (max about 9 MB)." };
  }

  return { ok: true };
}

/**
 * Heuristic placeholder for a future vision age check.
 * Without a dedicated detector, we refuse clearly labeled child-content filenames
 * if the client sends one, and otherwise rely on the 18+ attestation.
 * Callers must still never send the job if ok is false.
 */
export function rejectMinorSignals(filename?: string): ModerationResult {
  if (!filename) return { ok: true };
  const lower = filename.toLowerCase();
  const blocked = [
    "child",
    "kid",
    "minor",
    "toddler",
    "infant",
    "underage",
    "teen_school",
  ];
  if (blocked.some((w) => lower.includes(w))) {
    return {
      ok: false,
      reason: "This upload looks like it may depict a minor. Boldfit is 18+ only.",
    };
  }
  return { ok: true };
}
