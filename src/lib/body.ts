export type BodyTypeId =
  | "slim"
  | "athletic"
  | "hourglass"
  | "curvy"
  | "thick"
  | "plus";

export type BodyMetrics = {
  bust: number;
  waist: number;
  thickness: number;
};

export const BODY_TYPES: {
  id: BodyTypeId;
  label: string;
  metrics: BodyMetrics;
}[] = [
  { id: "slim", label: "Slim", metrics: { bust: 4, waist: 3, thickness: 3 } },
  { id: "athletic", label: "Athletic", metrics: { bust: 5, waist: 4, thickness: 5 } },
  { id: "hourglass", label: "Hourglass", metrics: { bust: 8, waist: 3, thickness: 5 } },
  { id: "curvy", label: "Curvy", metrics: { bust: 8, waist: 5, thickness: 6 } },
  { id: "thick", label: "Thick", metrics: { bust: 7, waist: 6, thickness: 8 } },
  { id: "plus", label: "Plus", metrics: { bust: 8, waist: 7, thickness: 9 } },
];

export const SLIDER_MIN = 1;
export const SLIDER_MAX = 10;
export const BOLDNESS_MIN = 10;
export const BOLDNESS_MAX = 100;

/** Maps boldness 10–100 to body covering ~40% down to ~4.5%. */
export function coveragePercent(boldness: number): number {
  const b = Math.min(BOLDNESS_MAX, Math.max(BOLDNESS_MIN, boldness));
  return 40 - ((b - 10) * (40 - 4.5)) / 90;
}

export function roundCoverage(boldness: number): number {
  return Math.round(coveragePercent(boldness) * 10) / 10;
}

export function scaleLabel(value: number): string {
  return `${value}/10`;
}
