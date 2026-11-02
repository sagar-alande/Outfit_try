export type StockingMode =
  | "none"
  | "under"
  | "mesh-only"
  | "fishnet-only"
  | "sheer-only";

export const STOCKING_MODES: {
  id: StockingMode;
  label: string;
  clothingOnly: boolean;
  prompt: string;
}[] = [
  {
    id: "none",
    label: "None",
    clothingOnly: false,
    prompt: "no body stocking layer",
  },
  {
    id: "under",
    label: "Under the outfit",
    clothingOnly: false,
    prompt:
      "wear a full-body stocking under the outfit as a hosiery layer; keep the same face and background",
  },
  {
    id: "mesh-only",
    label: "Clothing only: mesh body stocking",
    clothingOnly: true,
    prompt:
      "the only clothing is a mesh body stocking (optional shoes/accessories only); no extra opaque garments; mesh remains mesh",
  },
  {
    id: "fishnet-only",
    label: "Clothing only: fishnet body stocking",
    clothingOnly: true,
    prompt:
      "the only clothing is a fishnet body stocking (optional shoes/accessories only); no extra opaque garments",
  },
  {
    id: "sheer-only",
    label: "Clothing only: sheer nylon body stocking",
    clothingOnly: true,
    prompt:
      "the only clothing is a sheer nylon-spandex body stocking (optional shoes/accessories only); no extra opaque garments",
  },
];

export function stockingById(id: string) {
  return STOCKING_MODES.find((s) => s.id === id) ?? STOCKING_MODES[0];
}
