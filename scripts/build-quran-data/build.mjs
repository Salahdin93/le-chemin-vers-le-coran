import { readFile, writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Répertoires de base
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');
const tanzilDir = join(rootDir, 'src', 'tanzil');
const outputDir = join(rootDir, 'public', 'quran-data');

// Constantes extraites de src/constants/quranData.ts (dupliquées ici pour le script de build)
const TOTAL_PAGES = 604;

const SURAH_PAGES = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187, 10: 208,
  11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282, 18: 293, 19: 305,
  20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359, 26: 367, 27: 377, 28: 385,
  29: 396, 30: 404, 31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446,
  38: 453, 39: 458, 40: 467, 41: 477, 42: 483, 43: 489, 44: 496, 45: 499, 46: 502,
  47: 507, 48: 511, 49: 515, 50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531,
  56: 534, 57: 537, 58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556,
  65: 558, 66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
  74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586, 82: 587,
  83: 588, 84: 589, 85: 590, 86: 591, 87: 592, 88: 592, 89: 593, 90: 594, 91: 595,
  92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602, 107: 602, 108: 602,
  109: 603, 110: 603, 111: 603, 112: 604, 113: 604, 114: 604
};

const JUZ_DATA = [
  { id: 1, page: 1 }, { id: 2, page: 22 }, { id: 3, page: 42 }, { id: 4, page: 62 },
  { id: 5, page: 82 }, { id: 6, page: 102 }, { id: 7, page: 121 }, { id: 8, page: 142 },
  { id: 9, page: 162 }, { id: 10, page: 182 }, { id: 11, page: 201 }, { id: 12, page: 222 },
  { id: 13, page: 242 }, { id: 14, page: 262 }, { id: 15, page: 282 }, { id: 16, page: 302 },
  { id: 17, page: 322 }, { id: 18, page: 342 }, { id: 19, page: 362 }, { id: 20, page: 382 },
  { id: 21, page: 402 }, { id: 22, page: 422 }, { id: 23, page: 442 }, { id: 24, page: 462 },
  { id: 25, page: 482 }, { id: 26, page: 502 }, { id: 27, page: 522 }, { id: 28, page: 542 },
  { id: 29, page: 562 }, { id: 30, page: 582 }
];

