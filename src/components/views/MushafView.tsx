import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/context/AppContext';
import {
  JUZ_DATA,
  HIZB_PAGE_RANGES,
  SURAH_DATA,
  FULL_SURAH_LIST,
  HIZB_DATA,
} from '@/constants/quranData';
import { recalculateFuturePlan } from '@/services/planLogic';
import type { RevisionUnit } from '@/types';
import { Play, Pause, Square, BookmarkCheck } from 'lucide-react';

type MushafRiwaya = 'hafs-tajweed' | 'hafs-wasat' | 'warsh-wasat';

interface MushafPageMeta {
  sura: number;
  ayah: number;
  juz: number;
  hizb: number;
}

type MushafPagesMap = Record<string, MushafPageMeta>;

const SWIPE_THRESHOLD_PX = 50;

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

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

function getSurahsForRevisionUnits(units: RevisionUnit[]): string[] {
  const allSurahs: string[] = [];
  units.forEach(u => {
    const hizbMatch = u.text.match(/Hizb\s*(\d+)/i);
    if (hizbMatch) {
      const hizbIndex = parseInt(hizbMatch[1], 10) - 1;
      const hizb = HIZB_DATA[hizbIndex];
      if (hizb?.surahs) allSurahs.push(...hizb.surahs);
    } else {
      (u.surahs || '').split(',').map(s => s.trim()).filter(Boolean).forEach(s => allSurahs.push(s));
    }
  });
  return allSurahs;
}

