import React, { useEffect } from 'react';
import { useStore } from '@/context/AppContext';

const Toast: React.FC = () => {
  const { state, dispatch } = useStore();
  const { message, visible } = state.toast;

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-primary text-white shadow-lg transition-all duration-300 z-[100] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      {message}
    </div>
  );
};

export default Toast;