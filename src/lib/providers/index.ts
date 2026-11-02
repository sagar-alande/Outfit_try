import { normalizeFalKey } from "../falKey";
import { LocalRestyleProvider } from "./local";
import { FalProvider } from "./fal";
import type { ImageProvider } from "./types";

export function hasLiveKey(): boolean {
  return Boolean(normalizeFalKey(process.env.FAL_KEY));
}

export function getProvider(): ImageProvider {
  if (hasLiveKey()) {
    return new FalProvider();
  }
  return new LocalRestyleProvider();
}
