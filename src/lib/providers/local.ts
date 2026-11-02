import { composeStillPrompt, composeVideoPrompt } from "../prompt";
import { restyleLocally } from "../localRestyle";
import type { GenerateJob, VideoJob } from "../types";
import type { ImageProvider, StillResult, VideoResult } from "./types";

export class LocalRestyleProvider implements ImageProvider {
  async generateStill(job: GenerateJob): Promise<StillResult> {
    const imageUrl = await restyleLocally(job);
    return {
      imageUrl,
      mock: true,
      prompt: composeStillPrompt(job),
    };
  }

  async generateVideo(job: VideoJob): Promise<VideoResult> {
    return {
      videoUrl: job.resultImageUrl,
      mock: true,
      prompt: composeVideoPrompt(job),
    };
  }
}
