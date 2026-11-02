import { BODY_TYPES, coveragePercent, roundCoverage } from "./body";
import { fabricById } from "./fabrics";
import { stockingById } from "./stockings";
import type { GenerateJob, VideoJob } from "./types";

export const FACE_BG_LOCK =
  "HARD LOCK: do not change the face, facial features, expression, hairline, or head. Do not change, replace, restyle, or invent a new background, location, lighting, or backdrop. Keep the original camera angle. Only change body shape and clothing. If the body becomes thicker, it may occlude more of the SAME original background — never a new scene.";

function bodyPrompt(job: GenerateJob): string {
  const type = BODY_TYPES.find((t) => t.id === job.bodyType);
  return [
    `Reshape the adult body toward a ${type?.label ?? job.bodyType} silhouette.`,
    `Bust volume ${job.bust}/10, waist ${job.waist}/10 (lower is more cinched), overall body thickness ${job.thickness}/10.`,
    "Keep the same pose as far as the body edit allows.",
  ].join(" ");
}

function coveragePrompt(boldness: number): string {
  const cover = roundCoverage(boldness);
  return `Adult fashion. Boldness ${boldness}%. The outfit covers about ${cover}% of the body; remaining skin may show. Do not add extra garments to increase coverage. Do not thicken sheer or mesh fabric to hide the body. Coverage target wins if it conflicts with extra clothing in the text.`;
}

/** Short imperative edit for Kontext-style models (long locks make them no-op). */
export function composeKontextPrompt(job: GenerateJob): string {
  const fabric = fabricById(job.fabricId);
  const stocking = stockingById(job.stockingMode);
  const type = BODY_TYPES.find((t) => t.id === job.bodyType);
  const cover = roundCoverage(job.boldness);
  const outfit = job.outfitPrompt.trim();
  return [
    "Edit this photo. Keep the exact same face, hair, and background.",
    `Change only the adult body and clothes.`,
    `Body: ${type?.label ?? job.bodyType} silhouette, bust ${job.bust}/10, waist ${job.waist}/10 (lower is cinched), thickness ${job.thickness}/10.`,
    stocking.clothingOnly
      ? `Clothes: ${stocking.prompt}. Fabric ${fabric.label}. ${fabric.prompt}.`
      : `Clothes: ${fabric.label}. ${fabric.prompt}.${outfit ? ` Look: ${outfit}.` : ""} ${stocking.id !== "none" ? stocking.prompt : ""}`,
    `The outfit covers about ${cover}% of the body. Do not add coats or extra layers to hide skin.`,
    job.garmentDataUrl && !stocking.clothingOnly
      ? "Match the garment reference on the person."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function composeStillPrompt(job: GenerateJob): string {
  const fabric = fabricById(job.fabricId);
  const stocking = stockingById(job.stockingMode);
  const cover = coveragePercent(job.boldness);
  const parts = [
    FACE_BG_LOCK,
    "Adult subject only. Same person as the input photo.",
    bodyPrompt(job),
    coveragePrompt(job.boldness),
    `Main fabric: ${fabric.label}. ${fabric.prompt}.`,
    stocking.prompt,
  ];

  if (stocking.clothingOnly) {
    parts.push(
      "Clothing-only stocking mode: treat outfit text and garment photos as optional shoes or accessories only. Ignore anything that would add opaque coverage fighting the stocking. Opaque vs open knit should match the coverage percent (solid panels vs mesh holes), not a coat.",
    );
  } else if (job.outfitPrompt.trim()) {
    parts.push(`Outfit description: ${job.outfitPrompt.trim()}.`);
  } else {
    parts.push(
      `Restyle existing clothing to the selected fabric and about ${roundCoverage(job.boldness)}% body covering.`,
    );
  }

  if (job.garmentDataUrl && !stocking.clothingOnly) {
    parts.push(
      "A garment reference image is provided: match that garment’s design on the person while applying the selected fabric and coverage. Keep face and background from the person photo.",
    );
  }

  parts.push(
    `Apply coverage of ${cover.toFixed(1)}% of the body. Preserve adult identity. Photoreal or illustrated to match the input.`,
  );

  return parts.join(" ");
}

export function composeVideoPrompt(job: VideoJob): string {
  const fabric = fabricById(job.fabricId);
  const stocking = stockingById(job.stockingMode);
  return [
    FACE_BG_LOCK,
    "Animate this exact still as a 15-second clip.",
    "Same face, same hair, same background, same outfit, same body.",
    "Subtle in-place motion only: breathing, slight weight shift, or a small turn.",
    "Do not walk into a new scene, pan to a new location, restyle hair or face, or add or remove garments.",
    `Keep ${fabric.label} (${fabric.prompt}).`,
    stocking.id === "none" ? "" : stocking.prompt,
    job.outfitPrompt.trim() ? `Outfit remains: ${job.outfitPrompt.trim()}.` : "",
    `Boldness ${job.boldness}%, about ${roundCoverage(job.boldness)}% body covering — do not increase coverage.`,
  ]
    .filter(Boolean)
    .join(" ");
}
