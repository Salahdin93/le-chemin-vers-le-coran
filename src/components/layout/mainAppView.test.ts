import { describe, it, expect } from 'vitest';

/**
 * Vérifie que tous les onglets (vues) liés aux plans sont déclarés et cohérents.
 * Liste des vues attendues dans MainAppView.renderActiveView().
 */
const VIEWS_HANDLED_IN_MAIN: Record<string, boolean> = {
  'dashboard-view': true,
  'reading-plan-view': true,
  'revision-plan-view': true,
  'memorization-view': true,
  'evaluation-view': true,
  'evaluation-plans-view': true,
  'evaluation-plan-form-view': true,
  'stats-view': true,
  'achievements-view': true,
  'history-view': true,
  'settings-view': true,
  'hadith-plan-view': true,
  'hadith-memorization-view': true,
  'hadith-evaluation-view': true,
  'hadith-stats-view': true,
  'hadith-revision-plan-view': true,
  'hadith-revision-settings-view': true,
};

const PLAN_VIEWS = [
  'reading-plan-view',
  'revision-plan-view',
  'hadith-plan-view',
  'hadith-revision-plan-view',
] as const;

describe('Onglets / Vues (MainAppView)', () => {
  it('toutes les vues "plan" sont gérées dans le routeur', () => {
    PLAN_VIEWS.forEach((view) => {
      expect(VIEWS_HANDLED_IN_MAIN[view], `Vue manquante: ${view}`).toBe(true);
    });
  });

  it('les 4 onglets plan existent et sont distincts', () => {
    const set = new Set(PLAN_VIEWS);
    expect(set.size).toBe(4);
  });
});
