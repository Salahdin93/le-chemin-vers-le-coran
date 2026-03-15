import { FULL_SURAH_LIST, JUZ_DATA, SURAH_DATA, TOTAL_PAGES, HIZB_DATA, HIZB_PAGE_RANGES } from "@/constants/quranData";
import {
    ReadingGoal,
    ReadingHistory,
    PlanDay,
    RevisionGoal,
    Memorizations,
    RevisionPlanDay,
    RevisionUnit,
    MemorizationStatus,
    RevisionFrequency,
    HadithRevisionPlanDay,
    HadithRevisionGoal
} from "@/types";

const chunkArray = <T>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );

/** Hizb (1-60) et juzz à partir d'une page, basé sur les bornes réelles des Juz. */
export const getHizbDetailsFromPage = (page: number) => {
    const hizbNum = HIZB_PAGE_RANGES.findIndex(r => page >= r.startPage && page <= r.endPage) + 1;
    const effectiveHizb = Math.max(1, Math.min(60, hizbNum || 1));
    const juzzNum = Math.floor((effectiveHizb - 1) / 2) + 1;
    const surah = SURAH_DATA.find(s => page >= s.startPage && page <= s.endPage);
    const surahName = surah ? surah.name : "Inconnue";
    return { hizbNum: effectiveHizb, juzzNum, surahName };
};

/** Numéro de hizb (1-60) pour une page. */
const getHizbNumFromPage = (page: number): number =>
    Math.max(1, Math.min(60, HIZB_PAGE_RANGES.findIndex(r => page >= r.startPage && page <= r.endPage) + 1 || 1));

/** Répartition des 60 hizbs sur N jours normaux (sans chevauchement). */
const getHizbsPerDaySchedule = (normalDaysCount: number): number[] => {
    if (normalDaysCount <= 0) return [];
    const base = Math.floor(60 / normalDaysCount);
    const remainder = 60 % normalDaysCount;
    return Array.from({ length: normalDaysCount }, (_, i) => base + (i < remainder ? 1 : 0));
};

export const generateReadingPlan = (readingGoal: ReadingGoal, startDateString: string): PlanDay[] => {
    const { duration, khatmas, kahfOption, kahfPages } = readingGoal;
    const startDate = new Date(startDateString);
    const totalPagesToRead = TOTAL_PAGES * khatmas;
    let pagesForNormalDays = totalPagesToRead;
    let fridaysCount = 0;
    if (kahfOption) {
        for (let i = 0; i < duration; i++) {
            const tempDate = new Date(startDate);
            tempDate.setDate(startDate.getDate() + i);
            if (tempDate.getDay() === 5) fridaysCount++;
        }
        pagesForNormalDays -= (fridaysCount * (kahfPages || 0));
    }
    const normalDaysCount = duration - fridaysCount;
    const useHizbAlignment = khatmas === 1;
    const hizbsPerDaySchedule = useHizbAlignment ? getHizbsPerDaySchedule(normalDaysCount) : [];
    const pagesPerNormalDay = !useHizbAlignment && normalDaysCount > 0 ? Math.floor(pagesForNormalDays / normalDaysCount) : 0;
    let extraPages = !useHizbAlignment && normalDaysCount > 0 ? pagesForNormalDays % normalDaysCount : 0;
    const plan: PlanDay[] = [];
    let currentPage = 1;
    let normalDayIdx = 0;
    for (let day = 1; day <= duration; day++) {
        const tempDate = new Date(startDate);
        tempDate.setDate(startDate.getDate() + day - 1);
        const isKahfDay = !!(kahfOption && tempDate.getDay() === 5);
        let pagesToday: number;
        let startPage: number;
        let endPage: number;
        if (isKahfDay) {
            pagesToday = kahfPages || 0;
            startPage = currentPage > totalPagesToRead ? (((currentPage - 1) % TOTAL_PAGES) + 1) : Math.min(currentPage, TOTAL_PAGES);
            endPage = Math.min(currentPage + pagesToday - 1, totalPagesToRead);
            if (endPage > TOTAL_PAGES) endPage = ((endPage - 1) % TOTAL_PAGES) + 1;
        } else if (useHizbAlignment && hizbsPerDaySchedule.length > 0) {
            const hizbsToAssign = hizbsPerDaySchedule[normalDayIdx] ?? 2;
            normalDayIdx++;
            const effectivePage = ((currentPage - 1) % TOTAL_PAGES) + 1;
            const startHizb = getHizbNumFromPage(effectivePage);
            const endHizb = Math.min(60, startHizb + hizbsToAssign - 1);
            const rangeStart = HIZB_PAGE_RANGES[startHizb - 1];
            const rangeEnd = HIZB_PAGE_RANGES[endHizb - 1];
            startPage = rangeStart ? rangeStart.startPage : effectivePage;
            endPage = rangeEnd ? rangeEnd.endPage : Math.min(effectivePage + 19, TOTAL_PAGES);
            pagesToday = endPage - startPage + 1;
        } else {
            pagesToday = pagesPerNormalDay + (extraPages > 0 ? 1 : 0);
            if (extraPages > 0) extraPages--;
            startPage = currentPage > totalPagesToRead ? (((currentPage - 1) % TOTAL_PAGES) + 1) : Math.min(currentPage, TOTAL_PAGES);
            endPage = Math.min(currentPage + pagesToday - 1, totalPagesToRead);
            if (endPage > TOTAL_PAGES) endPage = ((endPage - 1) % TOTAL_PAGES) + 1;
        }
        plan.push({
            day,
            startPage,
            endPage,
            pages: pagesToday,
            recalculatedPages: pagesToday,
            isKahfDay,
        });
        currentPage += pagesToday;
        if (currentPage > totalPagesToRead) currentPage = 1;
    }
    return plan;
};