const MushafView: React.FC = () => {
  const { state, dispatch, t } = useStore();
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

  const [timerTime, setTimerTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const timerIntervalRef = useRef<any>(null);
  const [goToPageInput, setGoToPageInput] = useState<string>(() => String(currentPage));

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingSurah, setRatingSurah] = useState<string | null>(null);
  const [surahRatings, setSurahRatings] = useState<Record<string, 'tres_bien' | 'bien' | 'moyen' | 'a_revoir'>>({});

  const activeProfile = useMemo(
    () => state.profiles.find((p) => p.id === state.activeProfileId) ?? null,
    [state.profiles, state.activeProfileId],
  );
  const readingPlan = state.plans.reading;
  const originalReadingPlan = state.plans.originalReading;
  const revisionPlan = state.plans.revision;
  const currentReadingDay = state.progress.currentReadingDay ?? 1;
  const currentRevisionIndex = state.progress.currentRevisionIndex ?? 0;
  const currentRevision = revisionPlan && currentRevisionIndex < revisionPlan.length ? revisionPlan[currentRevisionIndex] : null;

  const revisionSurahs = useMemo(() => {
    if (!currentRevision) return [];
    return getSurahsForRevisionUnits(currentRevision.units);
  }, [currentRevision]);

  const todayReading = useMemo(() => {
    if (!readingPlan) return null;
    return readingPlan.find(d => d.day === currentReadingDay) || null;
  }, [readingPlan, currentReadingDay]);

  const todayRevision = useMemo(() => {
    if (!revisionPlan || revisionPlan.length === 0) return null;
    if (currentRevisionIndex < 0 || currentRevisionIndex >= revisionPlan.length) return null;
    return revisionPlan[currentRevisionIndex];
  }, [revisionPlan, currentRevisionIndex]);

  const requestWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockRef.current) {
        // @ts-ignore
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch { /* ignore */ }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release?.();
        wakeLockRef.current = null;
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (timerActive && !timerPaused) {
      timerIntervalRef.current = setInterval(() => setTimerTime(t => t + 1), 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [timerActive, timerPaused]);

  const handleTimerStart = useCallback(() => {
    setTimerActive(true);
    setTimerPaused(false);
    requestWakeLock();
  }, [requestWakeLock]);

  const handleTimerPauseResume = useCallback(() => {
    setTimerPaused(p => !p);
  }, []);

  const handleTimerStopReading = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const seconds = timerTime;
    if (readingPlan && readingPlan.length > 0 && activeProfile) {
      const newHistory = state.progress.readingHistory;
      const recPlan = originalReadingPlan ? recalculateFuturePlan(originalReadingPlan, newHistory, currentReadingDay) : null;
      dispatch({ type: 'UPDATE_READING_HISTORY', payload: { newHistory, recalculatedPlan: recPlan!, timeSpent: seconds } });
    }
    dispatch({ type: 'SET_TOAST', payload: `${t('timerSaved') ?? 'Temps enregistré'} : ${formatTime(seconds)}` });
    setTimerActive(false);
    setTimerTime(0);
    releaseWakeLock();
  }, [timerTime, readingPlan, activeProfile, currentReadingDay, state.progress.readingHistory, originalReadingPlan, dispatch, t, releaseWakeLock]);

  const handleTimerStopRevision = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const seconds = timerTime;
    if (revisionPlan && currentRevisionIndex < revisionPlan.length) {
      dispatch({
        type: 'UPDATE_REVISION_STATUS',
        payload: { revisionIndex: currentRevisionIndex, status: revisionPlan[currentRevisionIndex].status, timeSpent: seconds },
      });
    }
    dispatch({ type: 'SET_TOAST', payload: `${t('timerSaved') ?? 'Temps enregistré'} : ${formatTime(seconds)}` });
    setTimerActive(false);
    setTimerTime(0);
    releaseWakeLock();
  }, [timerTime, revisionPlan, currentRevisionIndex, dispatch, t, releaseWakeLock]);

  const handleRateSurah = useCallback((rating: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir') => {
    if (!ratingSurah) return;
    const newRatings = { ...surahRatings, [ratingSurah]: rating };
    setSurahRatings(newRatings);
    const remaining = revisionSurahs.filter(s => !(s in newRatings));
    if (remaining.length > 0) {
      setRatingSurah(remaining[0]);
    } else {
      const ratings = Object.values(newRatings);
      let overallQuality: 'tres_bien' | 'bien' | 'moyen' | 'a_revoir' = 'tres_bien';
      if (ratings.includes('a_revoir')) overallQuality = 'a_revoir';
      else if (ratings.includes('moyen')) overallQuality = 'moyen';
      else if (ratings.includes('bien')) overallQuality = 'bien';
      dispatch({
        type: 'UPDATE_REVISION_STATUS',
        payload: { revisionIndex: currentRevisionIndex, status: 'revised', quality: overallQuality, surahRatings: newRatings },
      });
      dispatch({ type: 'SET_TOAST', payload: t('jazakAllahuKhayr') ?? 'JazakAllahu Khayr' });
      setRatingOpen(false);
      setRatingSurah(null);
      setSurahRatings({});
    }
  }, [ratingSurah, surahRatings, revisionSurahs, currentRevisionIndex, dispatch, t]);

  const openRatingSurahBysurah = useCallback(() => {
    if (revisionSurahs.length === 0) return;
    setSurahRatings({});
    setRatingSurah(revisionSurahs[0]);
    setRatingOpen(true);
  }, [revisionSurahs]);

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
    return () => { releaseWakeLock(); };
  }, [releaseWakeLock]);

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
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('mushafLastPage', String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    setGoToPageInput(String(currentPage));
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
      case 'hafs-wasat': return '/mushaf-pages/hafs-wasat';
      case 'warsh-wasat': return '/mushaf-pages/warsh-wasat';
      case 'hafs-tajweed':
      default: return '/mushaf-pages/hafs-tajweed';
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

  const applyGoToPageInput = useCallback(() => {
    const n = parseInt(goToPageInput, 10);
    if (!Number.isFinite(n)) return;
    goToPage(n);
  }, [goToPageInput, goToPage]);

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
      dispatch({ type: 'SET_TOAST', payload: `${t('mushafStopSaved') ?? 'Arrêt enregistré'} — ${t('pageLabel') ?? 'Page'} ${currentPage}` });
    }
    setActionsOpen(false);
  }, [activeProfile?.id, currentPage, dispatch, t]);

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
      fullscreenRef.current.requestFullscreen?.()
        .then(() => {
          setIsFullscreen(true);
          requestWakeLock();
        })
        .catch(() => {});
    } else {
      document.exitFullscreen?.()
        .then(() => {
          setIsFullscreen(false);
          if (!timerActive) {
            releaseWakeLock();
          }
        })
        .catch(() => {});
    }
  }, [requestWakeLock, releaseWakeLock, timerActive]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const delta = touchStartX.current - endX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      if (delta > 0) handlePrev();
      else handleNext();
    }
  }, [handleNext, handlePrev]);

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

  const todayRevisionSummary =
    todayRevision && todayRevision.units && todayRevision.units.length > 0
      ? todayRevision.units
          .map((u) => (u.surahs ? `${u.text} — ${u.surahs}` : u.text))
          .join(' | ')
      : null;

  const timerBar = (
    <div className="flex flex-wrap items-center gap-2 bg-bg-main/90 px-3 py-2 rounded-xl border border-border-main/60">
      <span className="text-sm md:text-lg font-mono font-bold text-text-main tabular-nums mr-auto">
        {formatTime(timerTime)}
      </span>
      {!timerActive ? (
        <button type="button" onClick={handleTimerStart} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-color/20 text-accent-color text-[10px] md:text-xs font-bold hover:bg-accent-color/30 transition-all">
          <Play size={12} /> {t('timerStart') ?? 'Démarrer'}
        </button>
      ) : (
        <>
          <button type="button" onClick={handleTimerPauseResume} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary text-text-main text-[10px] md:text-xs font-bold hover:bg-bg-main transition-all border border-border-main">
            {timerPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          {readingPlan && readingPlan.length > 0 && (
            <button type="button" onClick={handleTimerStopReading} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/20 text-success text-[10px] md:text-xs font-bold hover:bg-success/30 transition-all">
              <Square size={11} /> {t('mushafTimerStopReading') ?? 'Lecture'}
            </button>
          )}
          {revisionPlan && revisionPlan.length > 0 && (
            <button type="button" onClick={handleTimerStopRevision} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] md:text-xs font-bold hover:bg-blue-500/30 transition-all">
              <Square size={11} /> {t('mushafTimerStopRevision') ?? 'Révision'}
            </button>
          )}
        </>
      )}
      {revisionSurahs.length > 0 && (
        <button type="button" onClick={openRatingSurahBysurah} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/20 text-warning text-[10px] md:text-xs font-bold hover:bg-warning/30 transition-all">
          <BookmarkCheck size={12} /> {t('mushafRateSurah') ?? 'Noter'}
        </button>
      )}
    </div>
  );

  const ratingModal = ratingOpen && ratingSurah && (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRatingOpen(false)}>
      <div className="glass-card rounded-3xl p-6 shadow-premium border border-border-main max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-2">{t('mushafRateSurahTitle') ?? 'Notation'}</p>
        <p className="text-lg font-bold text-text-main mb-4">{ratingSurah}</p>
        <div className="grid grid-cols-2 gap-2">
          {([['tres_bien', 'Très bien', 'bg-success/20 text-success border-success/40'], ['bien', 'Bien', 'bg-accent-color/20 text-accent-color border-accent-color/40'], ['moyen', 'Moyen', 'bg-warning/20 text-warning border-warning/40'], ['a_revoir', 'À revoir', 'bg-danger/20 text-danger border-danger/40']] as const).map(([val, label, cls]) => (
            <button key={val} type="button" onClick={() => handleRateSurah(val)} className={`px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all hover:scale-105 ${cls}`}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-text-secondary mt-3 text-center">
          {Object.keys(surahRatings).length} / {revisionSurahs.length} {t('mushafRateSurahProgress') ?? 'sourates notées'}
        </p>
      </div>
    </div>
  );

  return (
    <div
      ref={fullscreenRef}
      className={`w-full flex flex-col ${isFullscreen ? 'h-screen bg-bg-main' : ''}`}
    >
      {ratingModal}

      {isFullscreen ? (
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 gap-2">
          {timerBar}
          <button type="button" onClick={toggleFullscreen} className={btnClass}>
            {t('mushafExitFullscreen') ?? 'Quitter'}
          </button>
        </div>
      ) : (
        <div className="mb-3 space-y-1.5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-text-secondary/60 mb-0.5">
              {t('mushaf') ?? 'Mushaf'}
            </p>
            <h1 className="text-xl md:text-2xl font-black text-text-main">
              {t('quranReaderTitle') ?? 'Lecture du Coran (Mushaf)'}
            </h1>
          </div>
          {todayReading && (
            <p className="text-[11px] font-semibold text-text-secondary">
              {(t('todayReadingLabel') as string) || 'Lecture du jour'} :{' '}
              <span className="font-bold text-text-main">
                {todayReading.startPage} → {todayReading.endPage}
              </span>
            </p>
          )}
          {todayRevision && (
            <p className="text-[11px] font-semibold text-text-secondary">
              {(t('todayRevisionLabel') as string) || 'Révision du jour'}
              {todayRevisionSummary && (
                <>
                  {' : '}
                  <span className="font-bold text-text-main">{todayRevisionSummary}</span>
                </>
              )}
            </p>
          )}
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
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  min={1}
                  max={604}
                  value={goToPageInput}
                  onChange={(e) => setGoToPageInput(e.target.value)}
                  onBlur={applyGoToPageInput}
                  className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm"
                />
              </div>
              <p className="text-xs font-semibold text-text-secondary mb-2">{t('juz') ?? 'Juz'}</p>
              <select className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm mb-3" value={currentMeta?.juz ?? 1} onChange={(e) => goToPage(JUZ_DATA[parseInt(e.target.value, 10) - 1].page)}>
                {JUZ_DATA.map((j) => (<option key={j.id} value={j.id}>{t('juz')} {j.id}</option>))}
              </select>
              <p className="text-xs font-semibold text-text-secondary mb-2">{t('hizb') ?? 'Hizb'}</p>
              <select className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm mb-3" value={currentMeta?.hizb ?? 1} onChange={(e) => goToPage(HIZB_PAGE_RANGES[parseInt(e.target.value, 10) - 1].startPage)}>
                {HIZB_PAGE_RANGES.map((_, i) => (<option key={i} value={i + 1}>{t('hizb')} {i + 1}</option>))}
              </select>
              <p className="text-xs font-semibold text-text-secondary mb-2">{t('mushafGoToSurah') ?? 'Sourate'}</p>
              <select className="w-full px-2 py-1.5 rounded-lg border border-border-main bg-bg-main text-text-main text-sm" value={currentMeta?.sura ?? 1} onChange={(e) => { const surah = SURAH_DATA.find((s) => s.id === parseInt(e.target.value, 10)); if (surah) goToPage(surah.startPage); }}>
                {SURAH_DATA.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
          )}
        </div>

        {hasActions && (
          <div className="relative" ref={actionsPanelRef}>
            <button type="button" onClick={(e) => { e.stopPropagation(); setActionsOpen((o) => !o); }} className={btnClass}>
              {t('mushafActions') ?? 'Actions'} ▾
            </button>
            {actionsOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 glass-card rounded-2xl py-2 shadow-premium border border-border-main min-w-[180px]">
                {resumeReadingPage != null && (
                  <button type="button" onClick={handleResumeReading} className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors">
                    {t('mushafResumeReading') ?? 'Reprendre lecture'} ({t('pageLabel') ?? 'Page'} {resumeReadingPage})
                  </button>
                )}
                {resumeRevisionPage != null && (
                  <button type="button" onClick={handleResumeRevision} className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors">
                    {t('mushafResumeRevision') ?? 'Reprendre révision'}
                  </button>
                )}
                {activeProfile && (
                  <button type="button" onClick={handleMarkStop} className="w-full text-left px-4 py-2 text-sm hover:bg-bg-secondary transition-colors">
                    {t('mushafMarkStop') ?? "Marquer l'arrêt"} ({t('pageLabel') ?? 'Page'} {currentPage})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button type="button" onClick={toggleFullscreen} className={btnClass} title={t('mushafFullscreen') ?? 'Plein écran'}>
          {t('mushafFullscreen') ?? 'Plein écran'}
        </button>
      </div>
      )}

      {!isFullscreen && <div className="mb-3">{timerBar}</div>}

      <div className="flex items-center justify-center gap-3 mb-3">
        <button onClick={handlePrev} disabled={currentPage <= 1} className={btnClass}>◀</button>
        <div className="px-4 py-2.5 rounded-xl bg-accent-color/15 border-2 border-accent-color/50 text-center min-w-[120px]">
          {pageIndicator}
        </div>
        <button onClick={handleNext} disabled={currentPage >= 604} className={btnClass}>▶</button>
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
