import React from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/context/AppContext';
import { ActiveView } from '@/types';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Brain, ScrollText, Trophy, BarChart3, Settings, PenTool as Tool } from 'lucide-react';

const navItems = [
    { view: 'dashboard-view', icon: <LayoutDashboard size={20} />, labelKey: 'dashboard' },
    { view: 'reading-plan-view', icon: <BookOpen size={20} />, labelKey: 'readingPlan' },
    { view: 'revision-plan-view', icon: <Brain size={20} />, labelKey: 'revisionPlan' },
    { view: 'hadith-plan-view', icon: <ScrollText size={20} />, labelKey: '100hadiths' },
    { view: 'memorization-view', icon: <Trophy size={20} />, labelKey: 'memorization' },
    { view: 'evaluation-plans-view', icon: <Tool size={20} />, labelKey: 'evaluation' },
    { view: 'stats-view', icon: <BarChart3 size={20} />, labelKey: 'statistics' },
    { view: 'settings-view', icon: <Settings size={20} />, labelKey: 'settings' },
];

const Nav: React.FC = () => {
    const { state, dispatch, t } = useStore();

    return (
        <>
            {/* Desktop Navigation - Horizontal Floating Dock */}
            <nav className="hidden md:block mb-12">
                <ul className="flex flex-wrap items-center justify-center gap-1 p-1.5 glass-card border-none bg-bg-secondary/40 backdrop-blur-2xl shadow-premium rounded-[2rem] max-w-fit mx-auto">
                    {navItems.map(item => {
                        const isActive = state.activeView === item.view;
                        return (
                            <li key={item.view}>
                                <button
                                    onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: item.view as ActiveView })}
                                    className={clsx(
                                        'group relative flex items-center gap-2.5 px-5 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all duration-500',
                                        isActive ? 'text-white' : 'text-text-main/40 hover:text-text-main hover:bg-white/5'
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active-bg"
                                            className="absolute inset-0 accent-gradient rounded-[1.5rem] -z-10 shadow-lg shadow-accent-color/25"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className={clsx("transition-transform duration-500 group-hover:scale-110", isActive ? "scale-110" : "opacity-70 group-hover:opacity-100")}>
                                        {item.icon}
                                    </span>
                                    <span className={clsx("transition-all duration-300", !isActive && "group-hover:opacity-100")}>
                                        {t(item.labelKey)}
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Mobile Bottom Navigation - Scrollable Dock */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg">
                <div className="relative group">
                    {/* Visual Cues for Scrollability */}
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none rounded-l-[2.5rem] opacity-50" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none rounded-r-[2.5rem] opacity-50" />

                    <ul className="flex items-center gap-1 p-2 glass-card border border-white/10 bg-slate-950/95 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-x-auto no-scrollbar snap-x relative">
                        {navItems.map(item => {
                            const isActive = state.activeView === item.view;
                            return (
                                <li key={item.view} className="relative flex-shrink-0 snap-center">
                                    <button
                                        onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: item.view as ActiveView })}
                                        className={clsx(
                                            'flex flex-col items-center justify-center min-w-[72px] h-14 rounded-2xl transition-all duration-500',
                                            isActive ? 'scale-105' : 'opacity-40 hover:opacity-60'
                                        )}
                                    >
                                        <div className={clsx(
                                            "transition-all duration-500",
                                            isActive ? "text-accent-color drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]" : "text-white"
                                        )}>
                                            {React.cloneElement(item.icon as React.ReactElement, { size: 20 })}
                                        </div>

                                        <span className={clsx(
                                            "leading-none text-[8px] font-black uppercase tracking-tighter mt-1.5 transition-all duration-500",
                                            isActive ? "text-accent-color opacity-100" : "text-white opacity-0 scale-50"
                                        )}>
                                            {t(item.labelKey)}
                                        </span>

                                        {isActive && (
                                            <motion.div
                                                layoutId="mobile-nav-dot"
                                                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-accent-color shadow-[0_0_12px_rgba(16,185,129,0.9)]"
                                            />
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>
        </>
    );
};

export default Nav;