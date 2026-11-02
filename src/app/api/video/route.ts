import { NextResponse } from "next/server";
import { BOLDNESS_MAX, BOLDNESS_MIN } from "@/lib/body";
import { FABRICS } from "@/lib/fabrics";
import { getProvider } from "@/lib/providers";
import { STOCKING_MODES, type StockingMode } from "@/lib/stockings";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resultImageUrl = String(body.resultImageUrl || "");
    const fabricId = String(body.fabricId || "");
    const stockingMode = String(body.stockingMode || "") as StockingMode;
    const boldness = Number(body.boldness);
    const outfitPrompt = String(body.outfitPrompt || "");
    const ageConfirmed = Boolean(body.ageConfirmed);
    const likenessConsent = Boolean(body.likenessConsent);

    if (!ageConfirmed || !likenessConsent) {
      return NextResponse.json(
        { error: "18+ confirmation and likeness consent are required." },
        { status: 400 },
      );
    }
    if (!resultImageUrl) {
      return NextResponse.json(
        { error: "Generate a still before creating a video." },
        { status: 400 },
      );
    }
    if (!FABRICS.some((f) => f.id === fabricId)) {
      return NextResponse.json({ error: "Invalid fabric." }, { status: 400 });
    }
    if (!STOCKING_MODES.some((s) => s.id === stockingMode)) {
      return NextResponse.json({ error: "Invalid stocking mode." }, { status: 400 });
    }
    if (
      !Number.isFinite(boldness) ||
      boldness < BOLDNESS_MIN ||
      boldness > BOLDNESS_MAX
    ) {
      return NextResponse.json({ error: "Invalid boldness." }, { status: 400 });
    }

    const result = await getProvider().generateVideo({
      resultImageUrl,
      fabricId,
      stockingMode,
      boldness,
      outfitPrompt,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Video generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
