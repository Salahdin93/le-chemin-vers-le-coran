import { HIZB_DATA, MEMORIZATION_SURAH_OPTIONS } from '@/constants/quranData';
import { Memorizations, MemorizedHizb, MemorizedJuzz, MemorizationLevel, MemorizedSurahPart } from "@/types";

const levelOrder: Record<MemorizationLevel, number> = { 'excellent': 3, 'bon': 2, 'moyen': 1 };

const getLowestLevel = (levels: MemorizationLevel[]): MemorizationLevel => {
    if (levels.length === 0) return 'moyen';
    let lowestLevel: MemorizationLevel = 'excellent';
    for (const level of levels) {
        if (levelOrder[level] < levelOrder[lowestLevel]) {
            lowestLevel = level;
        }
    }
    return lowestLevel;
};

export type CompletionItem = { kind: 'hizb'; id: number } | { kind: 'juzz'; id: number };

/** Returns completion items (hizb/juzz ready to group) without modifying state. */
export const getCompletionMessages = (memorizations: Memorizations): CompletionItem[] => {
    const items: CompletionItem[] = [];
    const memorizedPartIds = new Set(memorizations.surahParts.map((p: MemorizedSurahPart) => p.id));

    for (let i = 0; i < HIZB_DATA.length; i++) {
        const hizb = HIZB_DATA[i];
        const hizbNum = i + 1;
        if (memorizations.hizbs.some((h: MemorizedHizb) => h.number === hizb.name)) continue;

        const allPartsInHizb = MEMORIZATION_SURAH_OPTIONS.filter(option => option.hizbs.includes(hizbNum));
        const neededPartIds = new Set<string>();
        allPartsInHizb.forEach(part => {
            if (part.isFull) {
                const hasFull = memorizedPartIds.has(part.id);
                const partsForFullSurah = MEMORIZATION_SURAH_OPTIONS.filter(p => p.originalSurahId === part.originalSurahId && !p.isFull);
                const hasAllParts = partsForFullSurah.every(p => memorizedPartIds.has(p.id));
                if (!hasFull && (partsForFullSurah.length === 0 || !hasAllParts)) neededPartIds.add('missing');
                else neededPartIds.add(part.id);
            } else {
                const fullSurahOption = MEMORIZATION_SURAH_OPTIONS.find(p => p.originalSurahId === part.originalSurahId && p.isFull);
                if (!memorizedPartIds.has(part.id) && !(fullSurahOption && memorizedPartIds.has(fullSurahOption.id))) neededPartIds.add('missing');
                else neededPartIds.add(part.id);
            }
        });
        if (neededPartIds.has('missing')) continue;

        const componentPartsInState = memorizations.surahParts.filter((p: MemorizedSurahPart) => {
            const option = MEMORIZATION_SURAH_OPTIONS.find(opt => opt.id === p.id);
            return option && option.hizbs.includes(hizbNum);
        });
        if (componentPartsInState.length > 0) items.push({ kind: 'hizb', id: hizbNum });
    }

    for (let i = 1; i <= 30; i++) {
        if (memorizations.juzz.some((j: MemorizedJuzz) => j.number === i)) continue;
        const hizb1Num = ((i - 1) * 2 + 1).toString();
        const hizb2Num = ((i - 1) * 2 + 2).toString();
        const hizb1 = memorizations.hizbs.find((h: MemorizedHizb) => h.number === hizb1Num);
        const hizb2 = memorizations.hizbs.find((h: MemorizedHizb) => h.number === hizb2Num);
        if (hizb1 && hizb2) items.push({ kind: 'juzz', id: i });
    }

    return items;
};

