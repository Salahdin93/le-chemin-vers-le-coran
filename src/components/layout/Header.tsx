import React, { useState, useEffect } from 'react';
import { useStore, useActiveProfileSelector, useStoreSelector } from '@/context/AppContext';
import { LOGO_URL, LOGO_URL_DARK } from '@/constants/ui';
import { clsx } from 'clsx';
import { ActiveView } from '@/types/types';

const mobileNavItems = [
    { view: 'dashboard-view', icon: '⊞', labelKey: 'dashboard' },
    { view: 'reading-plan-view', icon: '📖', labelKey: 'readingPlan' },
    { view: 'revision-plan-view', icon: '🧠', labelKey: 'revisionPlan' },
    { view: 'hadith-plan-view', icon: '📜', labelKey: '100hadiths' },
    { view: 'hadith-revision-plan-view', icon: '🔁', labelKey: 'hadithRevisionPlan' },
    { view: 'memorization-view', icon: '💎', labelKey: 'memorization' },
    { view: 'evaluation-plans-view', icon: '📋', labelKey: 'evaluation' },
    { view: 'stats-view', icon: '📈', labelKey: 'statistics' },
    { view: 'achievements-view', icon: '🏆', labelKey: 'achievements' },
    { view: 'history-view', icon: '📂', labelKey: 'history' },
    { view: 'settings-view', icon: '⚙️', labelKey: 'settings' },
];

const Header: React.FC = () => {
    const { dispatch, t } = useStore();

    const activeProfile = useActiveProfileSelector();
    const activeView = useStoreSelector(s => s.activeView);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const isDark = !['light', 'sepia', 'emerald', 'aube', 'oasis', 'sand', 'wood', 'sunrise', 'leafy', 'pearl'].includes(activeProfile?.theme ?? 'dark');
    const logoSrc = isDark ? LOGO_URL_DARK : LOGO_URL;

    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 768) setIsMenuOpen(false); };
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onScroll); };
    }, []);

    const handleSwitchView = (view: ActiveView) => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
        setIsMenuOpen(false);
    };

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return t('goodMorning') || 'صباح الخير';
        if (h < 18) return t('goodAfternoon') || 'مساء الخير';
        return t('goodEvening') || 'مساء النور';
    })();

    return (
        <header
            className={clsx(
                'sticky top-4 z-40 flex items-center justify-between px-6 py-4 transition-all duration-300 mx-4 md:mx-6 rounded-[1.5rem] border border-white/5',
                scrolled ? 'glass-effect shadow-2xl' : 'bg-bg-secondary'
            )}
        >
            {/* Left: Logo + App name */}
            <div className="flex items-center gap-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        boxShadow: '0 0 12px rgba(16,185,129,0.15)',
                    }}
                >
                    <img src={logoSrc} alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="hidden sm:block leading-tight">
                    <p className="text-sm font-cairo font-bold" style={{ color: 'var(--accent-color)' }}>
                        {t('appName') || 'Le Chemin vers le Coran'}
                    </p>
                    {activeProfile && (
                        <p className="text-xs font-amiri opacity-80" style={{ color: 'var(--text-secondary)', direction: 'rtl' }}>
                            {greeting}
                        </p>
                    )}
                </div>
            </div>

            {/* Centre: Profile greeting (desktop) */}
            {activeProfile && (
                <div className="hidden md:flex flex-col items-center">
                    <p className="font-amiri text-lg leading-none" style={{ color: '#f59e0b', direction: 'rtl' }}>
                        السَّلاَمُ عَلَيْكُمْ
                    </p>
                    <p className="text-sm font-cairo font-bold text-text-main">{activeProfile.name}</p>
                </div>
            )}

            {/* Right: Avatar + actions */}
            <div className="flex items-center gap-2">
                {activeProfile && (
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-cairo font-bold text-white flex-shrink-0"
                        style={{
                            background: 'linear-gradient(135deg, var(--accent-color) 0%, rgba(16,185,129,0.6) 100%)',
                            boxShadow: '0 0 10px rgba(16,185,129,0.3)',
                        }}
                        title={activeProfile.name}
                    >
                        {activeProfile.name.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Logout */}
                {activeProfile && (
                    <button
                        onClick={() => dispatch({ type: 'LOGOUT' })}
                        className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10"
                        title="Changer de profil"
                        aria-label="Déconnexion"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="opacity-60 hover:opacity-100 transition-opacity">
                            <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0v-2z" />
                            <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H15.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z" />
                        </svg>
                    </button>
                )}

                {/* Mobile menu toggle */}
                <button
                    className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
                    onClick={() => setIsMenuOpen(o => !o)}
                    aria-label="Menu"
                >
                    <div className="space-y-1">
                        <span className={clsx('block h-0.5 w-5 rounded-full transition-all duration-300', isMenuOpen ? 'bg-primary rotate-45 translate-y-1.5' : 'bg-text-main/70')} />
                        <span className={clsx('block h-0.5 w-5 rounded-full bg-text-main/70 transition-all duration-300', isMenuOpen && 'opacity-0')} />
                        <span className={clsx('block h-0.5 w-5 rounded-full transition-all duration-300', isMenuOpen ? 'bg-primary -rotate-45 -translate-y-1.5' : 'bg-text-main/70')} />
                    </div>
                </button>
            </div>

            {/* Mobile drawer */}
            {isMenuOpen && (
                <div
                    className="absolute top-full left-0 right-0 border-t border-border-main z-50 md:hidden animate-fadeSlideUp"
                    style={{
                        background: 'rgba(13,27,42,0.96)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                    }}
                >
                    <nav className="p-3">
                        <ul className="space-y-1">
                            {mobileNavItems.map(item => (
                                <li key={item.view}>
                                    <button
                                        onClick={() => handleSwitchView(item.view as ActiveView)}
                                        className={clsx(
                                            'w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-cairo transition-all duration-150',
                                            activeView === item.view
                                                ? 'text-white font-semibold'
                                                : 'text-text-main/70 hover:text-text-main hover:bg-white/5'
                                        )}
                                        style={activeView === item.view ? {
                                            background: 'var(--accent-color)',
                                            boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                                        } : {}}
                                    >
                                        <span className="text-base">{item.icon}</span>
                                        <span>{t(item.labelKey)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;