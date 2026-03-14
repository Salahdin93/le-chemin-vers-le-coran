import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/context/AppContext';
import {
  JUZ_DATA,
  HIZB_PAGE_RANGES,
  SURAH_DATA,
  FULL_SURAH_LIST,
} from '@/constants/quranData';
import type { RevisionUnit } from '@/types';

type MushafRiwaya = 'hafs-tajweed' | 'hafs-wasat' | 'warsh-wasat';

interface MushafPageMeta {
  sura: number;
  ayah: number;
  juz: number;
  hizb: number;
}

type MushafPagesMap = Record<string, MushafPageMeta>;

const SWIPE_THRESHOLD_PX = 50;

function getPageFromRevisionUnit(unit: RevisionUnit): number | null {
  const text = unit.text.trim();
  const juzMatch = text.match(/Juz(z)?\s*(\d+)/i);
  if (juzMatch) {
    const num = parseInt(juzMatch[2], 10);
    if (num >= 1 && num <= 30) return JUZ_DATA[num - 1].page;
  }
  const hizbMatch = text.match(/Hizb\s*(\d+)/i);
  if (hizbMatch) {
    const num = parseInt(hizbMatch[1], 10);
    if (num >= 1 && num <= 60) return HIZB_PAGE_RANGES[num - 1].startPage;
  }
  const surah = FULL_SURAH_LIST.find(
    (s) =>
      text === s.name ||
      text.endsWith(s.name) ||
      text.includes(s.name),
  );
  if (surah) {
    const data = SURAH_DATA.find((d) => d.id === surah.id);
    return data?.startPage ?? null;
  }
  return null;
}

