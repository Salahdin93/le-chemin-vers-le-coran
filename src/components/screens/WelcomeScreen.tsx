import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { LOGO_URL_DARK } from '@/constants/ui';

const WelcomeScreen: React.FC = () => {
  const { dispatch, t } = useStore();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center geometric-bg overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(16,185,129,0.16) 0%, transparent 65%)' }}
      />

      {/* Gold accent dot — top right */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
      />

      <motion.div
        className="relative w-full max-w-sm mx-auto px-5 z-10"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo card */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 40px rgba(16,185,129,0.25)',
            }}
          >
            <img src={LOGO_URL_DARK} alt="" className="w-16 h-16 object-contain" />
          </div>

          <h1 className="text-xl font-cairo font-bold text-text-main text-center mb-1">
            {t('appName')}
          </h1>
          <p
            className="font-amiri text-lg text-center"
            style={{ color: '#f59e0b', direction: 'rtl' }}
          >
            مرحبًا بكم
          </p>
        </div>

        {/* Glass card */}
        <div
          className="glass-card p-6 space-y-3"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <p className="text-sm text-center font-cairo text-text-main/60 mb-4">
            {t('welcomeSubtitle') || "Commencez votre voyage avec le Coran"}
          </p>

          <button
            onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'full', mode: 'new' } })}
            className="w-full py-3.5 px-6 rounded-xl font-cairo font-semibold text-white text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
            }}
          >
            ✨ {t('createProfile') || 'Créer un Profil'}
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'profile-selection' })}
            className="w-full py-3.5 px-6 rounded-xl font-cairo font-semibold text-text-main text-sm transition-all duration-200 hover:bg-white/10 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            🔑 {t('login') || 'Se Connecter'}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs font-cairo" style={{ color: 'rgba(148,163,184,0.5)' }}>
          Par Abu Junayd — بإذن الله
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;