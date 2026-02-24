import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/AppContext';

const WelcomeScreen: React.FC = () => {
    const { state, dispatch, t } = useStore();

    const handleCreateProfile = () => {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'initial-choice' });
    };

    const handleLogin = () => {
        if (state.profiles && state.profiles.length > 0) {
            dispatch({ type: 'SET_APP_SCREEN', payload: 'profile-selection' });
        } else {
            dispatch({ type: 'SET_APP_SCREEN', payload: 'initial-choice' });
        }
    };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-gradient-to-tr from-[#f0f2f5] to-[#e6e9f0] p-5">
      <Card className="text-center max-w-md w-full !bg-white/95 backdrop-blur-sm">
        <h1 className="font-amiri text-5xl mb-2 text-gray-800">مَرْحَبًا بِكُمْ !</h1>
        <p className="text-lg mb-8 text-gray-600">Votre compagnon pour la lecture et la révision du Coran</p>
        <div className="flex flex-col gap-4">
          <Button size="lg" variant="success" onClick={handleCreateProfile}>
            {t('createProfile')}
          </Button>
          <Button size="lg" className="!bg-[#c19a6b] hover:!bg-[#b58f5e]" onClick={handleLogin}>
            {t('login')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WelcomeScreen;