/** Pages/jour cible pour la reprise (durée = total jours, jours restants = duration - existingDaysRead). */
export const getTargetPagesPerDayResume = (
    duration: number,
    existingDaysRead: number,
    khatmas: number,
    existingPagesRead: number,
    kahfOption: boolean,
    kahfPages: number
): number => {
    const daysRemaining = Math.max(1, duration - existingDaysRead);
    const totalToRead = TOTAL_PAGES * khatmas;
    const remaining = Math.max(0, totalToRead - existingPagesRead);
    let pagesForNormalDays = remaining;
    let fridaysCount = 0;
    if (kahfOption && kahfPages > 0) {
        const start = new Date();
        for (let i = 0; i < daysRemaining; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            if (d.getDay() === 5) fridaysCount++;
        }
        pagesForNormalDays = Math.max(0, remaining - fridaysCount * kahfPages);
    }
    const normalDaysCount = daysRemaining - fridaysCount;
    return normalDaysCount > 0 ? Math.round(pagesForNormalDays / normalDaysCount) : 0;
};

/** Répartition de N hizbs sur J jours. */
const getHizbsPerDayForRemaining = (remainingHizbs: number, normalDaysCount: number): number[] => {
    if (normalDaysCount <= 0 || remainingHizbs <= 0) return [];
    const base = Math.floor(remainingHizbs / normalDaysCount);
    const remainder = remainingHizbs % normalDaysCount;
    return Array.from({ length: normalDaysCount }, (_, i) => Math.max(1, base + (i < remainder ? 1 : 0)));
};

