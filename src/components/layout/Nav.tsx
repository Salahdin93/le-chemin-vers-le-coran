import React from 'react';
import { clsx } from 'clsx';
import { useStore } from '@/context/AppContext';
import { ActiveView } from '@/types';

const Nav: React.FC = () => {
    const { state, dispatch, t } = useStore();

    const navItems = [
        { view: 'dashboard-view', label: t('dashboard'), icon: '📊' },
        { view: 'reading-plan-view', label: t('readingPlan'), icon: '📅' },
        { view: 'revision-plan-view', label: t('revisionPlan'), icon: '🧠' },
        { view: 'hadith-plan-view', label: t('100hadiths', '100 Hadiths'), icon: '📖' },
        { view: 'hadith-revision-plan-view', label: t('hadithRevisionPlan'), icon: '🔁' },
        { view: 'memorization-view', label: t('memorization'), icon: '💖' },
        { view: 'evaluation-plans-view', label: t('evaluation'), icon: '📋' },
        { view: 'stats-view', label: t('statistics'), icon: '📈' },
        { view: 'achievements-view', label: t('achievements'), icon: '🏆' },
        { view: 'history-view', label: t('history'), icon: '📂' },
        { view: 'settings-view', label: t('settings'), icon: '⚙️' },
    ];

    return (
        <nav className="hidden md:block mb-6">
            <ul className="flex flex-wrap items-center justify-center gap-2 bg-card-bg p-2 rounded-lg border border-border-main shadow-sm">
                {navItems.map(item => (
                    <li key={item.view}>
                        <button
                            onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: item.view as ActiveView })}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                                {
                                    'bg-primary text-white': state.activeView === item.view,
                                    'hover:bg-bg-main text-text-main/70': state.activeView !== item.view
                                }
                            )}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Nav;