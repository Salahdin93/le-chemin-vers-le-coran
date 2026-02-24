import React, { useEffect } from 'react';
import { useStore } from '@/context/AppContext';

const Toast: React.FC = () => {
  const { state, dispatch } = useStore();
  const { message, visible } = state.toast;

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[120] flex items-center gap-2 px-5 py-3 rounded-full text-sm font-cairo font-semibold text-white select-none pointer-events-none transition-all duration-400 ${visible ? 'opacity-100 translate-y-0 -translate-x-1/2' : 'opacity-0 translate-y-4 -translate-x-1/2'
        }`}
      style={{
        background: 'linear-gradient(135deg, var(--accent-color) 0%, rgba(16,185,129,0.8) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 16px rgba(16,185,129,0.25)',
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(16px)',
      }}
    >
      {/* Dot indicator */}
      <span
        className="w-2 h-2 rounded-full bg-white/80 inline-block flex-shrink-0"
        style={{ boxShadow: '0 0 6px rgba(255,255,255,0.8)' }}
      />
      {message}
    </div>
  );
};

export default Toast;