/** Répartition des hizbs par jour pour approcher la cible pages/jour (alignement hizb conservé). */
const getHizbsPerDayByTargetPages = (
    startHizb: number,
    endHizb: number,
    normalDaysCount: number,
    targetPagesPerDay: number,
    tolerance: number = 5
): number[] => {
    if (normalDaysCount <= 0 || startHizb > endHizb || targetPagesPerDay <= 0) return [];
    const pageCounts: number[] = [];
    for (let h = startHizb - 1; h < endHizb && h < HIZB_PAGE_RANGES.length; h++) {
        const r = HIZB_PAGE_RANGES[h];
        pageCounts.push(r.endPage - r.startPage + 1);
    }
    const result: number[] = [];
    let hizbIdx = 0;
    for (let day = 0; day < normalDaysCount && hizbIdx < pageCounts.length; day++) {
        let dayPages = 0;
        let hizbsThisDay = 0;
        while (hizbIdx < pageCounts.length) {
            const nextPages = pageCounts[hizbIdx];
            const wouldExceed = dayPages + nextPages > targetPagesPerDay + tolerance;
            if (wouldExceed && hizbsThisDay >= 1) break;
            dayPages += nextPages;
            hizbsThisDay++;
            hizbIdx++;
        }
        result.push(Math.max(1, hizbsThisDay));
    }
    while (hizbIdx < pageCounts.length) {
        let dayPages = 0;
        let hizbsThisDay = 0;
        while (hizbIdx < pageCounts.length) {
            const nextPages = pageCounts[hizbIdx];
            if (dayPages + nextPages > targetPagesPerDay + tolerance && hizbsThisDay >= 1) break;
            dayPages += nextPages;
            hizbsThisDay++;
            hizbIdx++;
        }
        result.push(Math.max(1, hizbsThisDay));
    }
    return result;
};

/** Plan for resume: duration = total days to finish; effective days = duration - existingDaysRead. Remaining pages spread over that, aligned to hizbs. */
export const generateReadingPlanResume = (
    readingGoal: ReadingGoal,
    startDateString: string,
    options: { existingPagesRead: number; existingDaysRead?: number }
): PlanDay[] => {
    const { duration, khatmas, kahfOption, kahfPages } = readingGoal;
    const daysRemaining = Math.max(1, duration - (options.existingDaysRead ?? 0));
    const startDate = new Date(startDateString);
    const totalPagesToRead = TOTAL_PAGES * khatmas;
    const remainingPages = Math.max(0, totalPagesToRead - options.existingPagesRead);
    let pagesForNormalDays = remainingPages;
    let fridaysCount = 0;
    if (kahfOption && (kahfPages ?? 0) > 0) {
        for (let i = 0; i < daysRemaining; i++) {
            const tempDate = new Date(startDate);
            tempDate.setDate(startDate.getDate() + i);
            if (tempDate.getDay() === 5) fridaysCount++;
        }
        pagesForNormalDays = Math.max(0, remainingPages - fridaysCount * (kahfPages ?? 0));
    }
    const normalDaysCount = daysRemaining - fridaysCount;
    const useHizbAlignment = khatmas === 1 && options.existingPagesRead < TOTAL_PAGES;
    const startPageResume = options.existingPagesRead + 1;
    const effectiveStartPage = ((startPageResume - 1) % TOTAL_PAGES) + 1;
    const startHizbResume = useHizbAlignment ? getHizbNumFromPage(effectiveStartPage) : 0;
    const remainingHizbs = useHizbAlignment ? Math.max(1, 60 - startHizbResume + 1) : 0;
    const targetPagesPerDay = normalDaysCount > 0 ? Math.round(pagesForNormalDays / normalDaysCount) : 0;
    const hizbsPerDayResume = useHizbAlignment && targetPagesPerDay > 0
        ? getHizbsPerDayByTargetPages(startHizbResume, 60, normalDaysCount, targetPagesPerDay)
        : useHizbAlignment
            ? getHizbsPerDayForRemaining(remainingHizbs, normalDaysCount)
            : [];
    const pagesPerNormalDay = !useHizbAlignment && normalDaysCount > 0 ? Math.floor(pagesForNormalDays / normalDaysCount) : 0;
    let extraPages = !useHizbAlignment && normalDaysCount > 0 ? pagesForNormalDays % normalDaysCount : 0;
    const plan: PlanDay[] = [];
    let currentPage = startPageResume;
    let normalDayIdx = 0;
    for (let day = 1; day <= daysRemaining; day++) {
        if (!(kahfOption && new Date(startDate.getTime() + (day - 1) * 86400000).getDay() === 5) && currentPage > totalPagesToRead) break;
        const tempDate = new Date(startDate);
        tempDate.setDate(startDate.getDate() + day - 1);
        const isKahfDay = !!(kahfOption && tempDate.getDay() === 5);
        let pagesToday: number;
        let startPage: number;
        let endPage: number;
        if (isKahfDay) {
            pagesToday = Math.min(kahfPages ?? 0, remainingPages);
            startPage = Math.min(currentPage, totalPagesToRead);
            endPage = Math.min(currentPage + pagesToday - 1, totalPagesToRead);
        } else if (useHizbAlignment && hizbsPerDayResume.length > 0) {
            const hizbsToAssign = hizbsPerDayResume[normalDayIdx] ?? 2;
            normalDayIdx++;
            const effPage = currentPage <= TOTAL_PAGES ? currentPage : ((currentPage - 1) % TOTAL_PAGES) + 1;
            const startHizb = getHizbNumFromPage(effPage);
            const endHizb = Math.min(60, startHizb + hizbsToAssign - 1);
            const rangeStart = HIZB_PAGE_RANGES[startHizb - 1];
            const rangeEnd = HIZB_PAGE_RANGES[endHizb - 1];
            const isFirstNormalDay = normalDayIdx === 1;
            const atHizbBoundary = rangeStart && effPage === rangeStart.startPage;
            startPage = (isFirstNormalDay && !atHizbBoundary) ? effectiveStartPage : (rangeStart ? rangeStart.startPage : effPage);
            endPage = rangeEnd ? rangeEnd.endPage : Math.min(effPage + 19, TOTAL_PAGES);
            endPage = Math.min(endPage, totalPagesToRead);
            pagesToday = endPage - startPage + 1;
        } else {
            pagesToday = pagesPerNormalDay + (extraPages > 0 ? 1 : 0);
            if (extraPages > 0) extraPages--;
            startPage = Math.min(currentPage, totalPagesToRead);
            endPage = Math.min(currentPage + pagesToday - 1, totalPagesToRead);
        }
        plan.push({
            day,
            startPage,
            endPage,
            pages: pagesToday,
            recalculatedPages: pagesToday,
            isKahfDay,
        });
        currentPage = endPage + 1;
    }
    return plan;
};

