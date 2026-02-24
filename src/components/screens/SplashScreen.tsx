import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { LOGO_URL, LOGO_URL_DARK } from '@/constants/ui';

const SplashScreen: React.FC = () => {
  const { activeProfile } = useStore();
  const isDark = ['dark', 'nightblue', 'midnight', 'chalkboard', 'crepuscule'].includes(activeProfile?.theme ?? 'dark');
  const logoSrc = isDark ? LOGO_URL_DARK : LOGO_URL;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center geometric-bg overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Radial emerald ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Animated golden ring halo */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 220,
          height: 220,
          background: 'transparent',
          border: '2px solid rgba(245,158,11,0.15)',
          boxShadow: '0 0 60px rgba(16,185,129,0.12)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 40px rgba(16,185,129,0.3)',
          }}
        >
          <img src={logoSrc} alt="Logo" className="w-20 h-20 object-contain" />
        </div>
      </motion.div>

      {/* App name */}
      <motion.h1
        className="mt-8 text-2xl font-cairo font-bold text-text-main tracking-tight text-center z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        Le Chemin vers le Coran
      </motion.h1>

      {/* Arabic subtitle */}
      <motion.p
        className="mt-2 font-amiri text-xl z-10"
        style={{ color: '#f59e0b', direction: 'rtl' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.6 }}
      >
        الطريق إلى القرآن
      </motion.p>

      {/* Loading dots */}
      <motion.div
        className="flex gap-2 mt-10 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--accent-color)' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default SplashScreen;