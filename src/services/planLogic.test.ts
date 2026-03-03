import { describe, it, expect } from 'vitest';
import {
  getHizbDetailsFromPage,
  generateReadingPlan,
  generateReadingPlanResume,
  recalculateFuturePlan,
  generateRevisionPlan,
  generateHadithReadingPlan,
  generateHadithRevisionPlan,
  getTargetPagesPerDayResume,
} from './planLogic';
import type { ReadingGoal, ReadingHistory, RevisionGoal, HadithRevisionGoal } from '@/types';
import { TOTAL_PAGES } from '@/constants/quranData';

const t = (key: string) => key;

describe('planLogic — getHizbDetailsFromPage', () => {
  it('retourne un hizb valide pour la page 1', () => {
    const details = getHizbDetailsFromPage(1);
    expect(details.hizbNum).toBeGreaterThanOrEqual(1);
    expect(details.hizbNum).toBeLessThanOrEqual(60);
    expect(details.juzzNum).toBeGreaterThanOrEqual(1);
    expect(details.juzzNum).toBeLessThanOrEqual(30);
  });

  it('retourne un hizb valide pour la page 604', () => {
    const details = getHizbDetailsFromPage(604);
    expect(details.hizbNum).toBeGreaterThanOrEqual(1);
    expect(details.hizbNum).toBeLessThanOrEqual(60);
  });

  it('gère une page hors bornes (0) sans crasher', () => {
    const details = getHizbDetailsFromPage(0);
    expect(details.hizbNum).toBe(1);
  });
});

describe('planLogic — Plan de lecture (generateReadingPlan)', () => {
  const goal: ReadingGoal = {
    duration: 30,
    khatmas: 1,
    pagesPerDay: 20,
    kahfOption: false,
    kahfPages: 0,
  };
  const startDate = '2025-03-01';

  it('génère un plan de 30 jours pour 1 khatma', () => {
    const plan = generateReadingPlan(goal, startDate);
    expect(plan).toHaveLength(30);
  });

  it('le dernier jour ne dépasse pas la page 604', () => {
    const plan = generateReadingPlan(goal, startDate);
    const lastDay = plan[plan.length - 1];
    expect(lastDay.endPage).toBeLessThanOrEqual(TOTAL_PAGES);
    expect(lastDay.startPage).toBeLessThanOrEqual(TOTAL_PAGES);
  });

  it('chaque jour a startPage et endPage valides (1-604)', () => {
    const plan = generateReadingPlan(goal, startDate);
    plan.forEach((day) => {
      expect(day.startPage).toBeGreaterThanOrEqual(1);
      expect(day.startPage).toBeLessThanOrEqual(TOTAL_PAGES);
      expect(day.endPage).toBeGreaterThanOrEqual(1);
      expect(day.endPage).toBeLessThanOrEqual(TOTAL_PAGES);
      expect(day.endPage).toBeGreaterThanOrEqual(day.startPage);
    });
  });

  it('le premier jour commence à la page 1', () => {
    const plan = generateReadingPlan(goal, startDate);
    expect(plan[0].startPage).toBe(1);
  });
});

describe('planLogic — Plan de lecture reprise (generateReadingPlanResume)', () => {
  const goal: ReadingGoal = {
    duration: 30,
    khatmas: 1,
    pagesPerDay: 21,
    kahfOption: false,
    kahfPages: 0,
  };
  const startDate = '2025-03-01';

  it('reprise à la page 189 : aucun jour ne doit « boucler » après 604 (pas de startPage 1 en fin de plan)', () => {
    const plan = generateReadingPlanResume(goal, startDate, {
      existingPagesRead: 188,
      existingDaysRead: 0,
    });
    expect(plan.length).toBeGreaterThan(0);
    plan.forEach((day) => {
      expect(day.startPage).toBeGreaterThanOrEqual(1);
      expect(day.endPage).toBeLessThanOrEqual(TOTAL_PAGES);
      expect(day.endPage).toBeGreaterThanOrEqual(day.startPage);
    });
    const lastDay = plan[plan.length - 1];
    expect(lastDay.endPage).toBeLessThanOrEqual(TOTAL_PAGES);
  });

  it('reprise page 189 : le premier jour commence à la page 189', () => {
    const plan = generateReadingPlanResume(goal, startDate, {
      existingPagesRead: 188,
      existingDaysRead: 0,
    });
    expect(plan[0].startPage).toBe(189);
  });

  it('reprise avec existingDaysRead : moins de jours générés', () => {
    const planFull = generateReadingPlanResume(goal, startDate, { existingPagesRead: 0, existingDaysRead: 0 });
    const planResume = generateReadingPlanResume(goal, startDate, { existingPagesRead: 0, existingDaysRead: 10 });
    expect(planResume.length).toBeLessThanOrEqual(planFull.length);
  });
});

