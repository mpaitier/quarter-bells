// Génère toutes les icônes du site à partir du master du logo (ADR 0013).
//
// Usage : pnpm --filter assets icons
//
// Les fichiers produits sont commités. Aucun ne se retouche à la main : après
// une retouche du logo, réexporter le master depuis Krita, relancer ce script
// et commiter le tout.

import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp, { type Sharp } from "sharp";

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_DIR = join(ASSETS_DIR, "..", "..");
const WEB_DIR = join(REPO_DIR, "apps", "web");

const MASTER = join(ASSETS_DIR, "src", "logo", "quarter-bells-logo-master.png");
const SMALL_LOGO = join(
  ASSETS_DIR,
  "src",
  "logo",
  "quarter-bells-logo-small.svg",
);
const PALETTE = join(ASSETS_DIR, "palettes", "quarter-bells.gpl");

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

// Lit les couleurs nommées de la palette Krita (format GIMP) : une ligne
// « R G B nom » par couleur. La palette est la seule source des couleurs.
async function readPalette(path: string): Promise<ReadonlyMap<string, Rgb>> {
  const colors = new Map<string, Rgb>();
  for (const line of (await readFile(path, "utf8")).split(/\r?\n/)) {
    const match = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s*$/.exec(line);
    if (match === null) {
      continue;
    }
    const [, r, g, b, name] = match;
    colors.set(String(name), { r: Number(r), g: Number(g), b: Number(b) });
  }
  return colors;
}

function requireColor(palette: ReadonlyMap<string, Rgb>, name: string): Rgb {
  const color = palette.get(name);
  if (color === undefined) {
    throw new Error(
      `Couleur « ${name} » absente de ${relative(REPO_DIR, PALETTE)}`,
    );
  }
  return color;
}

// Fond sur lequel le logo est posé.
// - square : carré plein, pour les icônes que le système découpe lui-même.
// - circle : pastille ronde sur fond transparent.
type Background = "square" | "circle";

interface IconSpec {
  // Chemin de sortie, relatif à apps/web.
  readonly file: string;
  readonly size: number;
  readonly background: Background;
  // Diamètre du cercle dans lequel le logo doit tenir entièrement, en
  // fraction du côté. Le logo est réduit pour que la diagonale de son cadre
  // tienne dans ce cercle : aucune partie ne peut être découpée.
  readonly safeCircle: number;
}

const ICONS: readonly IconSpec[] = [
  // iOS remplace la transparence par du noir : fond opaque obligatoire.
  {
    file: "public/apple-touch-icon.png",
    size: 180,
    background: "square",
    safeCircle: 0.9,
  },
  {
    file: "public/icon-192.png",
    size: 192,
    background: "square",
    safeCircle: 0.9,
  },
  {
    file: "public/icon-512.png",
    size: 512,
    background: "square",
    safeCircle: 0.9,
  },
  // Icône « maskable » : le système peut découper tout ce qui sort du cercle
  // central de 80 % du côté.
  {
    file: "public/icon-maskable-512.png",
    size: 512,
    background: "square",
    safeCircle: 0.8,
  },
  // Logo de l'en-tête : affiché à 48 px, dessiné au double pour les écrans
  // haute densité, sur une pastille ronde.
  {
    file: "src/assets/logo-header.png",
    size: 96,
    background: "circle",
    safeCircle: 0.82,
  },
];

function backgroundImage(spec: IconSpec, color: Rgb): Sharp {
  if (spec.background === "square") {
    return sharp({
      create: {
        width: spec.size,
        height: spec.size,
        channels: 4,
        background: { ...color, alpha: 1 },
      },
    });
  }
  const radius = spec.size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(spec.size)}" height="${String(spec.size)}"><circle cx="${String(radius)}" cy="${String(radius)}" r="${String(radius)}" fill="rgb(${String(color.r)},${String(color.g)},${String(color.b)})"/></svg>`;
  return sharp(Buffer.from(svg));
}

async function writeIcon(
  spec: IconSpec,
  logo: Buffer,
  logoWidth: number,
  logoHeight: number,
  color: Rgb,
): Promise<void> {
  // Échelle qui fait tenir la diagonale du logo dans le cercle de sécurité.
  const diagonal = Math.hypot(logoWidth, logoHeight);
  const scale = (spec.safeCircle * spec.size) / diagonal;
  const resized = await sharp(logo)
    .resize(Math.round(logoWidth * scale), Math.round(logoHeight * scale))
    .toBuffer();

  const output = join(WEB_DIR, spec.file);
  await mkdir(dirname(output), { recursive: true });
  await backgroundImage(spec, color)
    .composite([{ input: resized, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(`  ${relative(REPO_DIR, output)} (${String(spec.size)} px)`);
}

async function main(): Promise<void> {
  const palette = await readPalette(PALETTE);
  // Fond de toutes les icônes : l'ardoise contraste avec les trois couleurs
  // du logo. Sur du bleu nuit, le corps de la cloche disparaîtrait ; sur un
  // fond clair, la boule du battant (ADR 0013).
  const background = requireColor(palette, "ardoise");

  // Recadre le master sur le logo : les marges transparentes du document
  // Krita ne doivent pas compter dans le calcul de la taille.
  const { data: logo, info } = await sharp(MASTER)
    .trim()
    .toBuffer({ resolveWithObject: true });

  console.log("Icônes générées :");
  for (const spec of ICONS) {
    await writeIcon(spec, logo, info.width, info.height, background);
  }

  // Favicon : variante D, en SVG pour les navigateurs récents, et en PNG de
  // 32 px pour les autres.
  const faviconSvg = join(WEB_DIR, "public", "favicon.svg");
  await copyFile(SMALL_LOGO, faviconSvg);
  console.log(`  ${relative(REPO_DIR, faviconSvg)}`);

  const faviconPng = join(WEB_DIR, "public", "favicon-32.png");
  await sharp(SMALL_LOGO)
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toFile(faviconPng);
  console.log(`  ${relative(REPO_DIR, faviconPng)} (32 px)`);
}

await main();
