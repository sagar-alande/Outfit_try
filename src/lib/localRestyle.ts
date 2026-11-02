import { Jimp } from "jimp";
import { coveragePercent } from "./body";
import { stockingById } from "./stockings";
import type { GenerateJob } from "./types";

const FACE_FRAC = 0.2;
const SIDE_FRAC = 0.18;

const FABRIC_RGB: Record<string, [number, number, number]> = {
  "sheer-mesh": [90, 70, 85],
  "power-mesh": [70, 55, 80],
  fishnet: [40, 32, 36],
  "stretch-lace": [120, 70, 90],
  chiffon: [210, 170, 185],
  "wet-look": [25, 25, 32],
  latex: [18, 16, 18],
  pvc: [12, 12, 20],
  holographic: [140, 90, 210],
  satin: [180, 50, 90],
  microfiber: [50, 70, 90],
  "faux-leather": [55, 32, 28],
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function scaleForRow(t: number, job: GenerateJob) {
  const thick = lerp(0.82, 1.28, (job.thickness - 1) / 9);
  const bust = lerp(0.9, 1.32, (job.bust - 1) / 9);
  const waist = lerp(0.72, 1.18, (job.waist - 1) / 9);
  const chestW = lerp(1, bust, smooth(t, 0.02, 0.22));
  const waistW = lerp(1, waist, smooth(t, 0.22, 0.42) * (1 - smooth(t, 0.42, 0.55)));
  const hipW = lerp(1, lerp(waist, thick, 0.6), smooth(t, 0.48, 0.75));
  return thick * (0.55 * chestW + 0.25 * waistW + 0.2 * hipW);
}

function smooth(t: number, a: number, b: number) {
  if (b <= a) return t >= b ? 1 : 0;
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

function sample(
  data: Buffer,
  w: number,
  h: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const xi = clamp(Math.round(x), 0, w - 1);
  const yi = clamp(Math.round(y), 0, h - 1);
  const i = (yi * w + xi) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function meshHole(x: number, y: number, pitch: number) {
  const gx = x % pitch;
  const gy = y % pitch;
  return gx < 1.4 || gy < 1.4 || Math.abs(gx - gy) < 1.2;
}

function fabricTint(
  x: number,
  y: number,
  fabricId: string,
  stockingId: string,
): { rgb: [number, number, number]; alpha: number; hole: boolean } {
  const rgb = FABRIC_RGB[fabricId] ?? FABRIC_RGB["sheer-mesh"];
  const net =
    fabricId.includes("mesh") ||
    fabricId === "fishnet" ||
    fabricId === "stretch-lace" ||
    stockingId === "mesh-only" ||
    stockingId === "fishnet-only";
  const pitch = fabricId === "fishnet" || stockingId === "fishnet-only" ? 10 : 6;
  const hole = net && meshHole(x, y, pitch);
  let alpha = 0.38;
  if (fabricId === "latex" || fabricId === "pvc" || fabricId === "wet-look") alpha = 0.55;
  if (fabricId === "chiffon" || fabricId === "sheer-mesh") alpha = 0.28;
  if (stockingId === "sheer-only") alpha = 0.22;
  return { rgb, alpha, hole };
}

export async function restyleLocally(job: GenerateJob): Promise<string> {
  const comma = job.personDataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid person image.");
  const buf = Buffer.from(job.personDataUrl.slice(comma + 1), "base64");
  const img = await Jimp.read(buf);
  if (img.width > 1280) {
    img.resize({ w: 1280 });
  }
  const w = img.width;
  const h = img.height;
  const src = Buffer.from(img.bitmap.data);
  const out = Buffer.alloc(src.length);
  src.copy(out);

  const faceEnd = Math.floor(h * FACE_FRAC);
  const x0 = Math.floor(w * SIDE_FRAC);
  const x1 = Math.ceil(w * (1 - SIDE_FRAC));
  const cx = (x0 + x1) / 2;
  const bodyH = Math.max(1, h - faceEnd);
  const cover = coveragePercent(job.boldness) / 100;
  const stocking = stockingById(job.stockingMode);
  const fullStocking = stocking.clothingOnly || stocking.id === "under";

  for (let y = faceEnd; y < h; y++) {
    const t = (y - faceEnd) / bodyH;
    const scale = scaleForRow(t, job);
    for (let x = x0; x < x1; x++) {
      const srcX = cx + (x - cx) / scale;
      const [r, g, b, a] = sample(src, w, h, srcX, y);
      const i = (y * w + x) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = a;
    }
  }

  const coverStart = 0.06;
  const coverEnd = coverStart + cover * 0.9;
  for (let y = faceEnd; y < h; y++) {
    const t = (y - faceEnd) / bodyH;
    const inCover = fullStocking ? true : t >= coverStart && t <= coverEnd;
    if (!inCover) continue;
    for (let x = x0; x < x1; x++) {
      const { rgb, alpha, hole } = fabricTint(x, y, job.fabricId, stocking.id);
      if (hole) continue;
      const i = (y * w + x) * 4;
      const a = fullStocking ? alpha * 0.85 : alpha;
      out[i] = Math.round(lerp(out[i], rgb[0], a));
      out[i + 1] = Math.round(lerp(out[i + 1], rgb[1], a));
      out[i + 2] = Math.round(lerp(out[i + 2], rgb[2], a));
      if (job.fabricId === "latex" || job.fabricId === "wet-look" || job.fabricId === "pvc") {
        const shine = Math.max(0, 1 - Math.abs((x - cx) / ((x1 - x0) * 0.25)));
        const add = shine * 28;
        out[i] = clamp(out[i] + add, 0, 255);
        out[i + 1] = clamp(out[i + 1] + add, 0, 255);
        out[i + 2] = clamp(out[i + 2] + add, 0, 255);
      }
    }
  }

  img.bitmap.data.set(out);
  return img.getBase64("image/png");
}