/** Apply grouping for a single hizb or juzz. Returns new memorizations (does not mutate). */
export const applyGroupingForItem = (current: Memorizations, kind: 'hizb' | 'juzz', id: number): Memorizations => {
    const updated = JSON.parse(JSON.stringify(current));
    const memorizedPartIds = new Set(updated.surahParts.map((p: MemorizedSurahPart) => p.id));

    if (kind === 'hizb') {
        const hizb = HIZB_DATA[id - 1];
        if (!hizb || updated.hizbs.some((h: MemorizedHizb) => h.number === hizb.name)) return current;

        const hizbNum = id;
        const allPartsInHizb = MEMORIZATION_SURAH_OPTIONS.filter(option => option.hizbs.includes(hizbNum));
        const neededPartIds = new Set<string>();
        allPartsInHizb.forEach(part => {
            if (part.isFull) {
                const hasFull = memorizedPartIds.has(part.id);
                const partsForFullSurah = MEMORIZATION_SURAH_OPTIONS.filter(p => p.originalSurahId === part.originalSurahId && !p.isFull);
                const hasAllParts = partsForFullSurah.every(p => memorizedPartIds.has(p.id));
                if (!hasFull && (partsForFullSurah.length === 0 || !hasAllParts)) neededPartIds.add('missing');
                else neededPartIds.add(part.id);
            } else {
                const fullSurahOption = MEMORIZATION_SURAH_OPTIONS.find(p => p.originalSurahId === part.originalSurahId && p.isFull);
                if (!memorizedPartIds.has(part.id) && !(fullSurahOption && memorizedPartIds.has(fullSurahOption.id))) neededPartIds.add('missing');
                else neededPartIds.add(part.id);
            }
        });
        if (neededPartIds.has('missing')) return current;

        const componentPartsInState = updated.surahParts.filter((p: MemorizedSurahPart) => {
            const option = MEMORIZATION_SURAH_OPTIONS.find(opt => opt.id === p.id);
            return option && option.hizbs.includes(hizbNum);
        });
        if (componentPartsInState.length === 0) return current;

        const hizbLevel = getLowestLevel(componentPartsInState.map((p: MemorizedSurahPart) => p.level));
        updated.hizbs.push({
            number: hizb.name,
            details: hizb.details,
            level: hizbLevel,
            status: hizbLevel as any,
            componentSurahParts: componentPartsInState,
        });
        const idsToRemove = new Set(componentPartsInState.map((p: MemorizedSurahPart) => p.id));
        updated.surahParts = updated.surahParts.filter((p: MemorizedSurahPart) => !idsToRemove.has(p.id));
    } else {
        if (id < 1 || id > 30) return current;
        if (updated.juzz.some((j: MemorizedJuzz) => j.number === id)) return current;
        const hizb1Num = ((id - 1) * 2 + 1).toString();
        const hizb2Num = ((id - 1) * 2 + 2).toString();
        const hizb1 = updated.hizbs.find((h: MemorizedHizb) => h.number === hizb1Num);
        const hizb2 = updated.hizbs.find((h: MemorizedHizb) => h.number === hizb2Num);
        if (!hizb1 || !hizb2) return current;

        const juzzLevel = getLowestLevel([hizb1.level, hizb2.level]);
        updated.juzz.push({
            number: id,
            level: juzzLevel,
            status: juzzLevel as any,
            componentHizbs: [
                { number: hizb1.number, details: hizb1.details, level: hizb1.level, status: hizb1.status },
                { number: hizb2.number, details: hizb2.details, level: hizb2.level, status: hizb2.status }
            ]
        });
        updated.hizbs = updated.hizbs.filter((h: MemorizedHizb) => h.number !== hizb1Num && h.number !== hizb2Num);
    }

    updated.hizbs.sort((a: MemorizedHizb, b: MemorizedHizb) => Number(a.number) - Number(b.number));
    updated.juzz.sort((a: MemorizedJuzz, b: MemorizedJuzz) => a.number - b.number);
    return updated;
};

