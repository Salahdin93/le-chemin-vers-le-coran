import React, { useState, useMemo } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { HadithMemorizationStatus } from '../../types';
import {
    ArrowLeft, ArrowRight, Quote,
    CheckCircle2, Clock, Eye,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const HadithMemorizationView: React.FC = () => {
    const { dispatch, t, state } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const currentHadith = useMemo(() => HADITH_COLLECTION[currentIndex], [currentIndex]);
    const progress = activeProfile?.hadithProgress || {};
    const currentStatus = progress[currentHadith.id] || 'not_started';

    if (!activeProfile) return null;

    const handleStatusChange = (status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId: currentHadith.id, status } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const paginate = (newDirection: number) => {
        setDirection(newDirection);
        setCurrentIndex(prev => (prev + newDirection + HADITH_COLLECTION.length) % HADITH_COLLECTION.length);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.9
        }),
        center: {
            zindex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zindex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.9
        })
    };

    const statusOptions: { status: HadithMemorizationStatus, labelKey: string, icon: any, color: string }[] = [
        { status: 'lu', labelKey: 'statusLu', icon: Eye, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
        { status: 'en_memorisation', labelKey: 'statusEnMemorisation', icon: Clock, color: 'text-warning bg-warning/10 border-warning/20' },
        { status: 'acquis', labelKey: 'statusAcquis', icon: CheckCircle2, color: 'text-success bg-success/10 border-success/20' },
    ];

    return (
        <div className="space-y-12 pb-32 max-w-5xl mx-auto">
            <header className="flex items-center justify-between pb-8 border-b-2 border-border-main/50">
                <button
                    onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-plan-view' })}
                    className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-all group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    {t('backToMenu')}
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-color">Mode Immersion</p>
                    <p className="text-xl font-black">{currentIndex + 1} <span className="opacity-20">/</span> {HADITH_COLLECTION.length}</p>
                </div>
            </header>

            <div className="relative min-h-[600px] flex items-center justify-center">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.4 }
                        }}
                        className="w-full flex flex-col gap-10"
                    >
                        <div className="premium-card p-0 rounded-[4rem] border-2 border-border-main/10 shadow-3xl overflow-hidden group">
                            <div className="absolute inset-0 bg-sparkle-pattern opacity-[0.03] pointer-events-none" />

                            <div className="p-12 md:p-20 space-y-12 relative z-10">
                                <div className="flex justify-between items-center">
                                    <div className="w-16 h-16 rounded-3xl bg-accent-color/10 flex items-center justify-center text-accent-color text-2xl font-black shadow-inner">
                                        #{currentHadith.id}
                                    </div>
                                    <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Quote size={24} className="text-accent-color" />
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <p className="font-amiri text-3xl md:text-5xl leading-[2.2] md:leading-[2.5] text-right dir-rtl text-white drop-shadow-sm italic">
                                        {currentHadith.arabic}
                                    </p>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border-main/50 to-transparent" />

                                    <div className="space-y-6">
                                        <p className="text-lg md:text-2xl font-medium leading-relaxed text-text-secondary italic text-center max-w-3xl mx-auto py-4">
                                            "{currentHadith.translations[state.settings.lang as keyof typeof currentHadith.translations] || (currentHadith.translations as any).en}"
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center opacity-20">
                                            Source: {currentHadith.source[state.settings.lang as keyof typeof currentHadith.source] || (currentHadith.source as any).en}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {statusOptions.map(opt => {
                                const isActive = currentStatus === opt.status;
                                return (
                                    <button
                                        key={opt.status}
                                        onClick={() => handleStatusChange(opt.status)}
                                        className={clsx(
                                            "h-20 rounded-3xl flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest transition-all duration-500 border-2",
                                            isActive ? "bg-accent-color border-accent-color text-white shadow-2xl shadow-accent-color/30 scale-105" : "bg-bg-secondary/40 border-border-main/10 text-white/40 hover:bg-bg-main hover:text-white"
                                        )}
                                    >
                                        <opt.icon size={20} className={clsx(isActive ? "text-white" : "text-accent-color/40")} />
                                        {t(opt.labelKey)}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between pt-12">
                <button
                    onClick={() => paginate(-1)}
                    className="w-20 h-20 rounded-[2rem] bg-bg-secondary/60 flex items-center justify-center border-2 border-border-main/10 hover:bg-accent-color hover:text-white transition-all shadow-xl group"
                >
                    <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                </button>

                <div className="flex gap-2">
                    {HADITH_COLLECTION.slice(Math.max(0, currentIndex - 2), Math.min(HADITH_COLLECTION.length, currentIndex + 3)).map((h) => (
                        <div key={h.id} className={clsx("w-2 h-2 rounded-full transition-all duration-500", h.id === currentHadith.id ? "w-8 bg-accent-color" : "bg-border-main/30")} />
                    ))}
                </div>

                <button
                    onClick={() => paginate(1)}
                    className="w-20 h-20 rounded-[2rem] bg-bg-secondary/60 flex items-center justify-center border-2 border-border-main/10 hover:bg-accent-color hover:text-white transition-all shadow-xl group"
                >
                    <ArrowRight size={28} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default HadithMemorizationView;