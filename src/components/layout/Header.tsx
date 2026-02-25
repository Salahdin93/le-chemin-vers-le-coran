import React, { useState, useEffect } from 'react';
import { useStore, useActiveProfileSelector } from '@/context/AppContext';
import { LOGO_URL, LOGO_URL_DARK } from '@/constants/ui';
import { clsx } from 'clsx';
import { LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC = () => {
    const { dispatch, t } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [scrolled, setScrolled] = useState(false);

    const isDark = !['light', 'sepia', 'emerald', 'aube', 'oasis', 'sand', 'wood', 'sunrise', 'leafy', 'pearl'].includes(activeProfile?.theme ?? 'dark');
    const logoSrc = isDark ? LOGO_URL_DARK : LOGO_URL;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Sabah al-Khayr';
        if (h < 18) return 'Masâ’ al-Khayr';
        return 'Masâ’ al-Nûr';
    })();

    return (
        <header
            className={clsx(
                'sticky top-0 z-50 w-full transition-all duration-500 px-4 md:px-6 py-3 md:py-4',
                scrolled ? 'bg-bg-main/80 backdrop-blur-xl border-b border-border-main/50 py-2 md:py-3 shadow-xl shadow-black/5' : 'bg-transparent'
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left: Branding */}
                <div className="flex items-center gap-3 md:gap-4 group cursor-pointer" onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'dashboard-view' })}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center glass-card border-none shadow-premium bg-accent-color/10 group-hover:scale-105 md:group-hover:scale-110 transition-transform duration-500">
                        <img src={logoSrc} alt="Logo" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
                    </div>
                    <div className="hidden xs:flex flex-col">
                        <span className="text-xs md:text-sm font-black tracking-tight text-gradient leading-tight">
                            {t('appNameShort') || 'SPIRIT'}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-30 group-hover:opacity-100 transition-opacity">
                            Premium
                        </span>
                    </div>
                </div>

                {/* Center: Greeting (Desktop) */}
                <AnimatePresence mode="wait">
                    {activeProfile && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="hidden lg:flex flex-col items-center"
                        >
                            <span className="font-amiri text-lg text-warning drop-shadow-sm" style={{ direction: 'rtl' }}>
                                السَّلاَمُ عَلَيْكُمْ
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                {greeting}, {activeProfile.name}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* User Profile / Status */}
                    {activeProfile && (
                        <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 py-1 md:py-1.5 pr-1 md:pr-1.5 rounded-xl md:rounded-2xl bg-bg-secondary/50 border border-border-main/30 backdrop-blur-md">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[10px] md:text-xs font-black leading-none mb-0.5">{activeProfile.name}</span>
                                <span className="text-[8px] md:text-[9px] font-bold text-accent-color uppercase tracking-widest">{t('level') || 'Mourid'}</span>
                            </div>
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl accent-gradient flex items-center justify-center text-white shadow-lg shadow-accent-color/20 group cursor-pointer hover:scale-105 transition-all">
                                <User size={16} className="md:w-[18px] md:h-[18px]" />
                            </div>
                        </div>
                    )}

                    {/* Exit */}
                    <button
                        onClick={() => {
                            if (confirm(t('confirmLogout') || 'Voulez-vous changer de profil ?')) {
                                dispatch({ type: 'LOGOUT' });
                            }
                        }}
                        className="p-2 md:p-3 rounded-lg md:rounded-2xl bg-white/5 hover:bg-danger/10 text-text-main/20 hover:text-danger transition-all duration-300"
                        title={t('logout')}
                    >
                        <LogOut size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;