export const recalculateFuturePlan = (
    originalPlan: PlanDay[],
    readingHistory: ReadingHistory,
    currentReadingDay: number
): PlanDay[] => {
    const newPlan: PlanDay[] = JSON.parse(JSON.stringify(originalPlan));

    const firstDay = originalPlan.find(d => d.day === 1);
    let currentPage = firstDay?.startPage ?? 1;
    for (let day = 1; day < currentReadingDay; day++) {
        const history = readingHistory[`day_${day}`];
        if (history?.realPages !== undefined) {
            currentPage += history.realPages;
        } else {
            // Jour sans historique = pas lu, 0 pages avancées
        }
    }

    // Nouvelle logique : repartir les pages restantes sur les jours restants
    const remainingPlanDays = newPlan.filter((d: PlanDay) => d.day >= currentReadingDay && !d.isKahfDay);
    const remainingPages = Math.max(0, TOTAL_PAGES - (currentPage - 1));
    if (remainingPlanDays.length > 0 && remainingPages > 0) {
        const base = Math.floor(remainingPages / remainingPlanDays.length);
        let extra = remainingPages % remainingPlanDays.length;
        remainingPlanDays.forEach((day, index) => {
            const planDay = newPlan.find((d: PlanDay) => d.day === day.day);
            if (!planDay) return;
            const pagesForThisDay = base + (index < extra ? 1 : 0);
            planDay.recalculatedPages = pagesForThisDay;
        });
    }

    for (let day = currentReadingDay; day <= newPlan.length; day++) {
        const planDay = newPlan.find((d: PlanDay) => d.day === day);
        if (!planDay) continue;
        const pagesForThisDay = planDay.recalculatedPages;
        planDay.startPage = Math.min(currentPage, TOTAL_PAGES);
        currentPage += pagesForThisDay;
        planDay.endPage = Math.min(currentPage - 1, TOTAL_PAGES);
    }
    return newPlan;
};

const getStatusWeight = (status: MemorizationStatus | undefined): number => {
    switch (status) {
        case 'a_revoir': return 3;
        case 'moyen': return 2;
        default: return 1;
    }
};

