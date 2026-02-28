import { FULL_SURAH_LIST, JUZ_DATA, SURAH_DATA, TOTAL_PAGES, HIZB_DATA } from "@/constants/quranData";
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

export const getHizbDetailsFromPage = (page: number) => {
    const adjustedPage = page - 1;
    const hizbNum = Math.floor(adjustedPage / 10) + 1;
    const juzzNum = Math.floor((hizbNum - 1) / 2) + 1;

    const surah = SURAH_DATA.find(s => page >= s.startPage && page <= s.endPage);
    const surahName = surah ? surah.name : "Inconnue";

    return { hizbNum, juzzNum, surahName };
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
            if (tempDate.getDay() === 5) {
                fridaysCount++;
            }
        }
        pagesForNormalDays -= (fridaysCount * (kahfPages || 0));
    }
    const normalDaysCount = duration - fridaysCount;
    const pagesPerNormalDay = normalDaysCount > 0 ? Math.floor(pagesForNormalDays / normalDaysCount) : 0;
    let extraPages = normalDaysCount > 0 ? pagesForNormalDays % normalDaysCount : 0;
    const plan: PlanDay[] = [];
    let currentPage = 1;
    for (let day = 1; day <= duration; day++) {
        let pagesToday: number;
        let isKahfDay = false;
        const tempDate = new Date(startDate);
        tempDate.setDate(startDate.getDate() + day - 1);
        if (kahfOption && tempDate.getDay() === 5) {
            pagesToday = kahfPages || 0;
            isKahfDay = true;
        } else {
            pagesToday = pagesPerNormalDay + (extraPages > 0 ? 1 : 0);
            if (extraPages > 0) extraPages--;
        }
        const startPage = currentPage;
        const endPage = startPage + pagesToday - 1;
        plan.push({
            day,
            startPage: startPage > TOTAL_PAGES ? (startPage % TOTAL_PAGES || TOTAL_PAGES) : startPage,
            endPage: endPage > TOTAL_PAGES ? (endPage % TOTAL_PAGES || TOTAL_PAGES) : endPage,
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
    let totalPagesRead = 0;
    let totalPagesPlanned = 0;
    for (let day = 1; day < currentReadingDay; day++) {
        const history = readingHistory[`day_${day}`];
        const originalPlanDay = originalPlan.find(d => d.day === day);
        if (originalPlanDay) {
            totalPagesPlanned += originalPlanDay.pages;
            totalPagesRead += (history?.realPages !== undefined ? history.realPages : originalPlanDay.pages);
        }
    }
    const pageDifference = totalPagesRead - totalPagesPlanned;
    const remainingDays = newPlan.filter((d: PlanDay) => d.day >= currentReadingDay && !d.isKahfDay);
    if (remainingDays.length > 0) {
        const adjustmentPerDay = Math.floor(pageDifference / remainingDays.length);
        let extraAdjustment = pageDifference % remainingDays.length;
        remainingDays.forEach((day: PlanDay) => {
            let dayAdjustment = adjustmentPerDay;
            if (extraAdjustment !== 0) {
                dayAdjustment += extraAdjustment > 0 ? 1 : -1;
                extraAdjustment += extraAdjustment > 0 ? -1 : 1;
            }
            const planDay = newPlan.find((d: PlanDay) => d.day === day.day);
            if (planDay) {
                planDay.recalculatedPages = Math.max(0, planDay.pages - dayAdjustment);
            }
        });
    }
    let currentPage = 1;
    for (let day = 1; day < currentReadingDay; day++) {
        const history = readingHistory[`day_${day}`];
        if (history?.realPages !== undefined) {
            currentPage += history.realPages;
        } else {
            const originalDay = originalPlan.find(d => d.day === day);
            if (originalDay) currentPage += originalDay.pages;
        }
    }
    for (let day = currentReadingDay; day <= newPlan.length; day++) {
        const planDay = newPlan.find((d: PlanDay) => d.day === day);
        if (!planDay) continue;
        const pagesForThisDay = planDay.recalculatedPages;
        planDay.startPage = currentPage > TOTAL_PAGES ? (currentPage % TOTAL_PAGES || TOTAL_PAGES) : currentPage;
        currentPage += pagesForThisDay;
        planDay.endPage = (currentPage - 1) > TOTAL_PAGES ? ((currentPage - 1) % TOTAL_PAGES || TOTAL_PAGES) : (currentPage - 1);
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

    let weightedSelection: string[] = [];
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