import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/AppContext';
import { Language } from '@/types';

const LanguageScreen: React.FC = () => {
  const { dispatch } = useStore();

  const handleSelectLanguage = (lang: Language) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { lang } });
    dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' });
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-gradient-to-tr from-[#f5f7fa] to-[#c3cfe2] p-5">
      <Card className="text-center max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-6">🌍 Choisissez votre langue</h2>
        <div className="flex flex-col gap-4">
          <Button size="lg" onClick={() => handleSelectLanguage('fr')}>
            🇫🇷 Français
          </Button>
          <Button size="lg" onClick={() => handleSelectLanguage('ar')}>
            🇸🇦 العربية
          </Button>
          <Button size="lg" onClick={() => handleSelectLanguage('en')}>
            🇬🇧 English
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LanguageScreen;