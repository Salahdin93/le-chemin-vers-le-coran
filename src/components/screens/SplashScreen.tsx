import React from 'react';
import { useStore } from '@/context/AppContext';
import { LOGO_URL, LOGO_URL_DARK } from '@/constants/ui';
import { motion } from 'framer-motion';

const SplashScreen: React.FC = () => {
  const { state, t } = useStore();
  
  const logoSrc = state.settings.theme === 'light' ? LOGO_URL : LOGO_URL_DARK;

  return (
    <motion.div
      // Ajout de la propriété "exit" pour l'animation de sortie
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-bg-main"
    >
      <div className="text-center font-cairo">
        <motion.img
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          src={logoSrc}
          alt="App Logo"
          className="w-48 h-48 md:w-72 md:h-72 object-contain mb-4"
        />
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-text-main"
        >
          {t('appName')}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
          className="text-lg md:text-xl text-text-main/70"
        >
          Par Abu Junayd
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;