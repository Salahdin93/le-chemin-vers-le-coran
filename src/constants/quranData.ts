export const TOTAL_PAGES = 604;

const SURAH_PAGES: { [key: number]: number } = {
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

export const JUZ_DATA = [ { id: 1, name: "Juz 1", page: 1, surah: "Al-Fatiha" }, { id: 2, name: "Juz 2", page: 22, surah: "Al-Baqara" }, { id: 3, name: "Juz 3", page: 42, surah: "Al-Baqara" }, { id: 4, name: "Juz 4", page: 62, surah: "Al-Imran" }, { id: 5, name: "Juz 5", page: 82, surah: "An-Nisa" }, { id: 6, name: "Juz 6", page: 102, surah: "An-Nisa" }, { id: 7, name: "Juz 7", page: 121, surah: "Al-Ma'idah" }, { id: 8, name: "Juz 8", page: 142, surah: "Al-An'am" }, { id: 9, name: "Juz 9", page: 162, surah: "Al-A'raf" }, { id: 10, name: "Juz 10", page: 182, surah: "Al-Anfal" }, { id: 11, name: "Juz 11", page: 201, surah: "At-Tawbah" }, { id: 12, name: "Juz 12", page: 222, surah: "Hud" }, { id: 13, name: "Juz 13", page: 242, surah: "Yusuf" }, { id: 14, name: "Juz 14", page: 262, surah: "Al-Hijr" }, { id: 15, name: "Juz 15", page: 282, surah: "Al-Isra" }, { id: 16, name: "Juz 16", page: 302, surah: "Al-Kahf" }, { id: 17, name: "Juz 17", page: 322, surah: "Al-Anbya" }, { id: 18, name: "Juz 18", page: 342, surah: "Al-Mu'minun" }, { id: 19, name: "Juz 19", page: 362, surah: "Al-Furqan" }, { id: 20, name: "Juz 20", page: 382, surah: "An-Naml" }, { id: 21, name: "Juz 21", page: 402, surah: "Al-'Ankabut" }, { id: 22, name: "Juz 22", page: 422, surah: "Al-Ahzab" }, { id: 23, name: "Juz 23", page: 442, surah: "Ya-Sin" }, { id: 24, name: "Juz 24", page: 462, surah: "Az-Zumar" }, { id: 25, name: "Juz 25", page: 482, surah: "Fussilat" }, { id: 26, name: "Juz 26", page: 502, surah: "Al-Ahqaf" }, { id: 27, name: "Juz 27", page: 522, surah: "Adh-Dhariyat" }, { id: 28, name: "Juz 28", page: 542, surah: "Al-Mujadila" }, { id: 29, name: "Juz 29", page: 562, surah: "Al-Mulk" }, { id: 30, name: "Juz 30", page: 582, surah: "An-Naba" } ];

export const FULL_SURAH_LIST = [ {id: 1, name: "Al-Fatiha", verses: 7}, {id: 2, name: "Al-Baqarah", verses: 286}, {id: 3, name: "Al-Imran", verses: 200}, {id: 4, name: "An-Nisa", verses: 176}, {id: 5, name: "Al-Ma'idah", verses: 120}, {id: 6, name: "Al-An'am", verses: 165}, {id: 7, name: "Al-A'raf", verses: 206}, {id: 8, name: "Al-Anfal", verses: 75}, {id: 9, name: "At-Tawbah", verses: 129}, {id: 10, name: "Yunus", verses: 109}, {id: 11, name: "Hud", verses: 123}, {id: 12, name: "Yusuf", verses: 111}, {id: 13, name: "Ar-Ra'd", verses: 43}, {id: 14, name: "Ibrahim", verses: 52}, {id: 15, name: "Al-Hijr", verses: 99}, {id: 16, name: "An-Nahl", verses: 128}, {id: 17, name: "Al-Isra", verses: 111}, {id: 18, name: "Al-Kahf", verses: 110}, {id: 19, name: "Maryam", verses: 98}, {id: 20, name: "Taha", verses: 135}, {id: 21, name: "Al-Anbya", verses: 112}, {id: 22, name: "Al-Hajj", verses: 78}, {id: 23, name: "Al-Mu'minun", verses: 118}, {id: 24, name: "An-Nur", verses: 64}, {id: 25, name: "Al-Furqan", verses: 77}, {id: 26, name: "Ash-Shu'ara", verses: 227}, {id: 27, name: "An-Naml", verses: 93}, {id: 28, name: "Al-Qasas", verses: 88}, {id: 29, name: "Al-Ankabut", verses: 69}, {id: 30, name: "Ar-Rum", verses: 60}, {id: 31, name: "Luqman", verses: 34}, {id: 32, name: "As-Sajdah", verses: 30}, {id: 33, name: "Al-Ahzab", verses: 73}, {id: 34, name: "Saba", verses: 54}, {id: 35, name: "Fatir", verses: 45}, {id: 36, name: "Ya-Sin", verses: 83}, {id: 37, name: "As-Saffat", verses: 182}, {id: 38, name: "Sad", verses: 88}, {id: 39, name: "Az-Zumar", verses: 75}, {id: 40, name: "Ghafir", verses: 85}, {id: 41, name: "Fussilat", verses: 54}, {id: 42, name: "Ash-Shura", verses: 53}, {id: 43, name: "Az-Zukhruf", verses: 89}, {id: 44, name: "Ad-Dukhan", verses: 59}, {id: 45, name: "Al-Jathiyah", verses: 37}, {id: 46, name: "Al-Ahqaf", verses: 35}, {id: 47, name: "Muhammad", verses: 38}, {id: 48, name: "Al-Fath", verses: 29}, {id: 49, name: "Al-Hujurat", verses: 18}, {id: 50, name: "Qaf", verses: 45}, {id: 51, name: "Adh-Dhariyat", verses: 60}, {id: 52, name: "At-Tur", verses: 49}, {id: 53, name: "An-Najm", verses: 62}, {id: 54, name: "Al-Qamar", verses: 55}, {id: 55, name: "Ar-Rahman", verses: 78}, {id: 56, name: "Al-Waqi'ah", verses: 96}, {id: 57, name: "Al-Hadid", verses: 29}, {id: 58, name: "Al-Mujadila", verses: 22}, {id: 59, name: "Al-Hashr", verses: 24}, {id: 60, name: "Al-Mumtahanah", verses: 13}, {id: 61, name: "As-Saff", verses: 14}, {id: 62, name: "Al-Jumu'ah", verses: 11}, {id: 63, name: "Al-Munafiqun", verses: 11}, {id: 64, name: "At-Taghabun", verses: 18}, {id: 65, name: "At-Talaq", verses: 12}, {id: 66, name: "At-Tahrim", verses: 12}, {id: 67, name: "Al-Mulk", verses: 30}, {id: 68, name: "Al-Qalam", verses: 52}, {id: 69, name: "Al-Haqqah", verses: 52}, {id: 70, name: "Al-Ma'arij", verses: 44}, {id: 71, name: "Nuh", verses: 28}, {id: 72, name: "Al-Jinn", verses: 28}, {id: 73, name: "Al-Muzzammil", verses: 20}, {id: 74, name: "Al-Muddaththir", verses: 56}, {id: 75, name: "Al-Qiyamah", verses: 40}, {id: 76, name: "Al-Insan", verses: 31}, {id: 77, name: "Al-Mursalat", verses: 50}, {id: 78, name: "An-Naba", verses: 40}, {id: 79, name: "An-Nazi'at", verses: 46}, {id: 80, name: "'Abasa", verses: 42}, {id: 81, name: "At-Takwir", verses: 29}, {id: 82, name: "Al-Infitar", verses: 19}, {id: 83, name: "Al-Mutaffifin", verses: 36}, {id: 84, name: "Al-Inshiqaq", verses: 25}, {id: 85, name: "Al-Buruj", verses: 22}, {id: 86, name: "At-Tariq", verses: 17}, {id: 87, name: "Al-A'la", verses: 19}, {id: 88, name: "Al-Ghashiyah", verses: 26}, {id: 89, name: "Al-Fajr", verses: 30}, {id: 90, name: "Al-Balad", verses: 20}, {id: 91, name: "Ash-Shams", verses: 15}, {id: 92, name: "Al-Layl", verses: 21}, {id: 93, name: "Ad-Duha", verses: 11}, {id: 94, name: "Ash-Sharh", verses: 8}, {id: 95, name: "At-Tin", verses: 8}, {id: 96, name: "Al-'Alaq", verses: 19}, {id: 97, name: "Al-Qadr", verses: 5}, {id: 98, name: "Al-Bayyinah", verses: 8}, {id: 99, name: "Az-Zalzalah", verses: 8}, {id: 100, name: "Al-'Adiyat", verses: 11}, {id: 101, name: "Al-Qari'ah", verses: 11}, {id: 102, name: "At-Takathur", verses: 8}, {id: 103, name: "Al-'Asr", verses: 3}, {id: 104, name: "Al-Humazah", verses: 9}, {id: 105, name: "Al-Fil", verses: 5}, {id: 106, name: "Quraysh", verses: 4}, {id: 107, name: "Al-Ma'un", verses: 7}, {id: 108, name: "Al-Kawthar", verses: 3}, {id: 109, name: "Al-Kafirun", verses: 6}, {id: 110, name: "An-Nasr", verses: 3}, {id: 111, name: "Al-Masad", verses: 5}, {id: 112, name: "Al-Ikhlas", verses: 4}, {id: 113, name: "Al-Falaq", verses: 5}, {id: 114, name: "An-Nas", verses: 6} ];

export const SURAH_DATA = FULL_SURAH_LIST.map((surah, index) => {
    const startPage = SURAH_PAGES[surah.id];
    const nextSurahId = index + 2;
    const endPage = (nextSurahId <= 114) ? SURAH_PAGES[nextSurahId] - 1 : TOTAL_PAGES;
    return {
        ...surah,
        startPage,
        endPage: endPage < startPage ? startPage : endPage
    };
});

export const HIZB_DATA = [ { "name": "1", "details": "Al-Fatiha 1 - Al-Baqara 74", "surahs": ["Al-Fatiha", "Al-Baqarah (1-74)"] }, { "name": "2", "details": "Al-Baqara 75 - 141", "surahs": ["Al-Baqarah (75-141)"] }, { "name": "3", "details": "Al-Baqara 142 - 202", "surahs": ["Al-Baqarah (142-202)"] }, { "name": "4", "details": "Al-Baqara 203 - 252", "surahs": ["Al-Baqarah (203-252)"] }, { "name": "5", "details": "Al-Baqara 253 - Al-'Imran 14", "surahs": ["Al-Baqarah (253-286)", "Al-'Imran (1-14)"] }, { "name": "6", "details": "Al-'Imran 15 - 92", "surahs": ["Al-'Imran (15-92)"] }, { "name": "7", "details": "Al-'Imran 93 - 163", "surahs": ["Al-'Imran (93-163)"] }, { "name": "8", "details": "Al-'Imran 164 - An-Nisa 23", "surahs": ["Al-'Imran (164-200)", "An-Nisa' (1-23)"] }, { "name": "9", "details": "An-Nisa 23 - 87", "surahs": ["An-Nisa' (23-87)"] }, { "name": "10", "details": "An-Nisa 88 - 147", "surahs": ["An-Nisa' (88-147)"] }, { "name": "11", "details": "An-Nisa 148 - Al-Maida 26", "surahs": ["An-Nisa' (148-176)", "Al-Ma'idah (1-26)"] }, { "name": "12", "details": "Al-Maida 27 - 81", "surahs": ["Al-Ma'idah (27-81)"] }, { "name": "13", "details": "Al-Maida 82 - Al-An'am 29", "surahs": ["Al-Ma'idah (82-120)", "Al-An'am (1-29)"] }, { "name": "14", "details": "Al-An'am 30 - 110", "surahs": ["Al-An'am (30-110)"] }, { "name": "15", "details": "Al-An'am 111 - 165", "surahs": ["Al-An'am (111-165)"] }, { "name": "16", "details": "Al-A'raf 1 - 84", "surahs": ["Al-A'raf (1-84)"] }, { "name": "17", "details": "Al-A'raf 85 - 170", "surahs": ["Al-A'raf (85-170)"] }, { "name": "18", "details": "Al-A'raf 171 - Al-Anfal 40", "surahs": ["Al-A'raf (171-206)", "Al-Anfal (1-40)"] }, { "name": "19", "details": "Al-Anfal 41 - At-Tawba 33", "surahs": ["An-Anfal (41-75)", "At-Tawbah (1-33)"] }, { "name": "20", "details": "At-Tawba 34 - 89", "surahs": ["At-Tawbah (34-89)"] }, { "name": "21", "details": "At-Tawba 90 - Yunus 25", "surahs": ["At-Tawbah (90-129)", "Yunus (1-25)"] }, { "name": "22", "details": "Yunus 26 - Hud 5", "surahs": ["Yunus (26-109)", "Hud (1-5)"] }, { "name": "23", "details": "Hud 6 - 83", "surahs": ["Hud (6-83)"] }, { "name": "24", "details": "Hud 84 - Yusuf 52", "surahs": ["Hud (84-123)", "Yusuf (1-52)"] }, { "name": "25", "details": "Yusuf 53 - Ar-Ra'd 18", "surahs": ["Yusuf (53-111)", "Ar-Ra'd (1-18)"] }, { "name": "26", "details": "Ar-Ra'd 19 - Ibrahim 52", "surahs": ["Ar-Ra'd (19-43)", "Ibrahim (1-52)"] }, { "name": "27", "details": "Al-Hijr 1 - An-Nahl 50", "surahs": ["Al-Hijr", "An-Nahl (1-50)"] }, { "name": "28", "details": "An-Nahl 51 - 128", "surahs": ["An-Nahl (51-128)"] }, { "name": "29", "details": "Al-Isra 1 - 98", "surahs": ["Al-Isra' (1-98)"] }, { "name": "30", "details": "Al-Isra 99 - Al-Kahf 74", "surahs": ["Al-Isra' (99-111)", "Al-Kahf (1-74)"] }, { "name": "31", "details": "Al-Kahf 75 - Maryam 98", "surahs": ["Al-Kahf (75-110)", "Maryam"] }, { "name": "32", "details": "Taha 1 - 135", "surahs": ["Ta-Ha"] }, { "name": "33", "details": "Al-Anbya 1 - 112", "surahs": ["Al-Anbiya'"] }, { "name": "34", "details": "Al-Hajj 1 - 78", "surahs": ["Al-Hajj"] }, { "name": "35", "details": "Al-Muminun 1 - An-Nur 20", "surahs": ["Al-Mu'minun", "An-Nur (1-20)"] }, { "name": "36", "details": "An-Nur 21 - Al-Furqan 20", "surahs": ["An-Nur (21-64)", "Al-Furqan (1-20)"] }, { "name": "37", "details": "Al-Furqan 21 - Ash-Shu'ara 110", "surahs": ["Al-Furqan (21-77)", "Ash-Shu'ara' (1-110)"] }, { "name": "38", "details": "Ash-Shu'ara 111 - An-Naml 53", "surahs": ["Ash-Shu'ara' (111-227)", "An-Naml (1-53)"] }, { "name": "39", "details": "An-Naml 54 - Al-Qasas 50", "surahs": ["An-Naml (54-93)", "Al-Qasas (1-50)"] }, { "name": "40", "details": "Al-Qasas 51 - Al-'Ankabut 45", "surahs": ["Al-Qasas (51-88)", "Al-'Ankabut (1-45)"] }, { "name": "41", "details": "Al-'Ankabut 46 - Luqman 21", "surahs": ["Al-'Ankabut (46-69)", "Ar-Rum", "Luqman (1-21)"] }, { "name": "42", "details": "Luqman 22 - Al-Ahzab 30", "surahs": ["Luqman (22-34)", "As-Sajdah", "Al-Ahzab (1-30)"] }, { "name": "43", "details": "Al-Ahzab 31 - Saba 23", "surahs": ["Al-Ahzab (31-73)", "Saba' (1-23)"] }, { "name": "44", "details": "Saba 24 - Ya-Sin 27", "surahs": ["Saba' (24-54)", "Fatir", "Ya-Sin (1-27)"] }, { "name": "45", "details": "Ya-Sin 28 - As-Saffat 144", "surahs": ["Ya-Sin (28-83)", "As-Saffat (1-144)"] }, { "name": "46", "details": "As-Saffat 145 - Az-Zumar 31", "surahs": ["As-Saffat (145-182)", "Sad", "Az-Zumar (1-31)"] }, { "name": "47", "details": "Az-Zumar 32 - Ghafir 40", "surahs": ["Az-Zumar (32-75)", "Ghafir (1-40)"] }, { "name": "48", "details": "Ghafir 41 - Fussilat 46", "surahs": ["Ghafir (41-85)", "Fussilat (1-46)"] }, { "name": "49", "details": "Fussilat 47 - Az-Zukhruf 23", "surahs": ["Fussilat (47-54)", "Ash-Shura", "Az-Zukhruf (1-23)"] }, { "name": "50", "details": "Az-Zukhruf 24 - Al-Jathiyah 37", "surahs": ["Az-Zukhruf (24-89)", "Ad-Dukhan", "Al-Jathiyah"] }, { "name": "51", "details": "Al-Ahqaf 1 - Al-Fath 17", "surahs": ["Al-Ahqaf", "Muhammad", "Al-Fath (1-17)"] }, { "name": "52", "details": "Al-Fath 18 - Adh-Dhariyat 30", "surahs": ["Al-Fath (18-29)", "Al-Hujurat", "Qaf", "Adh-Dhariyat (1-30)"] }, { "name": "53", "details": "Adh-Dhariyat 31 - Al-Qamar 55", "surahs": ["Adh-Dhariyat (31-60)", "At-Tur", "An-Najm", "Al-Qamar"] }, { "name": "54", "details": "Ar-Rahman 1 - Al-Hadid 29", "surahs": ["Ar-Rahman", "Al-Waqi'ah", "Al-Hadid"] }, { "name": "55", "details": "Al-Mujadilah 1 - As-Saff 14", "surahs": ["Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah", "As-Saff"] }, { "name": "56", "details": "Al-Jumu'a 1 - At-Tahrim 12", "surahs": ["Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim"] }, { "name": "57", "details": "Al-Mulk 1 - Nuh 28", "surahs": ["Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh"] }, { "name": "58", "details": "Al-Jinn 1 - Al-Mursalat 50", "surahs": ["Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat"] }, { "name": "59", "details": "An-Naba 1 - At-Tariq 17", "surahs": ["An-Naba'", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq"] }, { "name": "60", "details": "Al-A'la 1 - An-Nas 6", "surahs": ["Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat", "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"] } ];

export const SURAH_NAMES_HIZB_MAP: string[][] = HIZB_DATA.map(hizb => {
    const surahSet = new Set<string>();
    hizb.surahs.forEach(surahString => {
        const cleanName = surahString.replace(/ \(\d+-\d+\)$/, '').trim();
        surahSet.add(cleanName);
    });
    return Array.from(surahSet);
});

function normalizeSurahNameForMatch(name: string): string {
    return name.replace(/'/g, '').replace(/\u2019/g, '').trim();
}

function hizbSurahMatchesFullSurah(hizbSurahStr: string, fullSurahName: string): boolean {
    const partBeforeParen = hizbSurahStr.replace(/\s*\([\d\s\-]+\)\s*$/, '').trim();
    const normPart = normalizeSurahNameForMatch(partBeforeParen);
    const normFull = normalizeSurahNameForMatch(fullSurahName);
    return normPart === normFull || normPart.startsWith(normFull) || normFull.startsWith(normPart);
}

export const MEMORIZATION_SURAH_OPTIONS = FULL_SURAH_LIST.map(surah => {
    const parts: { id: string, name: string, hizbs: number[], isFull: boolean, originalSurahId: number }[] = [];
    const hizbsContainingSurah = HIZB_DATA.map((hizb, index) => ({...hizb, hizbNum: index + 1}))
                                        .filter(hizb => hizb.surahs.some(s => hizbSurahMatchesFullSurah(s, surah.name)));
    
    if (hizbsContainingSurah.length > 1) {
        hizbsContainingSurah.forEach(hizb => {
            parts.push({
                id: `${surah.id}-h${hizb.hizbNum}`,
                name: `${surah.name} (Partie du Hizb ${hizb.hizbNum})`,
                hizbs: [hizb.hizbNum],
                isFull: false,
                originalSurahId: surah.id
            });
        });
        parts.push({
            id: surah.id.toString(),
            name: `${surah.name} (Entière)`,
            hizbs: hizbsContainingSurah.map(h => h.hizbNum),
            isFull: true,
            originalSurahId: surah.id
        });
    } else {
        parts.push({
            id: surah.id.toString(),
            name: surah.name,
            hizbs: hizbsContainingSurah.map(h => h.hizbNum),
            isFull: true,
            originalSurahId: surah.id
        });
    }
    return parts;
}).flat();