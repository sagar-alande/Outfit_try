import { NextResponse } from "next/server";
import { hasLiveKey } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({
    live: hasLiveKey(),
    provider: hasLiveKey() ? "fal" : "local",
  });
}