export const checkAndGroupMemorizations = (currentMemorizations: Memorizations): { updatedMemorizations: Memorizations, groupedItems: string[] } => {
    const updatedMemorizations: Memorizations = JSON.parse(JSON.stringify(currentMemorizations));
    const memorizedPartIds = new Set(updatedMemorizations.surahParts.map((p: MemorizedSurahPart) => p.id));
    let groupedItems: string[] = [];

    // Check for Hizb completion
    for (let i = 0; i < HIZB_DATA.length; i++) {
        const hizb = HIZB_DATA[i];
        const hizbNum = i + 1;
        const hizbAlreadyMemorized = updatedMemorizations.hizbs.some((h: MemorizedHizb) => h.number === hizb.name);

        if (hizbAlreadyMemorized) continue;

        const allPartsInHizb = MEMORIZATION_SURAH_OPTIONS.filter(option =>
            option.hizbs.includes(hizbNum)
        );

        const neededPartIds = new Set<string>();
        allPartsInHizb.forEach(part => {
            if (part.isFull) {
                const hasFull = memorizedPartIds.has(part.id);
                const partsForFullSurah = MEMORIZATION_SURAH_OPTIONS.filter(p => p.originalSurahId === part.originalSurahId && !p.isFull);
                const hasAllParts = partsForFullSurah.every(p => memorizedPartIds.has(p.id));

                if (!hasFull && (partsForFullSurah.length === 0 || !hasAllParts)) {
                    neededPartIds.add('missing');
                } else {
                    neededPartIds.add(part.id);
                }
            } else {
                const fullSurahOption = MEMORIZATION_SURAH_OPTIONS.find(p => p.originalSurahId === part.originalSurahId && p.isFull);
                if (!memorizedPartIds.has(part.id) && !(fullSurahOption && memorizedPartIds.has(fullSurahOption.id))) {
                    neededPartIds.add('missing');
                } else {
                    neededPartIds.add(part.id);
                }
            }
        });

        if (neededPartIds.has('missing')) continue;

        const componentPartsInState = updatedMemorizations.surahParts.filter((p: MemorizedSurahPart) => {
            const option = MEMORIZATION_SURAH_OPTIONS.find(opt => opt.id === p.id);
            return option && option.hizbs.includes(hizbNum);
        });

        if (componentPartsInState.length === 0) continue;

        groupedItems.push(`Hizb ${hizb.name}`);
        const hizbLevel = getLowestLevel(componentPartsInState.map((p: MemorizedSurahPart) => p.level));

        updatedMemorizations.hizbs.push({
            number: hizb.name,
            details: hizb.details,
            level: hizbLevel,
            status: hizbLevel as any,
            componentSurahParts: componentPartsInState,
        });

        const idsToRemove = new Set(componentPartsInState.map((p: MemorizedSurahPart) => p.id));
        updatedMemorizations.surahParts = updatedMemorizations.surahParts.filter((p: MemorizedSurahPart) => !idsToRemove.has(p.id));
    }

    // Check for Juzz completion
    for (let i = 1; i <= 30; i++) {
        const juzzAlreadyMemorized = updatedMemorizations.juzz.some((j: MemorizedJuzz) => j.number === i);
        if (juzzAlreadyMemorized) continue;

        const hizb1Num = ((i - 1) * 2 + 1).toString();
        const hizb2Num = ((i - 1) * 2 + 2).toString();
        const hizb1 = updatedMemorizations.hizbs.find((h: MemorizedHizb) => h.number === hizb1Num);
        const hizb2 = updatedMemorizations.hizbs.find((h: MemorizedHizb) => h.number === hizb2Num);

        if (hizb1 && hizb2) {
            groupedItems.push(`Juzz ${i}`);
            const juzzLevel = getLowestLevel([hizb1.level, hizb2.level]);

            updatedMemorizations.juzz.push({
                number: i,
                level: juzzLevel,
                status: juzzLevel as any,
                componentHizbs: [
                    { number: hizb1.number, details: hizb1.details, level: hizb1.level, status: hizb1.status },
                    { number: hizb2.number, details: hizb2.details, level: hizb2.level, status: hizb2.status }
                ]
            });

            updatedMemorizations.hizbs = updatedMemorizations.hizbs.filter((h: MemorizedHizb) => h.number !== hizb1Num && h.number !== hizb2Num);
        }
    }

    updatedMemorizations.hizbs.sort((a: MemorizedHizb, b: MemorizedHizb) => Number(a.number) - Number(b.number));
    updatedMemorizations.juzz.sort((a: MemorizedJuzz, b: MemorizedJuzz) => a.number - b.number);

    return { updatedMemorizations, groupedItems };
};