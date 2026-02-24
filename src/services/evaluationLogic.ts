import { FULL_SURAH_LIST, HIZB_DATA, SURAH_NAMES_HIZB_MAP } from "../constants/quranData";
import { EvaluationQuestion, Memorizations } from "../types";

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const normalizeSurahName = (name: string | undefined): string => {
  if (typeof name !== 'string' || !name) {
    return '';
  }
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
};

const getHizbFromSurah = (surahName: string): number => {
  const normalizedSurah = normalizeSurahName(surahName);
  const hizbIndex = SURAH_NAMES_HIZB_MAP.findIndex(surahList => 
    surahList.map(normalizeSurahName).includes(normalizedSurah)
  );
  return hizbIndex + 1;
};

const generateHizbSequenceQuestions = (memorizedHizbs: number[], count: number): EvaluationQuestion[] => {
  if (memorizedHizbs.length < 2) return [];
  const questions: EvaluationQuestion[] = [];
  const shuffledHizbs = shuffleArray(memorizedHizbs);
  
  for (let i = 0; i < Math.min(shuffledHizbs.length - 1, count); i++) {
    const currentHizbNum = shuffledHizbs[i];
    const nextHizbNum = currentHizbNum + 1;

    if (HIZB_DATA[nextHizbNum - 1]) {
      const currentHizbDetails = HIZB_DATA[currentHizbNum - 1].details;
      const nextHizbSurahs = HIZB_DATA[nextHizbNum-1].surahs;

      questions.push({
        id: `hizb-seq-${currentHizbNum}`,
        type: "hizb-sequence",
        questionText: `Après le Hizb se terminant par "${currentHizbDetails}", quel Hizb commence ?`,
        correctAnswer: HIZB_DATA[nextHizbNum-1].details,
        itemId: nextHizbNum.toString(),
        itemType: 'hizb'
      });
    }
  }
  return questions;
};

const generateSurahInHizbQuestions = (memorizedHizbs: number[], count: number): EvaluationQuestion[] => {
  const questions: EvaluationQuestion[] = [];
  const shuffledHizbs = shuffleArray(memorizedHizbs);

  for (const hizbNum of shuffledHizbs) {
    if (questions.length >= count) break;
    const hizbIndex = hizbNum - 1;
    const surahsInHizb = SURAH_NAMES_HIZB_MAP[hizbIndex];
    if (surahsInHizb && surahsInHizb.length > 0) {
      const correctSurah = surahsInHizb[Math.floor(Math.random() * surahsInHizb.length)];
      
      let options = [correctSurah];
      while (options.length < 4) {
        const randomSurah = FULL_SURAH_LIST[Math.floor(Math.random() * FULL_SURAH_LIST.length)].name;
        if (!options.includes(randomSurah)) {
          options.push(randomSurah);
        }
      }

      questions.push({
        id: `surah-in-hizb-${hizbNum}-${normalizeSurahName(correctSurah)}`,
        type: 'surah-in-hizb',
        questionText: `Quelle sourate se trouve dans le Hizb ${hizbNum}?`,
        options: shuffleArray(options),
        correctAnswer: correctSurah,
        itemId: hizbNum.toString(),
        itemType: 'hizb'
      });
    }
  }
  return questions;
};

export const generateEvaluation = (memorizations: Memorizations, count: number): EvaluationQuestion[] => {
  const memorizedHizbs = memorizations.hizbs.map(h => Number(h.number));

  const hizbSeqQuestions = generateHizbSequenceQuestions(memorizedHizbs, Math.ceil(count / 2));
  const surahInHizbQuestions = generateSurahInHizbQuestions(memorizedHizbs, Math.floor(count / 2));
  
  const allQuestions = [...hizbSeqQuestions, ...surahInHizbQuestions];
  
  return shuffleArray(allQuestions).slice(0, count);
};