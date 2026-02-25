import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { LOGO_URL_DARK } from '@/constants/ui';
import Button from '@/components/ui/Button';

const WelcomeScreen: React.FC = () => {
  const { dispatch, t } = useStore();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center dynamic-bg geometric-overlay overflow-hidden">
      {/* Ambient Animated Glows */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-color blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500 blur-[120px] pointer-events-none"
      />

      <motion.div
        className="relative w-full max-w-md mx-auto px-6 z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-12 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-28 h-28 rounded-3xl flex items-center justify-center mb-6 glass-card border-none shadow-premium animate-float"
          >
            <img src={LOGO_URL_DARK} alt="App Logo" className="w-20 h-20 object-contain drop-shadow-2xl" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-black text-gradient mb-2 px-4 shadow-sm">
              {t('appName')}
            </h1>
            <p className="font-amiri text-2xl text-warning drop-shadow-sm mb-4" style={{ direction: 'rtl' }}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>
            <div className="w-12 h-1 bg-accent-color/30 rounded-full mx-auto" />
          </motion.div>
        </div>

        {/* Main Actions Container */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-4 glass-card p-8 border-none shadow-premium bg-white/5"
        >
          <p className="text-sm text-center font-bold uppercase tracking-widest text-text-main/40 mb-2">
            {t('welcomeSubtitle') || "Commencez votre voyage spirituel"}
          </p>

          <Button
            variant="accent"
            size="lg"
            className="w-full py-5 text-base"
            onClick={() => dispatch({ type: 'START_WIZARD', payload: { type: 'full', mode: 'new' } })}
          >
            ✨ {t('createProfile') || 'Créer un Profil'}
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              size="md"
              className="w-full py-4 text-xs font-black uppercase tracking-widest"
              onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'profile-selection' })}
            >
              🔑 {t('login') || 'Connexion'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="w-full py-4 text-xs font-black uppercase tracking-widest"
              onClick={() => dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' })}
            >
              ☁️ {t('cloudSync') || 'Cloud'}
            </Button>
          </div>
        </motion.div>

        {/* Footer Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">
            Abu Junayd • Editeur — بإذن الله
          </p>
          <div className="text-[8px] opacity-60">Version 7.0 Premium</div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;