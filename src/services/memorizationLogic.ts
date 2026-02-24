import { HIZB_DATA, MEMORIZATION_SURAH_OPTIONS, JUZ_DATA } from '@/constants/quranData';
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
                // If it's a full surah, we need the full surah memorized.
                // We also check if it's been memorized part-by-part.
                const hasFull = memorizedPartIds.has(part.id);
                const partsForFullSurah = MEMORIZATION_SURAH_OPTIONS.filter(p => p.originalSurahId === part.originalSurahId && !p.isFull);
                const hasAllParts = partsForFullSurah.every(p => memorizedPartIds.has(p.id));

                if (!hasFull && !hasAllParts) {
                    neededPartIds.add('missing'); // Mark as not complete
                } else {
                     neededPartIds.add(part.id);
                }
            } else {
                // If it's a part, we need that part, or the full surah it belongs to.
                const fullSurahOption = MEMORIZATION_SURAH_OPTIONS.find(p => p.originalSurahId === part.originalSurahId && p.isFull);
                if (!memorizedPartIds.has(part.id) && !(fullSurahOption && memorizedPartIds.has(fullSurahOption.id))) {
                    neededPartIds.add('missing'); // Mark as not complete
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
            componentSurahParts: componentPartsInState,
        });

        const idsToRemove = new Set(componentPartsInState.map(p => p.id));
        updatedMemorizations.surahParts = updatedMemorizations.surahParts.filter((p: MemorizedSurahPart) => !idsToRemove.has(p.id));
    }
    
    // Check for Juzz completion
    for (let i = 1; i <= 30; i++) {
        const juzzAlreadyMemorized = updatedMemorizations.juzz.some((j: MemorizedJuzz) => j.number === i);
        if(juzzAlreadyMemorized) continue;

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
                componentHizbs: [{number: hizb1.number, details: hizb1.details, level: hizb1.level}, {number: hizb2.number, details: hizb2.details, level: hizb2.level}]
             });

             updatedMemorizations.hizbs = updatedMemorizations.hizbs.filter((h: MemorizedHizb) => h.number !== hizb1Num && h.number !== hizb2Num);
        }
    }

    updatedMemorizations.hizbs.sort((a: MemorizedHizb, b: MemorizedHizb) => Number(a.number) - Number(b.number));
    updatedMemorizations.juzz.sort((a: MemorizedJuzz, b: MemorizedJuzz) => a.number - b.number);

    return { updatedMemorizations, groupedItems };
};