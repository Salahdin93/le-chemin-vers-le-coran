import { FULL_SURAH_LIST, HIZB_DATA } from '@/constants/quranData';
import { Memorizations, MemorizedSurahPart, MemorizedHizb, MemorizedJuzz } from '../types/types';

const normalizeSurahName = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

const normalizedSurahNameMap = new Map(
  FULL_SURAH_LIST.map(s => [normalizeSurahName(s.name), s])
);

/**
 * Retourne une liste plate d'IDs de toutes les sourates mémorisées,
 * que ce soit directement ou indirectement via un Hizb ou un Juzz.
 * C'est la source de vérité unique pour connaître les sourates à évaluer.
 * @param memorization L'objet de mémorisation du profil utilisateur.
 * @returns Un tableau de nombres représentant les IDs des sourates.
 */
export const getAllMemorizedSurahIds = (
  memorization: Memorizations | undefined
): number[] => {
  if (!memorization) {
    return [];
  }

  const resultIds = new Set<number>();

  memorization.surahParts.forEach((surah: MemorizedSurahPart) => {
    resultIds.add(surah.originalSurahId);
  });

  const hizbNumbers = new Set<number>();
  memorization.hizbs.forEach((h: MemorizedHizb) => hizbNumbers.add(Number(h.number)));
  memorization.juzz.forEach((j: MemorizedJuzz) => {
    const firstHizb = (j.number - 1) * 2 + 1;
    hizbNumbers.add(firstHizb);
    hizbNumbers.add(firstHizb + 1);
  });

  hizbNumbers.forEach(hizbNum => {
    const hizbData = HIZB_DATA[hizbNum - 1];
    if (!hizbData) return;

    hizbData.surahs.forEach(label => {
      const cleanName = label.replace(/ \(.+$/, '').trim();
      const normalizedName = normalizeSurahName(cleanName);
      const surah = normalizedSurahNameMap.get(normalizedName);
      if (surah) {
        resultIds.add(surah.id);
      }
    });
  });

  return Array.from(resultIds);
};