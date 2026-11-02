import type { BodyTypeId } from "./body";
import type { StockingMode } from "./stockings";

export type GenerateJob = {
  personDataUrl: string;
  garmentDataUrl?: string;
  outfitPrompt: string;
  bodyType: BodyTypeId;
  bust: number;
  waist: number;
  thickness: number;
  boldness: number;
  fabricId: string;
  stockingMode: StockingMode;
};

export type VideoJob = {
  resultImageUrl: string;
  fabricId: string;
  stockingMode: StockingMode;
  boldness: number;
  outfitPrompt: string;
};
