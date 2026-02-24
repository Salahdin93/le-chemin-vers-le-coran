import React, { useState, useEffect } from 'react';
import { useStore, useSettingsSelector, useActiveProfileSelector, useStoreSelector } from '@/context/AppContext';
import { LOGO_URL, LOGO_URL_DARK } from '@/constants/ui';
import { clsx } from 'clsx';
import { ActiveView } from '@/types';

const Header: React.FC = () => {
    const { dispatch, t } = useStore(); // On garde useStore pour les actions et la traduction
    const settings = useSettingsSelector(); // Ne se met à jour que si les settings changent
    const activeProfile = useActiveProfileSelector(); // Ne se met à jour que si le profil change
    const activeView = useStoreSelector(state => state.activeView); // Ne se met à jour que si la vue change

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const logoSrc = settings.theme === 'light' ? LOGO_URL : LOGO_URL_DARK;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        dispatch({ type: 'LOGOUT' });
    };
    
    const handleSwitchView = (view: ActiveView) => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
        setIsMenuOpen(false);
    };

    if (!activeProfile) {
        return (
            <header className="flex justify-between items-center mb-6 p-4 bg-card-bg rounded-lg shadow-sm border border-border-main">
                <div className="flex items-center gap-4">
                    <img src={logoSrc} alt="Logo" className="w-10 h-10 object-contain" />
                    <h1 className="text-xl font-bold">{t('appName')}</h1>
                </div>
            </header>
        );
    }
    
    const navItems = [
        { view: 'dashboard-view', label: t('dashboard'), icon: '📊' },
        { view: 'reading-plan-view', label: t('readingPlan'), icon: '📅' },
        { view: 'revision-plan-view', label: t('revisionPlan'), icon: '🧠' },
        { view: 'hadith-plan-view', label: t('hadithPlan'), icon: '📖' },
        { view: 'memorization-view', label: t('memorization'), icon: '💖' },
        { view: 'evaluation-view', label: t('evaluation'), icon: '📋' },
        { view: 'stats-view', label: t('statistics'), icon: '📈' }, 
        { view: 'achievements-view', label: t('achievements'), icon: '🏆' },
        { view: 'history-view', label: t('history'), icon: '📂' },
        { view: 'settings-view', label: t('settings'), icon: '⚙️' },
    ];

    return (
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 p-4 md:p-6 bg-card-bg rounded-lg shadow-sm border border-border-main relative gap-4 md:gap-0">
            
            <div className="md:flex-1 text-center md:text-left text-primary order-3 md:order-1">
                <p className="text-5xl font-amiri">
                    السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ
                </p>
                <p className="text-3xl font-bold mt-2">
                    {activeProfile.name}
                </p>
            </div>

            <div className="flex-shrink-0 md:mx-4 order-1 md:order-2">
                <img 
                    src={logoSrc} 
                    alt="Logo" 
                    className={clsx(
                        "object-contain",
                        settings.theme === 'dark' ? 'w-40 h-40' : 'w-40 h-40'
                    )} 
                />
            </div>

            <div className="md:flex-1 flex justify-center md:justify-end items-center gap-4 order-2 md:order-3">
                <h1 className="text-2xl md:text-3xl font-bold text-center md:text-right text-primary">
                    {t('appName')}
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-bg-main transition-colors"
                        title="Changer de profil"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0v-2z"/>
                            <path fillRule="evenodd" d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H15.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z"/>
                        </svg>
                    </button>
                    <button 
                        className="md:hidden p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Ouvrir le menu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-card-bg border border-border-main rounded-lg shadow-lg z-50 md:hidden">
                    <nav className="p-2">
                        <ul className="space-y-1">
                            {navItems.map(item => (
                                <li key={item.view}>
                                    <button 
                                        onClick={() => handleSwitchView(item.view as ActiveView)}
                                        className={clsx(
                                            'w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                                            {
                                                'bg-primary/10 text-primary font-semibold': activeView === item.view,
                                                'hover:bg-bg-main': activeView !== item.view
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
                </div>
            )}
        </header>
    );
};

export default Header;