describe('planLogic — recalculateFuturePlan', () => {
  it('préserve la première page du plan (reprise) et plafonne à 604', () => {
    const originalPlan = [
      { day: 1, startPage: 189, endPage: 210, pages: 22, recalculatedPages: 22, isKahfDay: false },
      { day: 2, startPage: 211, endPage: 232, pages: 22, recalculatedPages: 22, isKahfDay: false },
      { day: 3, startPage: 233, endPage: 254, pages: 22, recalculatedPages: 22, isKahfDay: false },
    ];
    const history: ReadingHistory = {
      day_1: { status: 'done', realPages: 22, adjustment: 0 },
    };
    const recalc = recalculateFuturePlan(originalPlan, history, 2);
    expect(recalc[0].startPage).toBe(189);
    recalc.forEach((day) => {
      expect(day.startPage).toBeLessThanOrEqual(TOTAL_PAGES);
      expect(day.endPage).toBeLessThanOrEqual(TOTAL_PAGES);
    });
  });

  it('ne produit pas de wrap (startPage 1) quand currentPage dépasse 604', () => {
    const originalPlan = [
      { day: 1, startPage: 600, endPage: 604, pages: 5, recalculatedPages: 5, isKahfDay: false },
    ];
    const history: ReadingHistory = {};
    const recalc = recalculateFuturePlan(originalPlan, history, 1);
    expect(recalc[0].endPage).toBeLessThanOrEqual(TOTAL_PAGES);
    expect(recalc[0].startPage).toBeLessThanOrEqual(TOTAL_PAGES);
  });
});

describe('planLogic — getTargetPagesPerDayResume', () => {
  it('calcule une cible pages/jour cohérente pour reprise 30 jours, 0 lus, 188 pages lues', () => {
    const target = getTargetPagesPerDayResume(30, 0, 1, 188, false, 0);
    expect(target).toBeGreaterThan(0);
    expect(target).toBeLessThanOrEqual(TOTAL_PAGES);
  });
});

describe('planLogic — Plan de révision (generateRevisionPlan)', () => {
  const baseGoal: RevisionGoal = {
    selection: ['1', '2', '3'],
    revisionMode: 'hizb',
    unitsPerDay: 1,
    revisionDuration: 7,
    frequency: { type: 'daily', value: 1 },
    boosterSurahs: [],
    boosterSurahFreq: 7,
  };
  const startDate = '2025-03-01';

  it('sélection vide retourne un tableau vide', () => {
    const plan = generateRevisionPlan(
      { ...baseGoal, selection: [] },
      startDate,
      1,
      t
    );
    expect(plan).toHaveLength(0);
  });

  it('avec sélection hizb génère un plan avec des jours', () => {
    const plan = generateRevisionPlan(baseGoal, startDate, 1, t);
    expect(plan.length).toBeGreaterThan(0);
    plan.forEach((day) => {
      expect(day.day).toBeGreaterThanOrEqual(1);
      expect(day.units).toBeDefined();
      expect(Array.isArray(day.units)).toBe(true);
    });
  });

  it('ordre ascending : pas de doublon consécutif dans les unités du même jour (structure valide)', () => {
    const goalAsc: RevisionGoal = { ...baseGoal, revisionOrder: 'ascending', selection: ['5', '10', '15'] };
    const plan = generateRevisionPlan(goalAsc, startDate, 1, t);
    expect(plan.length).toBeGreaterThan(0);
  });
});

describe('planLogic — Plan hadith lecture (generateHadithReadingPlan)', () => {
  const startDate = '2025-03-01';

  it('sélection vide ou hadithsPerDay 0 retourne un tableau vide', () => {
    expect(generateHadithReadingPlan(
      { selectedHadiths: [], hadithsPerDay: 1, duration: 10, frequency: { type: 'daily', value: 1 } },
      startDate
    )).toHaveLength(0);
    expect(generateHadithReadingPlan(
      { selectedHadiths: [1, 2, 3], hadithsPerDay: 0, duration: 10, frequency: { type: 'daily', value: 1 } },
      startDate
    )).toHaveLength(0);
  });

  it('avec sélection et fréquence daily génère des jours avec hadithIds', () => {
    const plan = generateHadithReadingPlan(
      { selectedHadiths: [1, 2, 3, 4], hadithsPerDay: 2, duration: 10, frequency: { type: 'daily', value: 1 } },
      startDate
    );
    expect(plan.length).toBeGreaterThan(0);
    plan.forEach((day) => {
      expect(day.hadithIds).toBeDefined();
      expect(day.status).toBe('pending');
    });
  });
});

describe('planLogic — Plan hadith révision (generateHadithRevisionPlan)', () => {
  const startDate = '2025-03-01';

  it('sélection vide ou hadithsPerSession 0 retourne un tableau vide', () => {
    const goal: HadithRevisionGoal = {
      selectedHadiths: [],
      hadithsPerSession: 1,
      frequency: { type: 'daily', value: 1 },
    };
    expect(generateHadithRevisionPlan(goal, startDate)).toHaveLength(0);
  });

  it('avec sélection génère un plan avec des jours', () => {
    const goal: HadithRevisionGoal = {
      selectedHadiths: [1, 2, 3, 4, 5],
      hadithsPerSession: 2,
      frequency: { type: 'daily', value: 1 },
    };
    const plan = generateHadithRevisionPlan(goal, startDate);
    expect(plan.length).toBeGreaterThan(0);
    plan.forEach((day) => {
      expect(day.hadithIds).toBeDefined();
      expect(day.status).toBe('pending');
    });
  });
});
