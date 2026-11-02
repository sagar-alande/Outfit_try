# Boldfit

18+ web studio to restyle **body and clothing** on an adult photo (or illustration). **Face and background stay the same.**

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Confirm you are 18+ and have permission to edit the likeness.

Without `FAL_KEY`, **Generate still** still applies your sliders locally: body warp (bust / waist / thickness) plus a fabric/stocking overlay on the person, with the face and side background copied from the original. Photoreal clothing swap needs `FAL_KEY` in `.env.local`.

## Controls

- Body type presets plus bust, waist, thickness
- Boldness 10–100 maps to about 40%–4.5% body covering
- Market fabrics and body-stocking modes (including mesh-only clothing)
- Optional garment photo and outfit notes
- After a still: **Create 15s video** (in-place motion, same face and scene)
