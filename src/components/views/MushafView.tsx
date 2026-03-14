import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/context/AppContext';

type MushafRiwaya = 'hafs-tajweed' | 'hafs-wasat' | 'warsh-wasat';

interface MushafPageMeta {
  sura: number;
  ayah: number;
  juz: number;
  hizb: number;
}

type MushafPagesMap = Record<string, MushafPageMeta>;

const MushafView: React.FC = () => {
  const { t } = useStore();
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
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Erreur de chargement');
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

  const handlePrev = () => {
    setCurrentPage(p => (p > 1 ? p - 1 : 1));
  };

  const handleNext = () => {
    setCurrentPage(p => (p < 604 ? p + 1 : 604));
  };

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

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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

        <div className="flex items-center gap-2">
          <select
            value={riwaya}
            onChange={e => setRiwaya(e.target.value as MushafRiwaya)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-border-main/60 bg-bg-secondary/80 hover:bg-bg-secondary transition-all"
          >
            <option value="hafs-tajweed">Hafs (tajwid)</option>
            <option value="hafs-wasat">Hafs (simple)</option>
            <option value="warsh-wasat">Warsh (tajwid)</option>
          </select>
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-border-main/60 bg-bg-secondary/80 hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {t('previousPage') ?? 'Page précédente'}
          </button>
          <div className="px-3 py-2 rounded-xl text-xs font-semibold bg-accent-color/10 border border-accent-color/40 text-accent-color">
            {t('pageLabelShort') ?? 'Page'} {currentPage}/604
          </div>
          <button
            onClick={handleNext}
            disabled={currentPage >= 604}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-border-main/60 bg-bg-secondary/80 hover:bg-bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {t('nextPage') ?? 'Page suivante'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 md:p-8 shadow-premium bg-bg-secondary/90">
        <div className="w-full flex justify-center">
          <img
            src={imageSrc}
            alt={`Page ${currentPage}`}
            className="max-h-[calc(100vh-260px)] w-auto max-w-full rounded-3xl shadow-premium object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default MushafView;