export const generateRevisionPlan = (
    revisionGoal: RevisionGoal,
    startDateString: string,
    currentReadingDay: number,
    t: (key: string, replacements?: Record<string, string | number>) => string,
    memorizations?: Memorizations
): RevisionPlanDay[] => {
    const { selection, revisionMode, unitsPerDay, revisionDuration, frequency, boosterSurahs, boosterSurahFreq, prioritizeWeaknesses } = revisionGoal;
    if (!selection || selection.length === 0) return [];

    const order = revisionGoal.revisionOrder || 'shuffle';
    let weightedSelection: string[] = [];

    if (order === 'ascending' || order === 'descending') {
        const uniqueSelection = [...new Set(selection)];
        weightedSelection = order === 'ascending'
            ? uniqueSelection.sort((a, b) => Number(a) - Number(b))
            : uniqueSelection.sort((a, b) => Number(b) - Number(a));
    } else {
        if (prioritizeWeaknesses && memorizations) {
            selection.forEach(itemId => {
                let itemStatus: MemorizationStatus | undefined;
                if (revisionMode === 'juzz') {
                    itemStatus = memorizations.juzz.find(j => String(j.number) === itemId)?.status;
                } else if (revisionMode === 'hizb') {
                    itemStatus = memorizations.hizbs.find(h => h.number === itemId)?.status;
                } else if (revisionMode === 'sourate') {
                    itemStatus = memorizations.surahParts.find(s => s.id === itemId)?.status;
                }
                const weight = getStatusWeight(itemStatus);
                for (let i = 0; i < weight; i++) {
                    weightedSelection.push(itemId);
                }
            });
        } else {
            weightedSelection = [...selection];
        }
        weightedSelection.sort(() => Math.random() - 0.5);
    }

    let units: RevisionUnit[] = [];
    if (revisionMode === 'sourate') {
        units = weightedSelection.map(surahId => {
            const surah = FULL_SURAH_LIST.find(s => s.id === Number(surahId));
            return surah ? { text: surah.name, surahs: surah.name } : { text: '', surahs: '' };
        }).filter(u => u.text);
    } else if (revisionMode === 'juzz') {
        units = weightedSelection.map(juzId => {
            const juz = JUZ_DATA.find(j => j.id === Number(juzId));
            if (!juz) return null;
            const hizbStartIdx = (juz.id - 1) * 2;
            const hizbEndIdx = hizbStartIdx + 1;
            const details = `${HIZB_DATA[hizbStartIdx]?.details || ''} | ${HIZB_DATA[hizbEndIdx]?.details || ''}`;
            return { text: `${t('juzz')} ${juz.id}`, surahs: details };
        }).filter(Boolean) as RevisionUnit[];
    } else {
        units = weightedSelection.map(hizbId => {
            const hizbIndex = Number(hizbId);
            const hizbData = HIZB_DATA[hizbIndex];
            return hizbData ? { text: `${t('hizb')} ${hizbData.name}`, surahs: hizbData.details } : null;
        }).filter(Boolean) as RevisionUnit[];
    }

    if (units.length === 0) return [];

    const dailyUnitChunks = chunkArray(units, unitsPerDay || 1);
    const plan: RevisionPlanDay[] = [];
    let revisionDayCounter = 0;
    let dayIterator = 0;
    const baseStartDate = new Date(startDateString);

    while (revisionDayCounter < revisionDuration && dayIterator < 365 * 5) {
        const tempDate = new Date(baseStartDate);
        tempDate.setDate(baseStartDate.getDate() + (currentReadingDay - 1) + dayIterator);

        let isRevisionDay = false;
        switch (frequency.type) {
            case 'daily': isRevisionDay = true; break;
            case 'weekly': if (Array.isArray(frequency.value) && frequency.value.includes(tempDate.getDay())) isRevisionDay = true; break;
            case 'custom': if (dayIterator === 0 || (dayIterator % (frequency.value as number) === 0)) isRevisionDay = true; break;
        }

        if (isRevisionDay && plan.length < revisionDuration) {
            const chunkIndex = plan.length % dailyUnitChunks.length;
            const dayPlan: RevisionPlanDay = {
                day: plan.length + 1,
                date: tempDate,
                units: JSON.parse(JSON.stringify(dailyUnitChunks[chunkIndex])),
                status: 'pending',
                difficulties: []
            };

            if (boosterSurahs && boosterSurahs.length > 0 && boosterSurahFreq > 0 && ((plan.length + 1) % boosterSurahFreq === 0)) {
                boosterSurahs.forEach(surahId => {
                    const boosterData = FULL_SURAH_LIST.find(s => s.id === Number(surahId));
                    if (boosterData) dayPlan.units.push({ text: `📌 ${boosterData.name}`, surahs: boosterData.name });
                });
            }

            plan.push(dayPlan);
            revisionDayCounter++;
        }
        dayIterator++;
    }
    return plan;
};

