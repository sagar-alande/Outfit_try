export type Fabric = {
  id: string;
  label: string;
  prompt: string;
};

export const FABRICS: Fabric[] = [
  {
    id: "sheer-mesh",
    label: "Sheer mesh",
    prompt: "sheer open-knit mesh fabric, skin visible through the knit, do not thicken into opaque cloth",
  },
  {
    id: "power-mesh",
    label: "Power mesh",
    prompt: "stretch power mesh used in bodysuits and illusion panels, semi-sheer",
  },
  {
    id: "fishnet",
    label: "Fishnet",
    prompt: "fishnet netting with visible holes, skin showing through the net",
  },
  {
    id: "stretch-lace",
    label: "Stretch lace",
    prompt: "stretch lace with patterned motifs and sheer gaps between them",
  },
  {
    id: "chiffon",
    label: "Chiffon / georgette",
    prompt: "light translucent chiffon or georgette drape, not heavy cotton",
  },
  {
    id: "wet-look",
    label: "Wet-look spandex",
    prompt: "high-shine wet-look nylon-elastane, second-skin cling",
  },
  {
    id: "latex",
    label: "Latex",
    prompt: "tight latex rubber with a liquid sheen",
  },
  {
    id: "pvc",
    label: "PVC / vinyl",
    prompt: "glossy PVC or vinyl plastic finish",
  },
  {
    id: "holographic",
    label: "Holographic / metallic",
    prompt: "holographic or metallic foil knit, clubwear shine",
  },
  {
    id: "satin",
    label: "Satin / silk",
    prompt: "liquid satin or silk charmeuse drape",
  },
  {
    id: "microfiber",
    label: "Microfiber jersey",
    prompt: "thin clinging microfiber jersey",
  },
  {
    id: "faux-leather",
    label: "Faux leather",
    prompt: "fashion faux leather, matte or shine as photographed",
  },
];

export function fabricById(id: string): Fabric {
  return FABRICS.find((f) => f.id === id) ?? FABRICS[0];
}
