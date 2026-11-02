import { fal } from "@fal-ai/client";
import { Jimp } from "jimp";
import { getFalKey } from "../falKey";
import { restyleLocally } from "../localRestyle";
import { composeKontextPrompt, composeVideoPrompt } from "../prompt";
import { stockingById } from "../stockings";
import type { GenerateJob, VideoJob } from "../types";
import type { ImageProvider, StillResult, VideoResult } from "./types";

const STILL_MODELS = (
  process.env.FAL_STILL_MODEL ||
  "fal-ai/flux-kontext/dev,fal-ai/flux-pro/kontext"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const TRYON_MODEL = process.env.FAL_TRYON_MODEL || "fal-ai/cat-vton";
const VIDEO_MODEL =
  process.env.FAL_VIDEO_MODEL ||
  "fal-ai/kling-video/v2.1/standard/image-to-video";

function configureFal() {
  fal.config({ credentials: getFalKey() });
}

async function compactDataUrl(dataUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(dataUrl)) return dataUrl;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid image data.");
  const buf = Buffer.from(dataUrl.slice(comma + 1), "base64");
  const img = await Jimp.read(buf);
  if (img.width > 1024) {
    img.resize({ w: 1024 });
  }
  return img.getBase64("image/jpeg");
}

function firstImageUrl(result: unknown): string {
  const r = result as {
    image?: { url?: string };
    images?: { url?: string }[];
    output?: { url?: string };
    data?: { images?: { url?: string }[]; image?: { url?: string } };
  };
  const url =
    r.images?.[0]?.url ||
    r.image?.url ||
    r.output?.url ||
    r.data?.images?.[0]?.url ||
    r.data?.image?.url;
  if (!url) throw new Error("Fal still response had no image URL");
  return url;
}

function firstVideoUrl(result: unknown): string {
  const r = result as {
    video?: { url?: string };
    videos?: { url?: string }[];
    data?: { video?: { url?: string } };
  };
  const url = r.video?.url || r.videos?.[0]?.url || r.data?.video?.url;
  if (!url) throw new Error("Fal video response had no video URL");
  return url;
}

function errorText(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { status?: number; message?: string; body?: unknown };
    const body =
      typeof e.body === "string"
        ? e.body
        : e.body
          ? JSON.stringify(e.body)
          : "";
    const msg = [e.status, e.message, body].filter(Boolean).join(" ");
    if (msg) return msg.slice(0, 280);
  }
  return err instanceof Error ? err.message : String(err);
}

export class FalProvider implements ImageProvider {
  async generateStill(job: GenerateJob): Promise<StillResult> {
    const prompt = composeKontextPrompt(job);
    configureFal();
    try {
      const personUrl = await compactDataUrl(job.personDataUrl);
      const stocking = stockingById(job.stockingMode);
      let sourceUrl = personUrl;

      if (job.garmentDataUrl && !stocking.clothingOnly) {
        const garmentUrl = await compactDataUrl(job.garmentDataUrl);
        const tryon = await fal.subscribe(TRYON_MODEL, {
          input: {
            human_image_url: personUrl,
            garment_image_url: garmentUrl,
            cloth_type: "overall",
            enable_safety_checker: false,
          },
        });
        sourceUrl = firstImageUrl(tryon);
      }

      let lastErr = "no model tried";
      for (const model of STILL_MODELS) {
        try {
          const edited = await fal.subscribe(model, {
            input: {
              prompt,
              image_url: sourceUrl,
              guidance_scale: 3.5,
              num_images: 1,
              output_format: "jpeg",
              safety_tolerance: "5",
              enhance_prompt: false,
            },
          });
          return { imageUrl: firstImageUrl(edited), mock: false, prompt };
        } catch (err) {
          lastErr = `${model}: ${errorText(err)}`;
        }
      }
      throw new Error(lastErr);
    } catch (err) {
      const message = errorText(err);
      const imageUrl = await restyleLocally(job);
      const forbidden = /403|forbidden/i.test(message);
      const hint = forbidden
        ? " Fal 403 usually means the key is wrong, has the wrong scope, or the account has no credits. Use an API-scope key from fal.ai/dashboard/keys in the form id:secret (no Key prefix). Storage uploads are no longer used."
        : "";
      return {
        imageUrl,
        mock: true,
        prompt,
        warning: `Live model failed (${message}).${hint} Applied a local restyle instead.`,
      };
    }
  }

  async generateVideo(job: VideoJob): Promise<VideoResult> {
    const prompt = composeVideoPrompt(job);
    configureFal();
    const imageUrl = await compactDataUrl(job.resultImageUrl);
    const result = await fal.subscribe(VIDEO_MODEL, {
      input: {
        prompt,
        image_url: imageUrl,
        duration: "15",
        enable_safety_checker: false,
      },
    });
    return { videoUrl: firstVideoUrl(result), mock: false, prompt };
  }
}
