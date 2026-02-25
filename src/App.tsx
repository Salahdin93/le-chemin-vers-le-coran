import { useEffect, useState } from 'react';
import { AppProvider, useStore } from './context/AppContext';
import LanguageScreen from './components/screens/LanguageScreen';
import WelcomeScreen from './components/screens/WelcomeScreen';
import LoginScreen from './components/screens/LoginScreen';
import Wizard from './components/screens/Wizard';
import MainAppView from './components/layout/MainAppView';
import InitialChoiceScreen from './components/screens/InitialChoiceScreen';
import ProfileSelectionScreen from './components/screens/ProfileSelectionScreen';
import { Profile } from './types/types';
import LoadingOverlay from './components/ui/LoadingOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/screens/SplashScreen';
import { AnimatePresence } from 'framer-motion';

import AuthScreen from './components/screens/AuthScreen';

function AppContent() {
  const { state, dispatch } = useStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4500);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!showSplash && state.appScreen === 'splash') {
      const savedState = localStorage.getItem('quranCompanionState_v7');
      if (!savedState) {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'language' });
        return;
      }

      const parsedState = JSON.parse(savedState);

      if (parsedState.profiles && parsedState.profiles.length > 0) {
        if (parsedState.activeProfileId) {
          const lastActiveProfile = parsedState.profiles.find((p: Profile) => p.id === parsedState.activeProfileId);
          if (lastActiveProfile?.password) {
            dispatch({ type: 'SET_APP_SCREEN', payload: 'profile-selection' });
          } else {
            dispatch({ type: 'SET_APP_SCREEN', payload: 'main' });
          }
        } else {
          dispatch({ type: 'SET_APP_SCREEN', payload: 'profile-selection' });
        }
      } else {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' });
      }
    }
  }, [showSplash, state.appScreen, dispatch]);

  const renderScreen = () => {
    if (showSplash || state.appScreen === 'splash') {
      return <SplashScreen />;
    }

    switch (state.appScreen) {
      case 'language': return <LanguageScreen />;
      case 'welcome': return <WelcomeScreen />;
      case 'initial-choice': return <InitialChoiceScreen />;
      case 'profile-selection': return <ProfileSelectionScreen />;
      case 'login': return <LoginScreen />;
      case 'auth': return <AuthScreen />;
      case 'wizard': return <Wizard />;
      case 'main': return <MainAppView />;
      default: return <SplashScreen />;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={state.appScreen}>
          {renderScreen()}
        </div>
      </AnimatePresence>
      <LoadingOverlay isLoading={state.isLoading} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;