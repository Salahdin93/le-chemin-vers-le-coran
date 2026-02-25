import React, { useState } from 'react';
import Header from './Header';
import Nav from './Nav';
import { useStore } from '@/context/AppContext';
import DashboardView from '@/components/views/DashboardView';
import ReadingPlanView from '@/components/views/ReadingPlanView';
import RevisionPlanView from '@/components/views/RevisionPlanView';
import MemorizationView from '@/components/views/MemorizationView';
import HistoryView from '@/components/views/HistoryView';
import SettingsView from '@/components/views/SettingsView';
import EvaluationView from '@/components/views/EvaluationView';
import AchievementsView from '@/components/views/AchievementsView';
import StatsView from '@/components/views/StatsView';
import Toast from '@/components/ui/Toast';
import NotificationContainer from '@/components/ui/NotificationContainer';
import NotificationCenterButton from '@/components/ui/NotificationCenterButton';
import NotificationCenterPanel from '@/components/ui/NotificationCenterPanel';
import { LOGO_URL } from '@/constants/ui';
import ShareModal from '@/components/ui/ShareModal';
import PaceReadjustmentModal from '@/components/ui/PaceReadjustmentModal';
import { motion, AnimatePresence } from 'framer-motion';
import HadithPlanView from '@/components/views/HadithPlanView';
import HadithMemorizationView from '@/components/views/HadithMemorizationView';
import HadithEvaluationView from '@/components/views/HadithEvaluationView';
import HadithStatsView from '@/components/views/HadithStatsView';
import HadithRevisionPlanView from '@/components/views/HadithRevisionPlanView';
import HadithRevisionSettingsView from '@/components/views/HadithRevisionSettingsView';
import { MessageCircle } from 'lucide-react';

const WhatsAppFloatButton: React.FC = () => {
  const { dispatch, t } = useStore();
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => dispatch({ type: 'TOGGLE_SHARE_MODAL', payload: true })}
      className="fixed bottom-32 right-6 md:bottom-10 md:right-10 z-40 w-16 h-16 bg-[#25D366] text-white rounded-[1.5rem] flex items-center justify-center shadow-premium transition-shadow hover:shadow-[#25D366]/40"
      aria-label={t('shareOnWhatsApp')}
    >
      <MessageCircle size={28} />
    </motion.button>
  );
};

const MainAppView: React.FC = () => {
  const { state, activeProfile, t } = useStore();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const renderActiveView = () => {
    switch (state.activeView) {
      case 'dashboard-view': return <DashboardView />;
      case 'reading-plan-view': return <ReadingPlanView />;
      case 'revision-plan-view': return <RevisionPlanView />;
      case 'memorization-view': return <MemorizationView />;
      case 'evaluation-view': return <EvaluationView />;
      case 'stats-view': return <StatsView />;
      case 'achievements-view': return <AchievementsView />;
      case 'history-view': return <HistoryView />;
      case 'settings-view': return <SettingsView />;
      case 'hadith-plan-view': return <HadithPlanView />;
      case 'hadith-memorization-view': return <HadithMemorizationView />;
      case 'hadith-evaluation-view': return <HadithEvaluationView />;
      case 'hadith-stats-view': return <HadithStatsView />;
      case 'hadith-revision-plan-view': return <HadithRevisionPlanView />;
      case 'hadith-revision-settings-view': return <HadithRevisionSettingsView />;
      default: return <DashboardView />;
    }
  };

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 dynamic-bg">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <img src={LOGO_URL} alt="App Logo" className="w-32 h-32 object-contain mb-8 filter grayscale opacity-20" />
          <p className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-2">{t('errorProfileNotFound')}</p>
          <p className="text-xs opacity-20">{t('reloadPrompt')}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dynamic-bg geometric-overlay flex flex-col items-center selection:bg-accent-color selection:text-white">
      <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col">
        <Header />
        <Nav />

        <main className="relative mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>

        <Toast />
        <NotificationContainer />
        <NotificationCenterPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} />
        <ShareModal />
        <PaceReadjustmentModal />

        <div className="fixed bottom-10 left-10 z-40 hidden lg:block">
          <NotificationCenterButton onClick={() => setIsNotificationPanelOpen(true)} />
        </div>

        <WhatsAppFloatButton />
      </div>

      {/* Decoration Elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-color/20 to-transparent z-[100]" />
    </div>
  );
};

export default MainAppView;