const MushafView: React.FC = () => {
  const { state, t } = useStore();
  const [meta, setMeta] = useState<MushafPagesMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const stored = window.localStorage.getItem('mushafLastPage');
    const parsed = stored ? parseInt(stored, 10) : 1;
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 604 ? parsed : 1;
  });
  const [riwaya, setRiwaya] = useState<MushafRiwaya>(() => {
    if (typeof window === 'undefined') return 'hafs-tajweed';
    const stored = window.localStorage.getItem('mushafRiwaya');
    if (stored === 'hafs-wasat' || stored === 'warsh-wasat' || stored === 'hafs-tajweed') {
      return stored;
    }
    return 'hafs-tajweed';
  });
  const [goToOpen, setGoToOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const goToPanelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    if (!goToOpen) return;
    const close = (e: MouseEvent) => {
      if (goToPanelRef.current && !goToPanelRef.current.contains(e.target as Node)) setGoToOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [goToOpen]);

  const activeProfile = useMemo(
    () => state.profiles.find((p) => p.id === state.activeProfileId) ?? null,
    [state.profiles, state.activeProfileId],
  );
  const readingPlan = state.plans.reading;
  const revisionPlan = state.plans.revision;
  const currentReadingDay = state.progress.currentReadingDay ?? 1;
  const currentRevisionIndex = state.progress.currentRevisionIndex ?? 0;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/quran-data/mushaf-pages.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as MushafPagesMap;
        if (cancelled) return;
        setMeta(data);
        setLoading(false);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('mushafLastPage', String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('mushafRiwaya', riwaya);
  }, [riwaya]);

  const currentMeta = useMemo(() => {
    if (!meta) return undefined;
    return meta[String(currentPage)];
  }, [meta, currentPage]);

  const imageBasePath = useMemo(() => {
    switch (riwaya) {
      case 'hafs-wasat':
        return '/mushaf-pages/hafs-wasat';
      case 'warsh-wasat':
        return '/mushaf-pages/warsh-wasat';
      case 'hafs-tajweed':
      default:
        return '/mushaf-pages/hafs-tajweed';
    }
  }, [riwaya]);

  const imageSrc = `${imageBasePath}/${currentPage}.jpg`;

  const handlePrev = useCallback(() => {
    setCurrentPage((p) => (p > 1 ? p - 1 : 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentPage((p) => (p < 604 ? p + 1 : 604));
  }, []);

  const goToPage = useCallback((page: number) => {
    const p = Math.max(1, Math.min(604, page));
    setCurrentPage(p);
    setGoToOpen(false);
  }, []);

  const resumeReadingPage = useMemo(() => {
    if (!activeProfile?.id || !readingPlan?.length) return null;
    const key = `mushafReadingStop_${activeProfile.id}`;
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (saved) {
      const num = parseInt(saved, 10);
      if (Number.isFinite(num) && num >= 1 && num <= 604) return num;
    }
    const dayIndex = currentReadingDay - 1;
    if (dayIndex < 0 || dayIndex >= readingPlan.length) return null;
    return readingPlan[dayIndex].startPage;
  }, [activeProfile?.id, readingPlan, currentReadingDay]);

  const resumeRevisionPage = useMemo(() => {
    if (!revisionPlan?.length || currentRevisionIndex >= revisionPlan.length) return null;
    const day = revisionPlan[currentRevisionIndex];
    const firstUnit = day?.units?.[0];
    if (!firstUnit) return null;
    return getPageFromRevisionUnit(firstUnit);
  }, [revisionPlan, currentRevisionIndex]);

  const handleMarkStop = useCallback(() => {
    if (activeProfile?.id && typeof window !== 'undefined') {
      window.localStorage.setItem(`mushafReadingStop_${activeProfile.id}`, String(currentPage));
    }
  }, [activeProfile?.id, currentPage]);

  const handleResumeReading = useCallback(() => {
    if (resumeReadingPage != null) setCurrentPage(resumeReadingPage);
  }, [resumeReadingPage]);

  const handleResumeRevision = useCallback(() => {
    if (resumeRevisionPage != null) setCurrentPage(resumeRevisionPage);
  }, [resumeRevisionPage]);

  const toggleFullscreen = useCallback(() => {
    if (!fullscreenRef.current) return;
    if (!document.fullscreenElement) {
      fullscreenRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    },
    [],
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const delta = touchStartX.current - endX;
      if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
        if (delta > 0) handleNext();
        else handlePrev();
      }
    },
    [handleNext, handlePrev],
  );

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="glass-card px-6 py-4 rounded-2xl text-sm text-text-secondary">
          {t('loading') ?? 'Chargement...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="glass-card px-6 py-4 rounded-2xl text-sm text-danger">
          {t('mushafLoadError') ?? 'Une erreur est survenue lors du chargement du Mushaf.'}
        </div>
      </div>
    );
  }

  const btnClass =
    'px-3 py-2 rounded-xl text-xs font-semibold border-2 border-border-main bg-bg-secondary hover:bg-bg-main transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const selectClass =
    'px-3 py-2 rounded-xl text-xs font-semibold border-2 border-accent-color/70 bg-bg-secondary text-text-main min-w-[140px]';

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-text-secondary/60 mb-1">
            {t('mushaf') ?? 'Mushaf'}
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-text-main">
            {t('quranReaderTitle') ?? 'Lecture du Coran (Mushaf)'}
          </h1>
          {currentMeta && (
            <p className="text-xs text-text-secondary mt-1">
              {t('pageLabel') ?? 'Page'} {currentPage} / 604 · Juz {currentMeta.juz} · Hizb {currentMeta.hizb}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={riwaya}
            onChange={(e) => setRiwaya(e.target.value as MushafRiwaya)}
            className={selectClass}
            aria-label={t('mushafRiwayaLabel') ?? 'Type de Coran'}
          >
            <option value="hafs-tajweed">{t('mushafHafsTajwid') ?? 'Hafs (tajwid)'}</option>
            <option value="hafs-wasat">{t('mushafHafsSimple') ?? 'Hafs (simple)'}</option>
            <option value="warsh-wasat">{t('mushafWarshWasat') ?? 'Warsh (wasat)'}</option>
          </select>

          <div className="relative" ref={goToPanelRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setGoToOpen((o) => !o); }}
              className={btnClass}
            >
              {t('mushafGoTo') ?? 'Aller à'}
            </button>
            {goToOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 glass-card rounded-2xl p-4 shadow-premium border border-border-main min-w-[200px]">
                <p className="text-xs font-semibold text-text-secondary mb-2">{t('mushafGoToPage') ?? 'Page'}</p>
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={currentPage}
                  onChange={(e) => goToPage(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm mb-3"
                />
                <p className="text-xs font-semibold text-text-secondary mb-2">{t('juz') ?? 'Juz'}</p>
                <select
                  className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm mb-3"
                  value={currentMeta?.juz ?? 1}
                  onChange={(e) => goToPage(JUZ_DATA[parseInt(e.target.value, 10) - 1].page)}
                >
                  {JUZ_DATA.map((j) => (
                    <option key={j.id} value={j.id}>
                      {t('juz')} {j.id}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-semibold text-text-secondary mb-2">{t('hizb') ?? 'Hizb'}</p>
                <select
                  className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm mb-3"
                  value={currentMeta?.hizb ?? 1}
                  onChange={(e) => goToPage(HIZB_PAGE_RANGES[parseInt(e.target.value, 10) - 1].startPage)}
                >
                  {HIZB_PAGE_RANGES.map((_, i) => (
                    <option key={i} value={i + 1}>
                      {t('hizb')} {i + 1}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-semibold text-text-secondary mb-2">{t('mushafGoToSurah') ?? 'Sourate'}</p>
                <select
                  className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm"
                  value={currentMeta?.sura ?? 1}
                  onChange={(e) => {
                    const surah = SURAH_DATA.find((s) => s.id === parseInt(e.target.value, 10));
                    if (surah) goToPage(surah.startPage);
                  }}
                >
                  {SURAH_DATA.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {resumeReadingPage != null && (
            <button type="button" onClick={handleResumeReading} className={btnClass}>
              {t('mushafResumeReading') ?? 'Reprendre lecture'}
            </button>
          )}
          {resumeRevisionPage != null && (
            <button type="button" onClick={handleResumeRevision} className={btnClass}>
              {t('mushafResumeRevision') ?? 'Reprendre révision'}
            </button>
          )}
          {activeProfile && (
            <button type="button" onClick={handleMarkStop} className={btnClass}>
              {t('mushafMarkStop') ?? "Marquer l'arrêt"}
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className={btnClass}
            title={isFullscreen ? (t('mushafExitFullscreen') ?? 'Quitter plein écran') : (t('mushafFullscreen') ?? 'Plein écran')}
          >
            {isFullscreen ? (t('mushafExitFullscreen') ?? 'Quitter') : (t('mushafFullscreen') ?? 'Plein écran')}
          </button>

          <button onClick={handlePrev} disabled={currentPage <= 1} className={btnClass}>
            {t('previousPage') ?? 'Page précédente'}
          </button>
          <div className="px-3 py-2 rounded-xl text-xs font-semibold bg-accent-color/10 border-2 border-accent-color/40 text-accent-color">
            {t('pageLabelShort') ?? 'P.'} {currentPage}/604
          </div>
          <button onClick={handleNext} disabled={currentPage >= 604} className={btnClass}>
            {t('nextPage') ?? 'Page suivante'}
          </button>
        </div>
      </div>

      <div
        ref={fullscreenRef}
        className="glass-card rounded-3xl p-5 md:p-8 shadow-premium bg-bg-secondary/90"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full flex justify-center">
          <img
            src={imageSrc}
            alt={`Page ${currentPage}`}
            className="max-h-[calc(100vh-260px)] w-auto max-w-full rounded-3xl shadow-premium object-contain select-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export default MushafView;
