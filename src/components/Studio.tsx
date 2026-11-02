"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BODY_TYPES,
  BOLDNESS_MAX,
  BOLDNESS_MIN,
  roundCoverage,
  SLIDER_MAX,
  SLIDER_MIN,
  type BodyTypeId,
} from "@/lib/body";
import { FABRICS } from "@/lib/fabrics";
import { STOCKING_MODES, stockingById, type StockingMode } from "@/lib/stockings";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downloadUrl(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.click();
}

export function Studio() {
  const [person, setPerson] = useState<string>("");
  const [personName, setPersonName] = useState<string>("");
  const [garment, setGarment] = useState<string>("");
  const [outfitPrompt, setOutfitPrompt] = useState("");
  const [bodyType, setBodyType] = useState<BodyTypeId>("hourglass");
  const [bust, setBust] = useState(8);
  const [waist, setWaist] = useState(3);
  const [thickness, setThickness] = useState(5);
  const [boldness, setBoldness] = useState(40);
  const [fabricId, setFabricId] = useState(FABRICS[0].id);
  const [stockingMode, setStockingMode] = useState<StockingMode>("none");
  const [busy, setBusy] = useState<"still" | "video" | null>(null);
  const [error, setError] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [resultMock, setResultMock] = useState(false);
  const [warning, setWarning] = useState("");
  const [live, setLive] = useState<boolean | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoMock, setVideoMock] = useState(false);

  const cover = useMemo(() => roundCoverage(boldness), [boldness]);
  const stocking = stockingById(stockingMode);

  const applyType = useCallback((id: BodyTypeId) => {
    const t = BODY_TYPES.find((x) => x.id === id);
    if (!t) return;
    setBodyType(id);
    setBust(t.metrics.bust);
    setWaist(t.metrics.waist);
    setThickness(t.metrics.thickness);
  }, []);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setLive(Boolean(d.live)))
      .catch(() => setLive(false));
  }, []);

  async function onPerson(file: File | undefined) {
    if (!file) return;
    setPersonName(file.name);
    setPerson(await fileToDataUrl(file));
    setResultUrl("");
    setVideoUrl("");
  }

  async function onGarment(file: File | undefined) {
    if (!file) {
      setGarment("");
      return;
    }
    setGarment(await fileToDataUrl(file));
  }

  async function generateStill() {
    setError("");
    setWarning("");
    setBusy("still");
    setVideoUrl("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personDataUrl: person,
          garmentDataUrl: stocking.clothingOnly ? undefined : garment || undefined,
          outfitPrompt,
          bodyType,
          bust,
          waist,
          thickness,
          boldness,
          fabricId,
          stockingMode,
          ageConfirmed: true,
          likenessConsent: true,
          filename: personName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResultUrl(data.imageUrl);
      setResultMock(Boolean(data.mock));
      setWarning(typeof data.warning === "string" ? data.warning : "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateVideo() {
    setError("");
    setBusy("video");
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultImageUrl: resultUrl,
          fabricId,
          stockingMode,
          boldness,
          outfitPrompt,
          ageConfirmed: true,
          likenessConsent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video failed");
      setVideoUrl(data.videoUrl);
      setVideoMock(Boolean(data.mock));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Video failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            18+ studio
          </p>
          <h1 className="text-3xl font-semibold">Boldfit</h1>
          <p className="mt-1 max-w-xl text-sm text-stone-400">
            Restyle body and clothing. Face and background stay locked.
            {live === false
              ? " No Fal key — Generate still warps the body and overlays your fabric/stocking on this photo. Add FAL_KEY in .env.local for photoreal AI."
              : live
                ? " Live Fal models are on."
                : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6">
          <Drop
            label="Person photo (required)"
            accept="image/*"
            preview={person}
            onFile={onPerson}
            capture
          />
          {!stocking.clothingOnly ? (
            <Drop
              label="Garment photo (optional)"
              accept="image/*"
              preview={garment}
              onFile={onGarment}
              clearable
              onClear={() => setGarment("")}
            />
          ) : (
            <p className="text-sm text-stone-400">
              Clothing-only stocking: extra garment photos are ignored so coverage
              stays on the stocking.
            </p>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Outfit notes</span>
            <textarea
              value={outfitPrompt}
              onChange={(e) => setOutfitPrompt(e.target.value)}
              rows={3}
              placeholder={
                stocking.clothingOnly
                  ? "Optional shoes or accessories only"
                  : "Color, cut, or look — coverage slider still wins"
              }
              className="w-full resize-y rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 outline-none ring-rose-500 focus:ring-2"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Body type</p>
            <div className="flex flex-wrap gap-2">
              {BODY_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyType(t.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    bodyType === t.id
                      ? "border-rose-400 bg-rose-600 text-white"
                      : "border-stone-600 bg-stone-900 text-stone-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Bust"
            value={bust}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            onChange={setBust}
          />
          <Slider
            label="Waist (lower = more cinched)"
            value={waist}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            onChange={setWaist}
          />
          <Slider
            label="Body thickness"
            value={thickness}
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            onChange={setThickness}
          />

          <label className="block text-sm">
            <span className="mb-1 flex justify-between font-medium">
              <span>Boldness {boldness}%</span>
              <span className="text-stone-400">
                about {cover}% of the body covered
              </span>
            </span>
            <input
              type="range"
              min={BOLDNESS_MIN}
              max={BOLDNESS_MAX}
              value={boldness}
              onChange={(e) => setBoldness(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Fabric</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FABRICS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFabricId(f.id)}
                  className={`rounded-xl border px-2 py-2 text-left text-xs ${
                    fabricId === f.id
                      ? "border-rose-400 bg-rose-950 text-rose-50"
                      : "border-stone-700 bg-stone-900 text-stone-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Body stocking</span>
            <select
              value={stockingMode}
              onChange={(e) => setStockingMode(e.target.value as StockingMode)}
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100"
            >
              {STOCKING_MODES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            disabled={!person || busy !== null}
            onClick={generateStill}
            className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy === "still" ? "Generating still…" : "Generate still"}
          </button>
          {warning ? (
            <p className="text-sm text-amber-300" role="status">
              {warning}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <section className="space-y-4">
          <p className="text-sm font-medium">Before / after</p>
          <div className="grid grid-cols-2 gap-3">
            <figure className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
              {person ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person} alt="Original" className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-stone-500">
                  Original
                </div>
              )}
              <figcaption className="px-2 py-1 text-center text-xs text-stone-500">
                Original (face &amp; background stay)
              </figcaption>
            </figure>
            <figure className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900">
              {resultUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resultUrl}
                  alt="Restyle result"
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-stone-500">
                  Result
                </div>
              )}
              <figcaption className="px-2 py-1 text-center text-xs text-stone-500">
                Result{" "}
                {resultMock ? "(local restyle from your sliders)" : ""}
              </figcaption>
            </figure>
          </div>

          {resultUrl ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl border border-stone-600 px-4 py-2 text-sm"
                onClick={() => downloadUrl(resultUrl, "boldfit-still.png")}
              >
                Download still
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={generateVideo}
                className="rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 disabled:opacity-40"
              >
                {busy === "video" ? "Creating 15s video…" : "Create 15s video"}
              </button>
            </div>
          ) : null}

          {videoUrl ? (
            <div className="space-y-2">
              {videoMock || !/\.(mp4|webm|mov)(\?|$)/i.test(videoUrl) ? (
                <div className="overflow-hidden rounded-2xl border border-stone-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={videoUrl} alt="Video preview still" className="w-full" />
                  <p className="bg-stone-800 px-3 py-2 text-xs text-stone-300">
                    Local restyle cannot make a 15s clip. Set FAL_KEY in
                    .env.local, then generate a still with live AI and create
                    video.
                  </p>
                </div>
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-2xl border border-stone-700"
                />
              )}
              <button
                type="button"
                className="rounded-xl border border-stone-600 px-4 py-2 text-sm"
                onClick={() =>
                  downloadUrl(
                    videoUrl,
                    videoMock ? "boldfit-video-preview.png" : "boldfit-15s.mp4",
                  )
                }
              >
                Download clip
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex justify-between font-medium">
        <span>{label}</span>
        <span className="text-stone-400">
          {value}/{max}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-rose-500"
      />
    </label>
  );
}

function Drop({
  label,
  accept,
  preview,
  onFile,
  capture,
  clearable,
  onClear,
}: {
  label: string;
  accept: string;
  preview: string;
  onFile: (file: File | undefined) => void;
  capture?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        {clearable && preview ? (
          <button type="button" className="text-xs text-stone-400" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-600 bg-stone-900/60 p-4 text-sm text-stone-400">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mb-2 max-h-40 rounded-lg object-contain" />
        ) : (
          <span>Drop or tap to upload</span>
        )}
        <input
          type="file"
          accept={accept}
          capture={capture ? "environment" : undefined}
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}
