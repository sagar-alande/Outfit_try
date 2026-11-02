import { NextResponse } from "next/server";
import { BOLDNESS_MAX, BOLDNESS_MIN, SLIDER_MAX, SLIDER_MIN } from "@/lib/body";
import { FABRICS } from "@/lib/fabrics";
import { assertAdultConsent, rejectMinorSignals } from "@/lib/moderation";
import { getProvider } from "@/lib/providers";
import { STOCKING_MODES, type StockingMode } from "@/lib/stockings";
import type { BodyTypeId } from "@/lib/body";
import { BODY_TYPES } from "@/lib/body";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const personDataUrl = String(body.personDataUrl || "");
    const garmentDataUrl = body.garmentDataUrl
      ? String(body.garmentDataUrl)
      : undefined;
    const outfitPrompt = String(body.outfitPrompt || "");
    const bodyType = body.bodyType as BodyTypeId;
    const bust = Number(body.bust);
    const waist = Number(body.waist);
    const thickness = Number(body.thickness);
    const boldness = Number(body.boldness);
    const fabricId = String(body.fabricId || "");
    const stockingMode = String(body.stockingMode || "") as StockingMode;
    const ageConfirmed = Boolean(body.ageConfirmed);
    const likenessConsent = Boolean(body.likenessConsent);
    const filename = body.filename ? String(body.filename) : undefined;

    const consent = assertAdultConsent({
      ageConfirmed,
      likenessConsent,
      personDataUrl,
    });
    if (!consent.ok) {
      return NextResponse.json({ error: consent.reason }, { status: 400 });
    }
    const minor = rejectMinorSignals(filename);
    if (!minor.ok) {
      return NextResponse.json({ error: minor.reason }, { status: 400 });
    }

    if (!BODY_TYPES.some((t) => t.id === bodyType)) {
      return NextResponse.json({ error: "Invalid body type." }, { status: 400 });
    }
    for (const [name, value] of [
      ["bust", bust],
      ["waist", waist],
      ["thickness", thickness],
    ] as const) {
      if (!Number.isFinite(value) || value < SLIDER_MIN || value > SLIDER_MAX) {
        return NextResponse.json(
          { error: `Invalid ${name} (use ${SLIDER_MIN}–${SLIDER_MAX}).` },
          { status: 400 },
        );
      }
    }
    if (
      !Number.isFinite(boldness) ||
      boldness < BOLDNESS_MIN ||
      boldness > BOLDNESS_MAX
    ) {
      return NextResponse.json(
        { error: `Boldness must be ${BOLDNESS_MIN}–${BOLDNESS_MAX}.` },
        { status: 400 },
      );
    }
    if (!FABRICS.some((f) => f.id === fabricId)) {
      return NextResponse.json({ error: "Invalid fabric." }, { status: 400 });
    }
    if (!STOCKING_MODES.some((s) => s.id === stockingMode)) {
      return NextResponse.json({ error: "Invalid stocking mode." }, { status: 400 });
    }

    const result = await getProvider().generateStill({
      personDataUrl,
      garmentDataUrl,
      outfitPrompt,
      bodyType,
      bust,
      waist,
      thickness,
      boldness,
      fabricId,
      stockingMode,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
