import type { GenerateJob, VideoJob } from "../types";

export type StillResult = {
  imageUrl: string;
  mock: boolean;
  prompt: string;
  warning?: string;
};

export type VideoResult = {
  videoUrl: string;
  mock: boolean;
  prompt: string;
};

export interface ImageProvider {
  generateStill(job: GenerateJob): Promise<StillResult>;
  generateVideo(job: VideoJob): Promise<VideoResult>;
}
