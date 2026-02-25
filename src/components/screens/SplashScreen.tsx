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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 40%, #065f46 70%, #047857 100%)' }}
    >
      {/* Islamic Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='0.8'%3E%3Cpolygon points='40,5 55,20 75,20 60,35 67,55 40,45 13,55 20,35 5,20 25,20'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Background green glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(52,211,153,0.25) 0%, transparent 70%)',
        }}
      />
      {/* Bottom amber glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 110%, rgba(245,158,11,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Animated outer ring — large, slow pulse */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 320,
          height: 320,
          border: '1px solid rgba(52,211,153,0.12)',
          boxShadow: '0 0 60px rgba(52,211,153,0.08)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 240,
          height: 240,
          border: '1px solid rgba(245,158,11,0.15)',
          boxShadow: '0 0 40px rgba(245,158,11,0.08)',
        }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      {/* Inner ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 160,
          height: 160,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.25 }}
      />

      {/* Floating golden particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background: i % 2 === 0 ? 'rgba(251,191,36,0.6)' : 'rgba(52,211,153,0.5)',
            left: `${15 + (i * 10) % 70}%`,
            top: `${20 + (i * 13) % 60}%`,
          }}
          animate={{
            y: [0, -20 - i * 4, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + i * 0.4,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 60px rgba(16,185,129,0.4), 0 0 120px rgba(16,185,129,0.2), 0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <img src={logoSrc} alt="Logo" className="w-22 h-22 object-contain" style={{ width: 88, height: 88 }} />
        </div>
      </motion.div>

      {/* App name */}
      <motion.h1
        className="mt-8 text-2xl font-cairo font-black tracking-tight text-center z-10"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #d1fae5 50%, #6ee7b7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 8px rgba(52,211,153,0.4))',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
      >
        Le Chemin vers le Coran
      </motion.h1>

      {/* Arabic subtitle */}
      <motion.p
        className="mt-2 font-amiri text-xl z-10"
        style={{
          direction: 'rtl',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 1px 6px rgba(251,191,36,0.5))',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.7 }}
      >
        الطريق إلى القرآن
      </motion.p>

      {/* Loading dots */}
      <motion.div
        className="flex gap-2.5 mt-12 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: i === 1 ? '#f59e0b' : '#10b981' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.2, 0.7] }}
            transition={{ duration: 1.4, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default SplashScreen;