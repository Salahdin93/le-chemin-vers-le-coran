import React from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/context/AppContext';
import { ActiveView } from '@/types';

const navItems = [
    { view: 'dashboard-view', icon: '⊞', labelKey: 'dashboard' },
    { view: 'reading-plan-view', icon: '📖', labelKey: 'readingPlan' },
    { view: 'revision-plan-view', icon: '🧠', labelKey: 'revisionPlan' },
    { view: 'hadith-plan-view', icon: '📜', labelKey: '100hadiths' },
    { view: 'memorization-view', icon: '💎', labelKey: 'memorization' },
    { view: 'evaluation-plans-view', icon: '📋', labelKey: 'evaluation' },
    { view: 'stats-view', icon: '📈', labelKey: 'statistics' },
    { view: 'settings-view', icon: '⚙️', labelKey: 'settings' },
];

const Nav: React.FC = () => {
    const { state, dispatch, t } = useStore();

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden md:block mb-8">
                <ul className="flex flex-wrap items-center justify-center gap-2 p-2 glass-effect rounded-2xl border-border-main shadow-xl">
                    {navItems.map(item => {
                        const isActive = state.activeView === item.view;
                        return (
                            <li key={item.view}>
                                <button
                                    onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: item.view as ActiveView })}
                                    className={clsx(
                                        'group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300',
                                        isActive
                                            ? 'text-white'
                                            : 'text-text-secondary hover:text-text-main hover:bg-white/5'
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-0 accent-gradient rounded-xl -z-10 glow-box" />
                                    )}
                                    <span className={clsx("text-lg transition-transform group-hover:scale-110", isActive ? "scale-110" : "opacity-70")}>
                                        {item.icon}
                                    </span>
                                    <span>{t(item.labelKey)}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
                <ul className="flex items-center justify-around p-2 glass-effect rounded-3xl border-border-main shadow-2xl backdrop-blur-xl">
                    {navItems.slice(0, 5).map(item => {
                        const isActive = state.activeView === item.view;
                        return (
                            <li key={item.view} className="relative">
                                <button
                                    onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: item.view as ActiveView })}
                                    className={clsx(
                                        'flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-300',
                                        isActive ? 'text-accent-color' : 'text-text-secondary'
                                    )}
                                >
                                    <span className={clsx("text-2xl transition-all", isActive ? "scale-125 -translate-y-1" : "opacity-60")}>
                                        {item.icon}
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse-soft">
                                            {t(item.labelKey).substring(0, 8)}
                                        </span>
                                    )}
                                </button>
                                {isActive && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-color glow-box" />
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
};

export default Nav;