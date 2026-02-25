import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { LOGO_URL_DARK } from '@/constants/ui';
import { Sparkles } from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const { dispatch, t } = useStore();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 60%, #047857 100%)' }}>

      {/* Geometric Islamic Pattern Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.8'%3E%3Cpolygon points='40,5 55,20 75,20 60,35 67,55 40,45 13,55 20,35 5,20 25,20'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.5) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-[40%] left-[-5%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)' }}
      />

      <motion.div
        className="relative w-full max-w-md mx-auto px-6 z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* ===== BRAND IDENTITY ===== */}
        <div className="flex flex-col items-center mb-10 text-center">

          {/* Logo with animated ring */}
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative mb-8"
          >
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-[-8px] rounded-3xl border border-emerald-400/30"
            />
            <motion.div
              animate={{ scale: [1.05, 1, 1.05], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute inset-[-16px] rounded-3xl border border-amber-400/20"
            />
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center animate-float"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(16,185,129,0.4), 0 20px 40px rgba(0,0,0,0.3)',
              }}
            >
              <img src={LOGO_URL_DARK} alt="App Logo" className="w-20 h-20 object-contain drop-shadow-2xl" />
            </div>
          </motion.div>

          {/* Title Block */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* App Name */}
            <h1
              className="text-4xl font-black mb-3 px-2 leading-tight tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #d1fae5 40%, #6ee7b7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
                filter: 'drop-shadow(0 2px 8px rgba(52,211,153,0.5))',
              }}
            >
              {t('appName') || 'Le Chemin vers le Coran'}
            </h1>

            {/* Decorative separator */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-400/50" />
              <Sparkles size={14} className="text-amber-400" />
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-400/50" />
            </div>

            {/* Basmala — calligraphic golden display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative"
              style={{ direction: 'rtl' }}
            >
              <p
                className="font-amiri leading-relaxed text-center"
                style={{
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 12px rgba(251,191,36,0.6))',
                  letterSpacing: '0.05em',
                }}
              >
                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
              </p>
              {/* Subtle glow under basmala */}
              <div
                className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-48 h-2 rounded-full blur-lg"
                style={{ background: 'rgba(251,191,36,0.3)' }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* ===== MAIN ACTIONS CONTAINER ===== */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="w-full px-1"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <p
            className="text-xs text-center font-black uppercase tracking-[0.25em] mb-6"
            style={{ color: 'rgba(167,243,208,0.6)' }}
          >
            {t('welcomeSubtitle') || 'Commencez votre voyage spirituel'}
          </p>

          {/* Create Profile — Primary CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'full', mode: 'new' } })}
            className="w-full mb-4 py-5 rounded-2xl font-black text-base uppercase tracking-tight text-white relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
              boxShadow: '0 8px 32px rgba(16,185,129,0.5), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              ✨ {t('createProfile') || 'Créer un nouveau profil'}
            </span>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>

          {/* Secondary action — My Profiles */}
          <div className="flex justify-center">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'profile-selection' })}
              className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#d1fae5',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              <span className="text-xl">🔑</span>
              <span>{t('login') || 'Mes Profils'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ===== FOOTER ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.1 }}
          className="mt-10 text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: 'rgba(167,243,208,0.5)' }}>
            Abu Junayd • Editeur — بإذن الله
          </p>
          <div className="text-[8px] mt-1" style={{ color: 'rgba(167,243,208,0.3)' }}>Version 7.0 Premium</div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;