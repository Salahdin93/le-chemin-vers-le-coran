import React, { useState, useEffect } from 'react';
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

import { clsx } from 'clsx';
import HadithPlanView from '@/components/views/HadithPlanView';
import HadithMemorizationView from '@/components/views/HadithMemorizationView';
import HadithEvaluationView from '@/components/views/HadithEvaluationView';
import HadithStatsView from '@/components/views/HadithStatsView';
import HadithRevisionPlanView from '@/components/views/HadithRevisionPlanView';
import HadithRevisionSettingsView from '@/components/views/HadithRevisionSettingsView';
import EvaluationPlansView from '@/components/views/EvaluationPlansView';
import EvaluationPlanFormView from '@/components/views/EvaluationPlanFormView';

const WhatsAppFloatButton: React.FC = () => {
  const { dispatch, t } = useStore();
  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_SHARE_MODAL', payload: true })}
      className="fixed bottom-44 right-5 z-[50] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
      aria-label={t('shareOnWhatsApp')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
      </svg>
    </button>
  );
};

const MainAppView: React.FC = () => {
  const { state, activeProfile, t } = useStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [state.activeView]);

  const renderActiveView = () => {
    switch (state.activeView) {
      case 'dashboard-view': return <DashboardView />;
      case 'reading-plan-view': return <ReadingPlanView />;
      case 'revision-plan-view': return <RevisionPlanView />;
      case 'memorization-view': return <MemorizationView />;
      case 'evaluation-view': return <EvaluationView />;
      case 'evaluation-plans-view': return <EvaluationPlansView />;
      case 'evaluation-plan-form-view': return <EvaluationPlanFormView />;
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
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <img src={LOGO_URL} alt="App Logo" className="w-48 h-48 object-contain mb-4" />
        <p className="text-xl">{t('errorProfileNotFound')}</p>
        <p>{t('reloadPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dynamic-bg geometric-overlay">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        <Header />
        <Nav />
        <main className={clsx(
          "max-w-6xl mx-auto transition-opacity duration-300 ease-in-out",
          isAnimating ? 'opacity-0' : 'opacity-100'
        )}>
          {renderActiveView()}
        </main>
        <Toast />
        <NotificationContainer />
        <NotificationCenterPanel isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} />
        <ShareModal />
        <PaceReadjustmentModal />
        {/* EndOfGoalModal is managed per-view; kept here for portal rendering */}
        <NotificationCenterButton onClick={() => setIsNotificationPanelOpen(true)} />
        <WhatsAppFloatButton />
      </div>
    </div>
  );
};

export default MainAppView;