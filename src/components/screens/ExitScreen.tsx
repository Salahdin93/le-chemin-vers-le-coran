import React, { useEffect } from 'react';
import { useStore } from '@/context/AppContext';

const ExitScreen: React.FC = () => {
  const { dispatch } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      // After the animation, truly reset to the initial screen
      dispatch({ type: 'RESET_APP' });
    }, 4000); // Matches the animation duration

    return () => clearTimeout(timer);
  }, [dispatch]);

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-gradient-to-tr from-[#fbeec1] to-white animate-fadeIn">
      <div className="text-center font-amiri animate-zoomOut">
        <h1 className="text-5xl text-[#6a4e2d] mb-4">بَارَكَ ٱللّٰهُ فِيكُمْ</h1>
        <p className="text-3xl text-[#6a4e2d]">وَٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللّٰهِ</p>
      </div>
    </div>
  );
};

export default ExitScreen;