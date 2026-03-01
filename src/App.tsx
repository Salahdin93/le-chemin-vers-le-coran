import { useEffect, useState } from 'react';
import { AppProvider, useStore } from './context/AppContext';
import LanguageScreen from './components/screens/LanguageScreen';
import WelcomeScreen from './components/screens/WelcomeScreen';
import LoginScreen from './components/screens/LoginScreen';
import Wizard from './components/screens/Wizard';
import MainAppView from './components/layout/MainAppView';
import InitialChoiceScreen from './components/screens/InitialChoiceScreen';
import ProfileSelectionScreen from './components/screens/ProfileSelectionScreen';
import LoadingOverlay from './components/ui/LoadingOverlay';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import NotificationContainer from './components/ui/NotificationContainer';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/screens/SplashScreen';
import { AnimatePresence } from 'framer-motion';

import AuthScreen from './components/screens/AuthScreen';
import { supabase } from './lib/supabase';

function AppContent() {
  const { state, dispatch } = useStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4500);

    return () => clearTimeout(splashTimer);
  }, []);

  // Supprimer barres de défilement sur écrans plein écran (auth, bienvenue, sélection profil)
  useEffect(() => {
    const noScrollScreens = ['auth', 'welcome', 'profile-selection'];
    const active = noScrollScreens.includes(state.appScreen);
    const el = document.documentElement;
    if (active) el.classList.add('overflow-hidden-body');
    else el.classList.remove('overflow-hidden-body');
    return () => el.classList.remove('overflow-hidden-body');
  }, [state.appScreen]);

  useEffect(() => {
    // Compte obligatoire : rediriger vers auth si non connecté sur les écrans protégés
    const checkAuthAndRedirect = async () => {
      if (showSplash) return;
      const protectedScreens = ['welcome', 'profile-selection', 'wizard', 'main', 'language'];
      if (!protectedScreens.includes(state.appScreen)) return;
      // Après réinitialisation totale : rester sur profile-selection (Bienvenue / Créer premier profil), ne pas renvoyer vers auth
      if ((state.appScreen === 'welcome' || state.appScreen === 'profile-selection') && state.profiles.length === 0) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' });
      }
    };
    checkAuthAndRedirect();
  }, [showSplash, state.appScreen, state.profiles.length, dispatch]);

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
      case 'wizard': return <Wizard key={state.profiles.length === 0 ? 'wizard-new' : 'wizard'} />;
      case 'main': return <MainAppView />;
      default: return <SplashScreen />;
    }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <div key={state.appScreen} className="geometric-overlay min-h-screen">
          {renderScreen()}
        </div>
      </AnimatePresence>
      <PWAInstallPrompt />
      <NotificationContainer />
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