const FULL_SURAH_LIST = [
  { id: 1, verses: 7 }, { id: 2, verses: 286 }, { id: 3, verses: 200 }, { id: 4, verses: 176 },
  { id: 5, verses: 120 }, { id: 6, verses: 165 }, { id: 7, verses: 206 }, { id: 8, verses: 75 },
  { id: 9, verses: 129 }, { id: 10, verses: 109 }, { id: 11, verses: 123 }, { id: 12, verses: 111 },
  { id: 13, verses: 43 }, { id: 14, verses: 52 }, { id: 15, verses: 99 }, { id: 16, verses: 128 },
  { id: 17, verses: 111 }, { id: 18, verses: 110 }, { id: 19, verses: 98 }, { id: 20, verses: 135 },
  { id: 21, verses: 112 }, { id: 22, verses: 78 }, { id: 23, verses: 118 }, { id: 24, verses: 64 },
  { id: 25, verses: 77 }, { id: 26, verses: 227 }, { id: 27, verses: 93 }, { id: 28, verses: 88 },
  { id: 29, verses: 69 }, { id: 30, verses: 60 }, { id: 31, verses: 34 }, { id: 32, verses: 30 },
  { id: 33, verses: 73 }, { id: 34, verses: 54 }, { id: 35, verses: 45 }, { id: 36, verses: 83 },
  { id: 37, verses: 182 }, { id: 38, verses: 88 }, { id: 39, verses: 75 }, { id: 40, verses: 85 },
  { id: 41, verses: 54 }, { id: 42, verses: 53 }, { id: 43, verses: 89 }, { id: 44, verses: 59 },
  { id: 45, verses: 37 }, { id: 46, verses: 35 }, { id: 47, verses: 38 }, { id: 48, verses: 29 },
  { id: 49, verses: 18 }, { id: 50, verses: 45 }, { id: 51, verses: 60 }, { id: 52, verses: 49 },
  { id: 53, verses: 62 }, { id: 54, verses: 55 }, { id: 55, verses: 78 }, { id: 56, verses: 96 },
  { id: 57, verses: 29 }, { id: 58, verses: 22 }, { id: 59, verses: 24 }, { id: 60, verses: 13 },
  { id: 61, verses: 14 }, { id: 62, verses: 11 }, { id: 63, verses: 11 }, { id: 64, verses: 18 },
  { id: 65, verses: 12 }, { id: 66, verses: 12 }, { id: 67, verses: 30 }, { id: 68, verses: 52 },
  { id: 69, verses: 52 }, { id: 70, verses: 44 }, { id: 71, verses: 28 }, { id: 72, verses: 28 },
  { id: 73, verses: 20 }, { id: 74, verses: 56 }, { id: 75, verses: 40 }, { id: 76, verses: 31 },
  { id: 77, verses: 50 }, { id: 78, verses: 40 }, { id: 79, verses: 46 }, { id: 80, verses: 42 },
  { id: 81, verses: 29 }, { id: 82, verses: 19 }, { id: 83, verses: 36 }, { id: 84, verses: 25 },
  { id: 85, verses: 22 }, { id: 86, verses: 17 }, { id: 87, verses: 19 }, { id: 88, verses: 26 },
  { id: 89, verses: 30 }, { id: 90, verses: 20 }, { id: 91, verses: 15 }, { id: 92, verses: 21 },
  { id: 93, verses: 11 }, { id: 94, verses: 8 }, { id: 95, verses: 8 }, { id: 96, verses: 19 },
  { id: 97, verses: 5 }, { id: 98, verses: 8 }, { id: 99, verses: 8 }, { id: 100, verses: 11 },
  { id: 101, verses: 11 }, { id: 102, verses: 8 }, { id: 103, verses: 3 }, { id: 104, verses: 9 },
  { id: 105, verses: 5 }, { id: 106, verses: 4 }, { id: 107, verses: 7 }, { id: 108, verses: 3 },
  { id: 109, verses: 6 }, { id: 110, verses: 3 }, { id: 111, verses: 5 }, { id: 112, verses: 4 },
  { id: 113, verses: 5 }, { id: 114, verses: 6 }
];

// Source officielle du layout Madani (604 pages) — dérivé de l'API Quran.com
const MADANI_MUSHAF_URL = 'https://raw.githubusercontent.com/hamzakat/madani-muhsaf-json/main/madani-muhsaf.json';

function buildHizbPageRanges() {
  const ranges = [];
  for (let j = 0; j < 30; j++) {
    const juzStart = JUZ_DATA[j].page;
    const juzEnd = j < 29 ? JUZ_DATA[j + 1].page - 1 : TOTAL_PAGES;
    const juzPages = juzEnd - juzStart + 1;
    const half = Math.ceil(juzPages / 2);
    ranges.push({ startPage: juzStart, endPage: juzStart + half - 1 });
    ranges.push({ startPage: juzStart + half, endPage: juzEnd });
  }
  return ranges;
}

const HIZB_PAGE_RANGES = buildHizbPageRanges();

function getJuzFromPage(page) {
  let current = 1;
  for (const j of JUZ_DATA) {
    if (page >= j.page) current = j.id;
  }
  return current;
}

function getHizbFromPage(page) {
  const idx = HIZB_PAGE_RANGES.findIndex(r => page >= r.startPage && page <= r.endPage);
  if (idx === -1) return 1;
  const hizbNum = idx + 1;
  return Math.max(1, Math.min(60, hizbNum));
}

function ruleToClass(rule) {
  if (!rule) return null;
  if (rule === 'ghunnah') return 'ghunnah';
  if (rule === 'ikhfa' || rule === 'ikhfa_shafawi') return 'ikhfa';
  if (rule.startsWith('idghaam')) return 'idgham';
  if (rule === 'iqlab') return 'iqlab';
  if (rule.startsWith('madd_')) return 'madda';
  if (rule === 'qalqalah') return 'qalqala';
  if (rule === 'hamzat_wasl') return 'ham_wasl';
  if (rule === 'lam_shamsiyyah') return 'lam_shamsiyyah';
  if (rule === 'silent') return null;
  return null;
}