export interface HadithReadingGoal {
    selectedHadiths: number[];
    hadithsPerDay: number;
    duration: number;
    frequency: RevisionFrequency;
}

export interface HadithReadingPlanDay {
    day: number;
    date: Date;
    hadithIds: number[];
    status: 'pending' | 'done';
}

export const generateHadithReadingPlan = (
    goal: HadithReadingGoal,
    startDateString: string
): HadithReadingPlanDay[] => {
    const { selectedHadiths, hadithsPerDay, frequency } = goal;

    if (!selectedHadiths || selectedHadiths.length === 0 || hadithsPerDay <= 0) return [];

    // Reading follows selection order (usually 1, 2, 3...)
    const dailyChunks = chunkArray(selectedHadiths, hadithsPerDay);
    const totalReadingDays = dailyChunks.length;

    const plan: HadithReadingPlanDay[] = [];
    let dayIterator = 0;
    const baseStartDate = new Date(startDateString);

    while (plan.length < totalReadingDays && dayIterator < 365 * 5) {
        const tempDate = new Date(baseStartDate);
        tempDate.setDate(baseStartDate.getDate() + dayIterator);

        let isReadingDay = false;
        switch (frequency.type) {
            case 'daily':
                isReadingDay = dayIterator % (frequency.value as number) === 0;
                break;
            case 'weekly':
                if (Array.isArray(frequency.value)) {
                    isReadingDay = frequency.value.includes(tempDate.getDay());
                }
                break;
            case 'custom':
                isReadingDay = dayIterator % (frequency.value as number) === 0;
                break;
        }

        if (isReadingDay) {
            const chunkIndex = plan.length;
            plan.push({
                day: plan.length + 1,
                date: tempDate,
                hadithIds: dailyChunks[chunkIndex],
                status: 'pending'
            });
        }
        dayIterator++;
    }
    return plan;
};

export const generateHadithRevisionPlan = (
    goal: HadithRevisionGoal,
    startDateString: string
): HadithRevisionPlanDay[] => {
    const { selectedHadiths, hadithsPerSession, frequency } = goal;

    if (!selectedHadiths || selectedHadiths.length === 0 || hadithsPerSession <= 0) return [];

    const shuffledHadiths = [...selectedHadiths].sort(() => Math.random() - 0.5);

    const dailyChunks = chunkArray(shuffledHadiths, hadithsPerSession);
    const totalRevisionDays = dailyChunks.length;

    const plan: HadithRevisionPlanDay[] = [];
    let dayIterator = 0;
    const baseStartDate = new Date(startDateString);

    while (plan.length < totalRevisionDays && dayIterator < 365 * 5) {
        const tempDate = new Date(baseStartDate);
        tempDate.setDate(baseStartDate.getDate() + dayIterator);

        let isRevisionDay = false;
        switch (frequency.type) {
            case 'daily':
                isRevisionDay = dayIterator % (frequency.value as number) === 0;
                break;
            case 'weekly':
                if (Array.isArray(frequency.value)) {
                    isRevisionDay = frequency.value.includes(tempDate.getDay());
                }
                break;
            case 'custom':
                isRevisionDay = dayIterator % (frequency.value as number) === 0;
                break;
        }

        if (isRevisionDay) {
            const chunkIndex = plan.length;
            plan.push({
                day: plan.length + 1,
                date: tempDate,
                hadithIds: dailyChunks[chunkIndex],
                status: 'pending'
            });
        }
        dayIterator++;
    }
    return plan;
};