import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { Language } from '@/types';
import Button from '@/components/ui/Button';

const LanguageScreen: React.FC = () => {
  const { dispatch } = useStore();

  const handleSelectLanguage = (lang: Language) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { lang } });
    dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' });
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 60%, #047857 100%)' }}
    >
      {/* Geometric Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.8'%3E%3Cpolygon points='40,5 55,20 75,20 60,35 67,55 40,45 13,55 20,35 5,20 25,20'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative max-w-sm w-full glass-card p-10 border-none shadow-premium bg-white/5"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🌍</div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Choisissez votre langue
          </h2>
          <p className="text-emerald-100/40 text-xs font-bold uppercase tracking-widest mt-2">
            Select your language
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            variant="secondary"
            size="lg"
            className="w-full py-5 text-sm font-black uppercase tracking-widest bg-white/5 border-white/10 text-white hover:bg-emerald-500/20 hover:text-white hover:border-emerald-500/50 transition-all duration-300 relative group overflow-hidden"
            onClick={() => handleSelectLanguage('fr')}
          >
            {/* Premium Shimmer & Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
              initial={false}
            />
            <motion.div
              className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
              initial={false}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="group-hover:scale-125 transition-transform duration-500">🇫🇷</span>
              <span>Français</span>
            </span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full py-5 text-sm font-black uppercase tracking-widest bg-white/5 border-white/10 text-white hover:bg-emerald-500/20 hover:text-white hover:border-emerald-500/50 transition-all duration-300 relative group overflow-hidden"
            onClick={() => handleSelectLanguage('ar')}
          >
            {/* Premium Shimmer & Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
              initial={false}
            />
            <motion.div
              className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
              initial={false}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="group-hover:scale-125 transition-transform duration-500">🇸🇦</span>
              <span>العربية</span>
            </span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full py-5 text-sm font-black uppercase tracking-widest bg-white/5 border-white/10 text-white hover:bg-emerald-500/20 hover:text-white hover:border-emerald-500/50 transition-all duration-300 relative group overflow-hidden"
            onClick={() => handleSelectLanguage('en')}
          >
            {/* Premium Shimmer & Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
              initial={false}
            />
            <motion.div
              className="absolute inset-0 bg-emerald-400/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
              initial={false}
            />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="group-hover:scale-125 transition-transform duration-500">🇬🇧</span>
              <span>English</span>
            </span>
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] text-emerald-100/20 font-black uppercase tracking-[0.3em]">
            Le Chemin vers le Coran
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LanguageScreen;