async function loadQuranText() {
  const path = join(tanzilDir, 'quran-uthmani.txt');
  const raw = await readFile(path, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const versesBySura = new Map();
  for (const line of lines) {
    const parts = line.split('|');
    if (parts.length < 3) continue;
    const sura = Number(parts[0]);
    const ayah = Number(parts[1]);
    const text = parts.slice(2).join('|');
    if (!versesBySura.has(sura)) versesBySura.set(sura, []);
    versesBySura.get(sura).push({ ayah, text });
  }
  return versesBySura;
}

async function loadTajweedAnnotations() {
  const path = join(tanzilDir, 'quran-tajweed-master', 'output', 'tajweed.hafs.uthmani-pause-sajdah.json');
  const raw = await readFile(path, 'utf8');
  const data = JSON.parse(raw);
  const index = new Map();
  for (const entry of data) {
    const key = `${entry.surah}:${entry.ayah}`;
    index.set(key, entry.annotations || []);
  }
  return index;
}

async function buildMushafMapFromMadani() {
  console.log('Téléchargement du layout Madani (mushaf 604 pages)...');
  const res = await fetch(MADANI_MUSHAF_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} sur ${MADANI_MUSHAF_URL}`);
  }
  const data = await res.json();

  const mushafMap = {};
  const pageVerses = new Map();

  // data est un tableau où chaque entrée (index = numéro de page) contient les segments pour cette page
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const entry = data[page];
    if (!entry) continue;

    const juzNumber = entry.juzNumber ?? getJuzFromPage(page);
    const surahKeys = Object.keys(entry).filter(k => k !== 'juzNumber');
    if (!surahKeys.length) continue;

    // On parcourt les suras de la page dans l'ordre
    surahKeys.sort((a, b) => Number(a) - Number(b));

    const list = [];
    let firstSura = null;
    let firstAyah = null;

    for (const surahKey of surahKeys) {
      const surahObj = entry[surahKey];
      if (!surahObj || !Array.isArray(surahObj.text)) continue;
      const sura = Number(surahObj.chapterNumber ?? surahKey);
      for (const seg of surahObj.text) {
        const ay = Number(seg.verseNumber);
        if (!Number.isFinite(ay)) continue;
        list.push({ sura, ayah: ay });
        if (firstSura === null || sura < firstSura || (sura === firstSura && ay < firstAyah)) {
          firstSura = sura;
          firstAyah = ay;
        }
      }
    }

    if (!list.length || firstSura === null || firstAyah === null) continue;

    pageVerses.set(page, list);
    const hizb = getHizbFromPage(page);
    mushafMap[String(page)] = { sura: firstSura, ayah: firstAyah, juz: juzNumber, hizb };
  }

  return { mushafMap, pageVerses };
}

// Fallback approximatif : distribution régulière des versets sur les plages de pages de SURAH_PAGES
function buildMushafMap(versesBySura) {
  const mushafPages = new Map(); // page -> { sura, ayah }
  const pageVerses = new Map(); // page -> array of { sura, ayah }

  for (const surahMeta of FULL_SURAH_LIST) {
    const suraId = surahMeta.id;
    const versesCount = surahMeta.verses;
    const startPage = SURAH_PAGES[suraId];
    const nextSurahId = suraId + 1;
    const endPage = nextSurahId <= 114 ? SURAH_PAGES[nextSurahId] - 1 : TOTAL_PAGES;
    const pagesForSurah = Math.max(1, endPage - startPage + 1);

    const base = Math.floor(versesCount / pagesForSurah);
    let remainder = versesCount % pagesForSurah;

    let currentAyah = 1;
    for (let p = 0; p < pagesForSurah; p++) {
      const page = startPage + p;
      const count = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      const ayahStart = currentAyah;
      const ayahEnd = Math.min(versesCount, ayahStart + count - 1);

      if (!mushafPages.has(page)) {
        mushafPages.set(page, { sura: suraId, ayah: ayahStart });
      }
      const list = pageVerses.get(page) || [];
      for (let a = ayahStart; a <= ayahEnd; a++) {
        list.push({ sura: suraId, ayah: a });
      }
      pageVerses.set(page, list);

      currentAyah = ayahEnd + 1;
      if (currentAyah > versesCount) break;
    }
  }

  // Ajouter juz / hizb
  const mushafMap = {};
  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const base = mushafPages.get(page);
    if (!base) continue;
    const juz = getJuzFromPage(page);
    const hizb = getHizbFromPage(page);
    mushafMap[String(page)] = { sura: base.sura, ayah: base.ayah, juz, hizb };
  }

  return { mushafMap, pageVerses };
}

function applyTajweedToText(text, annotations) {
  if (!annotations || annotations.length === 0) return text;
  const chars = Array.from(text);
  const rules = new Array(chars.length).fill(null);

  for (const ann of annotations) {
    const start = Math.max(0, Math.min(chars.length, ann.start));
    const end = Math.max(start, Math.min(chars.length, ann.end));
    const cls = ruleToClass(ann.rule);
    if (!cls) continue;
    for (let i = start; i < end; i++) {
      if (!rules[i]) rules[i] = cls;
    }
  }

  let result = '';
  let currentClass = null;
  let buffer = '';

  const flush = () => {
    if (!buffer) return;
    if (currentClass) {
      result += `<span class="${currentClass}">${buffer}</span>`;
    } else {
      result += buffer;
    }
    buffer = '';
  };

  for (let i = 0; i < chars.length; i++) {
    const cls = rules[i];
    if (cls !== currentClass) {
      flush();
      currentClass = cls;
    }
    buffer += chars[i];
  }
  flush();

  return result;
}

async function build() {
  console.log('Lecture du texte Uthmani (quran-uthmani.txt)...');
  const versesBySura = await loadQuranText();

  console.log('Lecture des annotations de tajwid...');
  const tajweedIndex = await loadTajweedAnnotations();

  console.log('Construction du mushaf-map (page -> premier verset) et répartition des versets...');
  let mushafMap;
  let pageVerses;
  try {
    const exact = await buildMushafMapFromMadani();
    mushafMap = exact.mushafMap;
    pageVerses = exact.pageVerses;
    console.log('Layout Madani chargé avec succès (604 pages).');
  } catch (e) {
    console.warn('Impossible de charger le layout Madani, repli sur la distribution approximative :', e?.message ?? e);
    const fallback = buildMushafMap(versesBySura);
    mushafMap = fallback.mushafMap;
    pageVerses = fallback.pageVerses;
  }

  console.log('Génération des versets enrichis (page, juz, hizb, text_tajwid)...');
  const outputVerses = [];

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    const list = pageVerses.get(page);
    if (!list) continue;
    const meta = mushafMap[String(page)];
    const juz = meta ? meta.juz : getJuzFromPage(page);
    const hizb = meta ? meta.hizb : getHizbFromPage(page);

    for (const { sura, ayah } of list) {
      const suraVerses = versesBySura.get(sura) || [];
      const verseObj = suraVerses.find(v => v.ayah === ayah);
      if (!verseObj) continue;
      const text = verseObj.text;
      const key = `${sura}:${ayah}`;
      const annotations = tajweedIndex.get(key) || [];
      const text_tajwid = applyTajweedToText(text, annotations);
      outputVerses.push({
        sura,
        ayah,
        page,
        juz,
        hizb,
        text,
        text_tajwid
      });
    }
  }

  console.log('Écriture des fichiers de sortie dans public/quran-data/ ...');
  await mkdir(outputDir, { recursive: true });

  const hafsPath = join(outputDir, 'hafs-tajwid.json');
  const mushafPagesPath = join(outputDir, 'mushaf-pages.json');
  const surasPath = join(outputDir, 'suras.json');

  await writeFile(hafsPath, JSON.stringify(outputVerses, null, 2), 'utf8');
  await writeFile(mushafPagesPath, JSON.stringify(mushafMap, null, 2), 'utf8');
  await writeFile(surasPath, JSON.stringify(FULL_SURAH_LIST, null, 2), 'utf8');

  console.log('Terminé.');
}

build().catch(err => {
  console.error('Erreur lors de la génération des données du Coran :', err);
  process.exit(1);
});

