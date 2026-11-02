/** Normalize FAL_KEY from .env (quotes, Key prefix, whitespace). Never log the value. */
export function normalizeFalKey(raw: string | undefined): string {
  let key = (raw ?? "").trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/^key\s+/i, "").trim();
  return key;
}

export function getFalKey(): string {
  const key = normalizeFalKey(process.env.FAL_KEY);
  if (!key) throw new Error("FAL_KEY is not set");
  return key;
}
