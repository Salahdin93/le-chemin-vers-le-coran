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
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<any>(null);
  const goToPanelRef = useRef<HTMLDivElement>(null);
  const actionsPanelRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);

  const activeProfile = useMemo(
    () => state.profiles.find((p) => p.id === state.activeProfileId) ?? null,
    [state.profiles, state.activeProfileId],
  );
  const readingPlan = state.plans.reading;
  const revisionPlan = state.plans.revision;
  const currentReadingDay = state.progress.currentReadingDay ?? 1;
  const currentRevisionIndex = state.progress.currentRevisionIndex ?? 0;

  const requestWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
        // @ts-ignore - experimental API
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // ignore on unsupported browsers
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release?.();
        wakeLockRef.current = null;
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!goToOpen) return;
    const close = (e: MouseEvent) => {
      if (goToPanelRef.current && !goToPanelRef.current.contains(e.target as Node)) setGoToOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [goToOpen]);

  useEffect(() => {
    if (!actionsOpen) return;
    const close = (e: MouseEvent) => {
      if (actionsPanelRef.current && !actionsPanelRef.current.contains(e.target as Node)) setActionsOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [actionsOpen]);

  useEffect(() => {
    requestWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

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

  useEffect(() => {
    const preload = (page: number) => {
      if (page < 1 || page > 604) return;
      const img = new Image();
      img.src = `${imageBasePath}/${page}.jpg`;
    };
    preload(currentPage - 1);
    preload(currentPage + 1);
  }, [currentPage, imageBasePath]);

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

  const hasActions = !!(resumeReadingPage != null || resumeRevisionPage != null || activeProfile?.id);

  const handleMarkStop = useCallback(() => {
    if (activeProfile?.id && typeof window !== 'undefined') {
      window.localStorage.setItem(`mushafReadingStop_${activeProfile.id}`, String(currentPage));
    }
    setActionsOpen(false);
  }, [activeProfile?.id, currentPage]);

  const handleResumeReading = useCallback(() => {
    if (resumeReadingPage != null) setCurrentPage(resumeReadingPage);
    setActionsOpen(false);
  }, [resumeReadingPage]);

  const handleResumeRevision = useCallback(() => {
    if (resumeRevisionPage != null) setCurrentPage(resumeRevisionPage);
    setActionsOpen(false);
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
        // Lecture arabe : avancer vers la fin du Mushaf en swipant vers la droite.
        // delta > 0  => swipe vers la gauche  => revenir en arrière (page précédente)
        // delta < 0  => swipe vers la droite => avancer (page suivante)
        if (delta > 0) handlePrev();
        else handleNext();
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
    'px-3 py-2 rounded-xl text-xs font-semibold border border-border-main bg-bg-secondary hover:bg-bg-main transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const selectClass =
    'px-3 py-2 rounded-xl text-xs font-semibold border border-accent-color/70 bg-bg-secondary text-text-main';

  const pageIndicator = (
    <span className="tabular-nums font-bold text-accent-color">
      {t('pageLabel') ?? 'Page'} {currentPage} / 604
      {currentMeta && (
        <span className="text-text-secondary font-normal text-[10px] ml-1.5">
          · Juz {currentMeta.juz} · Hizb {currentMeta.hizb}
        </span>
      )}
    </span>
  );

  return (
    <div
      ref={fullscreenRef}
      className={`w-full flex flex-col ${isFullscreen ? 'h-screen bg-bg-main' : ''}`}
    >
      {isFullscreen ? (
        <div className="flex-shrink-0 flex justify-end px-2 py-1.5">
          <button
            type="button"
            onClick={toggleFullscreen}
            className={btnClass}
          >
            {t('mushafExitFullscreen') ?? 'Quitter'}
          </button>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-text-secondary/60 mb-0.5">
            {t('mushaf') ?? 'Mushaf'}
          </p>
          <h1 className="text-xl md:text-2xl font-black text-text-main">
            {t('quranReaderTitle') ?? 'Lecture du Coran (Mushaf)'}
          </h1>
        </div>
      )}

      {!isFullscreen && (
      <div className="flex flex-wrap items-center gap-2 mb-3">
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

        {hasActions && (
          <div className="relative" ref={actionsPanelRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActionsOpen((o) => !o); }}
              className={btnClass}
            >
              {t('mushafActions') ?? 'Actions'} ▾
            </button>
            {actionsOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 glass-card rounded-2xl py-2 shadow-premium border border-border-main min-w-[180px]">
                {resumeReadingPage != null && (
                  <button
                    type="button"
                    onClick={handleResumeReading}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
                  >
                    {t('mushafResumeReading') ?? 'Reprendre lecture'}
                  </button>
                )}
                {resumeRevisionPage != null && (
                  <button
                    type="button"
                    onClick={handleResumeRevision}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
                  >
                    {t('mushafResumeRevision') ?? 'Reprendre révision'}
                  </button>
                )}
                {activeProfile && (
                  <button
                    type="button"
                    onClick={handleMarkStop}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors"
                  >
                    {t('mushafMarkStop') ?? "Marquer l'arrêt"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          className={btnClass}
          title={t('mushafFullscreen') ?? 'Plein écran'}
        >
          {t('mushafFullscreen') ?? 'Plein écran'}
        </button>
      </div>
      )}

      <div className="flex items-center justify-center gap-3 mb-3">
        <button onClick={handlePrev} disabled={currentPage <= 1} className={btnClass}>
          ◀
        </button>
        <div className="px-4 py-2.5 rounded-xl bg-accent-color/15 border-2 border-accent-color/50 text-center min-w-[120px]">
          {pageIndicator}
        </div>
        <button onClick={handleNext} disabled={currentPage >= 604} className={btnClass}>
          ▶
        </button>
      </div>

      <div
        className={`flex-1 flex flex-col min-h-0 ${isFullscreen ? 'rounded-none' : 'glass-card rounded-3xl p-4 md:p-6 shadow-premium bg-bg-secondary/90'}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex-1 flex justify-center items-center min-h-0 overflow-hidden">
          <img
            src={imageSrc}
            alt={`Page ${currentPage}`}
            className={`max-w-full max-h-full w-auto h-auto object-contain select-none rounded-2xl ${!isFullscreen ? 'shadow-premium' : ''}`}
            style={isFullscreen ? { maxHeight: '100%' } : undefined}
            draggable={false}
          />
        </div>

        {isFullscreen && (
          <div className="flex-shrink-0 py-2 flex justify-center bg-bg-main/90 border-t border-border-main/50">
            <span className="text-sm font-bold text-text-main tabular-nums">
              {t('pageLabel') ?? 'Page'} {currentPage} / 604
              {currentMeta && (
                <span className="text-text-secondary font-normal ml-2">
                  Juz {currentMeta.juz} · Hizb {currentMeta.hizb}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MushafView;
