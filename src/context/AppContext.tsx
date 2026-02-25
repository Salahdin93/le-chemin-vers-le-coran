import React, { createContext, useReducer, ReactNode, Dispatch, useEffect, useMemo, useContext, useCallback, useSyncExternalStore } from 'react';
import { AppState, AppAction, Profile, WizardData, WizardMode, EvaluationRecord, BadgeId, Theme, AccentColor, HadithMemorizationStatus, HadithHistoryEntry, EvaluationPlan } from '../types/types';
import { generateReadingPlan, generateRevisionPlan, recalculateFuturePlan, generateHadithRevisionPlan } from '../services/planLogic';
import { notificationService } from '../components/ui/NotificationContainer';
import AlKahfReminder from '../components/reminders/AlKahfReminder';
import { getInitialBadges, checkRevisionMilestone, checkPerfectEvaluation, checkFirstMemorization, checkKhatmaMilestones, checkHadithMilestones } from '../services/achievementLogic';
import { TRANSLATIONS } from '../translations';
import { appStateSchema } from '../schemas/appStateSchema';
import { dbService } from '../lib/dbService';
import { supabase } from '../lib/supabase';

const defaultState: AppState = {
  isLoading: false,
  appScreen: 'splash',
  activeView: 'dashboard-view',
  profiles: [],
  activeProfileId: null,
  settings: { lang: 'fr', enableNotifications: true, notificationTime: '09:00' },
  progress: { startDate: null, currentReadingDay: 1, consecutiveDays: 0, totalPagesRead: 0, readingHistory: {}, currentRevisionIndex: 0, currentHadithRevisionIndex: 0, history: { reading: [], revision: [], toReview: [], hadithRevisionHistory: [] } },
  plans: { reading: null, revision: null, hadithRevision: null, originalReading: null },
  wizard: { isOpen: false, type: 'full', mode: 'new' },
  toast: { message: '', visible: false },
  isShareModalOpen: false,
  readjustmentModal: { isOpen: false, type: null },
  notificationHistory: [],
  kahfNotificationShownThisSession: false,
  activeEvaluationPlan: null,
  editingEvaluationPlanId: null,
};

const getActiveProfile = (profiles: Profile[], activeProfileId: string | null) => profiles.find(p => p.id === activeProfileId) || null;

function appReducer(state: AppState, action: AppAction): AppState {
  const activeProfile = getActiveProfile(state.profiles, state.activeProfileId);

  const unlockBadge = (currentState: AppState, badgeId: BadgeId | null): AppState => {
    if (!badgeId) return currentState;
    const t = (key: string) => (TRANSLATIONS[currentState.settings.lang] as any)[key] || key;
    const badgeInfo = getInitialBadges().find(b => b.id === badgeId);

    const newState = appReducer(currentState, { type: 'UNLOCK_BADGE', payload: badgeId });

    if (badgeInfo) {
      return appReducer(newState, { type: 'SET_TOAST', payload: `${t('badgeUnlocked')}: ${badgeInfo.name}` });
    }
    return newState;
  };

  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'INITIALIZE_STATE': {
      let initialState = action.payload;
      if ((initialState as any).profile && !initialState.profiles) {
        const legacyProfile = (initialState as any).profile;
        const migratedProfile: Profile = { ...legacyProfile, id: `profile_legacy`, badges: getInitialBadges(), theme: 'light', accentColor: '#2E7D32', hadithProgress: {}, hadithHistory: [], evaluationPlans: [] };
        initialState.profiles = [migratedProfile];
        initialState.activeProfileId = migratedProfile.id;
        delete (initialState as any).profile;
      }
      if (initialState.profiles) {
        initialState.profiles.forEach((profile: Profile & { evaluationPlan?: EvaluationPlan }) => {
          if (!profile.difficulties) profile.difficulties = [];
          if (!(profile.memorizations as any).surahParts) { (profile.memorizations as any).surahParts = (profile.memorizations as any).surahs || []; }
          if (!profile.evaluationHistory) profile.evaluationHistory = [];

          if (profile.evaluationPlan && !profile.evaluationPlans) {
            profile.evaluationPlans = [profile.evaluationPlan];
            delete profile.evaluationPlan;
          } else if (!profile.evaluationPlans) {
            profile.evaluationPlans = [];
          }

          if (!profile.badges) profile.badges = getInitialBadges();
          if (!profile.theme) profile.theme = 'light';
          if (!profile.accentColor) profile.accentColor = '#2E7D32';
          if (!profile.hadithProgress) profile.hadithProgress = {};
          if (!profile.hadithHistory) profile.hadithHistory = [];
        });
      }

      const activeProf = getActiveProfile(initialState.profiles || [], initialState.activeProfileId);
      const mergedProgress = activeProf?.progress || initialState.progress || defaultState.progress;
      const mergedPlans = activeProf?.plans || initialState.plans || defaultState.plans;

      return {
        ...defaultState,
        ...initialState,
        progress: mergedProgress,
        plans: mergedPlans,
        notificationHistory: [],
        kahfNotificationShownThisSession: false
      };
    }
    case 'UPDATE_SETTINGS': { return { ...state, settings: { ...state.settings, ...action.payload } }; }
    case 'SET_APP_SCREEN': return { ...state, appScreen: action.payload };
    case 'SET_ACTIVE_PROFILE': {
      // Sauvegarder l'état actuel (progrès/plans) dans le profil qui va devenir inactif
      const updatedProfiles = state.profiles.map(p =>
        p.id === state.activeProfileId ? { ...p, progress: state.progress, plans: state.plans } : p
      );

      const targetProfile = updatedProfiles.find(p => p.id === action.payload);
      return {
        ...state,
        profiles: updatedProfiles,
        activeProfileId: action.payload,
        appScreen: 'main',
        progress: targetProfile?.progress || defaultState.progress,
        plans: targetProfile?.plans || defaultState.plans
      };
    }
    case 'ADD_PROFILE': return { ...state, profiles: [...state.profiles, action.payload] };
    case 'REMOVE_PROFILE': {
      const newProfiles = state.profiles.filter(p => p.id !== action.payload);
      const newActiveProfileId = state.activeProfileId === action.payload ? (newProfiles[0]?.id || null) : state.activeProfileId;
      return { ...state, profiles: newProfiles, activeProfileId: newActiveProfileId };
    }
    case 'UPDATE_PROFILE': {
      const updatePayload = action.payload;
      const targetProfileId = updatePayload.id || state.activeProfileId;
      if (!targetProfileId) { return state; }
      return {
        ...state,
        profiles: state.profiles.map(p => (p.id === targetProfileId) ? { ...p, ...updatePayload } : p),
      };
    }
    case 'SET_ACTIVE_VIEW': return { ...state, activeView: action.payload };
    case 'SET_TOAST': return { ...state, toast: { message: action.payload, visible: true } };
    case 'HIDE_TOAST': return { ...state, toast: { ...state.toast, visible: false } };
    case 'TOGGLE_SHARE_MODAL': return { ...state, isShareModalOpen: action.payload };
    case 'TOGGLE_READJUSTMENT_MODAL': return { ...state, readjustmentModal: action.payload };
    case 'START_WIZARD': return { ...state, appScreen: 'wizard', wizard: { isOpen: true, type: action.payload.type, mode: action.payload.mode } };
    case 'FINISH_WIZARD': {
      const { wizardData, profileId, startDate } = action.payload as { wizardData: Partial<WizardData>; mode: WizardMode; profileId: string; startDate: string };
      const tFn = (key: string) => (TRANSLATIONS[state.settings.lang] as Record<string, string>)[key] || key;
      const newProgress = { ...defaultState.progress, startDate };
      const readingPlan = wizardData.wantsReading ? generateReadingPlan({ duration: wizardData.duration!, khatmas: wizardData.khatmas!, kahfOption: wizardData.kahfOption!, kahfPages: wizardData.kahfPages!, pagesPerDay: wizardData.pagesPerDay! }, startDate) : null;
      const revisionPlan = wizardData.wantsRevision ? generateRevisionPlan({ selection: wizardData.revisionSelection!, revisionMode: wizardData.revisionMode!, unitsPerDay: wizardData.unitsPerDay!, revisionDuration: wizardData.revisionDuration!, frequency: wizardData.revisionFrequency!, boosterSurahs: wizardData.boosterSurahs!, boosterSurahFreq: wizardData.boosterSurahFreq!, prioritizeWeaknesses: (wizardData as Record<string, unknown>).prioritizeWeaknesses as boolean | undefined }, startDate, 1, tFn, { surahParts: [], hizbs: [], juzz: [] }) : null;

      const newProfile: Profile = {
        id: profileId,
        name: wizardData.name || 'Utilisateur',
        gender: wizardData.gender || 'male',
        password: wizardData.password,
        theme: wizardData.theme || 'light',
        accentColor: wizardData.accentColor || '#2E7D32',
        goals: {
          reading: wizardData.wantsReading ? { duration: wizardData.duration!, khatmas: wizardData.khatmas!, kahfOption: wizardData.kahfOption!, kahfPages: wizardData.kahfPages!, pagesPerDay: wizardData.pagesPerDay! } : undefined,
          revision: wizardData.wantsRevision ? { selection: wizardData.revisionSelection!, revisionMode: wizardData.revisionMode!, unitsPerDay: wizardData.unitsPerDay!, revisionDuration: wizardData.revisionDuration!, frequency: wizardData.revisionFrequency!, boosterSurahs: wizardData.boosterSurahs!, boosterSurahFreq: wizardData.boosterSurahFreq!, prioritizeWeaknesses: (wizardData as Record<string, unknown>).prioritizeWeaknesses as boolean | undefined } : undefined
        },
        memorizations: { surahParts: [], hizbs: [], juzz: [] },
        hadithProgress: {},
        hadithHistory: [],
        difficulties: [],
        evaluationPlans: [],
        evaluationHistory: [],
        badges: getInitialBadges(),
        progress: newProgress,
        plans: { reading: readingPlan, originalReading: readingPlan, revision: revisionPlan, hadithRevision: null },
      };

      return {
        ...state,
        profiles: [...state.profiles, newProfile],
        activeProfileId: newProfile.id,
        progress: newProgress,
        plans: { ...state.plans, reading: readingPlan, originalReading: readingPlan, revision: revisionPlan },
        appScreen: 'main',
        activeView: 'dashboard-view',
        wizard: { ...state.wizard, isOpen: false },
        isLoading: false
      };
    }
    case 'UPDATE_HADITH_STATUS': {
      if (!activeProfile) return state;
      const { hadithId, status, date } = action.payload as { hadithId: number; status: HadithMemorizationStatus; date: string };
      const newHistoryEntry: HadithHistoryEntry = { date, hadithId, action: status };
      const newHadithHistory = [newHistoryEntry, ...(activeProfile.hadithHistory || [])];
      const newHadithProgress = { ...activeProfile.hadithProgress, [hadithId]: status };
      const updatedProfile = { ...activeProfile, hadithProgress: newHadithProgress, hadithHistory: newHadithHistory };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p) };
      const badge = checkHadithMilestones(newState);
      return unlockBadge(newState, badge);
    }
    case 'SET_HADITH_REVISION_PLAN': {
      if (!activeProfile) return state;
      const { goal } = action.payload;
      const plan = generateHadithRevisionPlan(goal, state.progress.startDate || new Date().toISOString());
      const updatedProfile = { ...activeProfile, goals: { ...activeProfile.goals, hadithRevision: goal } };
      return {
        ...state,
        profiles: state.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p),
        plans: { ...state.plans, hadithRevision: plan },
        progress: { ...state.progress, currentHadithRevisionIndex: 0 }
      };
    }
    case 'UPDATE_HADITH_REVISION_STATUS': {
      const { dayIndex, status } = action.payload;
      const newHadithPlan = state.plans.hadithRevision ? [...state.plans.hadithRevision] : [];
      if (newHadithPlan[dayIndex]) { newHadithPlan[dayIndex].status = status; }
      const newCurrentIndex = (dayIndex === state.progress.currentHadithRevisionIndex && status !== 'pending') ? state.progress.currentHadithRevisionIndex + 1 : state.progress.currentHadithRevisionIndex;
      return { ...state, plans: { ...state.plans, hadithRevision: newHadithPlan }, progress: { ...state.progress, currentHadithRevisionIndex: newCurrentIndex } };
    }
    case 'COMPLETE_HADITH_REVISION_GOAL': {
      const newHistory = [...state.progress.history.hadithRevisionHistory, action.payload.goal];
      return { ...state, progress: { ...state.progress, history: { ...state.progress.history, hadithRevisionHistory: newHistory, }, }, };
    }
    case 'LOGOUT': {
      const updatedProfiles = state.profiles.map(p =>
        p.id === state.activeProfileId ? { ...p, progress: state.progress, plans: state.plans } : p
      );
      return { ...state, profiles: updatedProfiles, activeProfileId: null, appScreen: 'profile-selection' };
    }
    case 'RESET_APP': {
      localStorage.removeItem('quranCompanionState_v7');
      return { ...defaultState, appScreen: 'language' };
    }
    case 'RESET_PROGRESS': {
      if (!activeProfile || !state.progress.startDate) return state;
      const freshProgress = { ...defaultState.progress, startDate: new Date().toISOString().split('T')[0], history: state.progress.history };
      const tFn = (key: string) => (TRANSLATIONS[state.settings.lang] as Record<string, string>)[key] || key;
      const readingPlan = activeProfile.goals.reading ? generateReadingPlan(activeProfile.goals.reading, freshProgress.startDate) : null;
      const revisionPlan = activeProfile.goals.revision ? generateRevisionPlan(activeProfile.goals.revision, freshProgress.startDate, 1, tFn, activeProfile.memorizations) : null;
      return { ...state, progress: freshProgress, plans: { ...state.plans, reading: readingPlan, originalReading: readingPlan, revision: revisionPlan, hadithRevision: null } };
    }
    case 'UPDATE_PLANS': return { ...state, plans: { ...state.plans, reading: action.payload.reading, revision: action.payload.revision } };
    case 'ADJUST_PACE': {
      if (!state.plans.originalReading) return state;
      const recalculatedPlan = recalculateFuturePlan(state.plans.originalReading, state.progress.readingHistory, state.progress.currentReadingDay);
      return { ...state, plans: { ...state.plans, reading: recalculatedPlan } };
    }
    case 'EXTEND_DURATION': {
      if (!activeProfile?.goals.reading || !state.progress.startDate) return state;
      const newDuration = activeProfile.goals.reading.duration + action.payload;
      const newGoal = { ...activeProfile.goals.reading, duration: newDuration };
      const newOriginalPlan = generateReadingPlan(newGoal, state.progress.startDate);
      const newRecalculatedPlan = recalculateFuturePlan(newOriginalPlan, state.progress.readingHistory, state.progress.currentReadingDay);
      const updatedProfile = { ...activeProfile, goals: { ...activeProfile.goals, reading: newGoal } };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p), plans: { ...state.plans, reading: newRecalculatedPlan, originalReading: newOriginalPlan } };
    }
    case 'ADVANCE_DAY': return { ...state, progress: { ...state.progress, readingHistory: action.payload.newHistory, consecutiveDays: action.payload.newConsecutiveDays, currentReadingDay: state.progress.currentReadingDay + 1 }, plans: { ...state.plans, reading: action.payload.recalculatedPlan } };
    case 'UPDATE_READING_HISTORY': return { ...state, progress: { ...state.progress, readingHistory: action.payload.newHistory }, plans: { ...state.plans, reading: action.payload.recalculatedPlan } };
    case 'UPDATE_REVISION_STATUS': {
      if (!state.plans.revision) return state;
      const newRevisionPlan = [...state.plans.revision];
      newRevisionPlan[action.payload.revisionIndex] = { ...newRevisionPlan[action.payload.revisionIndex], status: action.payload.status, difficulties: action.payload.difficulties || [], timeSpent: action.payload.timeSpent };
      let newDifficulties = [...(activeProfile?.difficulties || [])];
      if (action.payload.difficulties && action.payload.difficulties.length > 0) {
        action.payload.difficulties.forEach(diff => {
          if (!newDifficulties.find(d => d.surahName === diff && d.hizbNum === action.payload.hizbNum)) {
            newDifficulties.push({ surahName: diff, hizbNum: action.payload.hizbNum || null });
          }
        });
      }
      const updatedProfile = activeProfile ? { ...activeProfile, difficulties: newDifficulties } : null;
      const newState = {
        ...state,
        plans: { ...state.plans, revision: newRevisionPlan },
        profiles: updatedProfile ? state.profiles.map(p => p.id === activeProfile?.id ? updatedProfile : p) : state.profiles,
        progress: { ...state.progress, currentRevisionIndex: action.payload.status === 'revised' ? state.progress.currentRevisionIndex + 1 : state.progress.currentRevisionIndex }
      };
      const badge = checkRevisionMilestone(newState);
      return unlockBadge(newState, badge);
    }
    case 'COMPLETE_GOAL': {
      const historyType = action.payload.type;
      const newHistory = { ...state.progress.history, [historyType]: [...state.progress.history[historyType], action.payload.goal] };
      const newState = { ...state, progress: { ...state.progress, history: newHistory } };
      if (historyType === 'reading') {
        const badge = checkKhatmaMilestones(newState);
        return unlockBadge(newState, badge);
      }
      return newState;
    }
    case 'ADD_MEMORIZATION': {
      if (!activeProfile) return state;
      const { type, item } = action.payload;
      const newMemorizations = { ...activeProfile.memorizations, [type + 's']: [...(activeProfile.memorizations as any)[type + 's'], item] };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
      const badge = checkFirstMemorization(newState);
      return unlockBadge(newState, badge);
    }
    case 'REMOVE_MEMORIZATION': {
      if (!activeProfile) return state;
      const { type, item } = action.payload;
      const newMemorizations = { ...activeProfile.memorizations, [type + 's']: (activeProfile.memorizations as any)[type + 's'].filter((i: any) => i.id !== item.id && i.number !== item.number) };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
    }
    case 'UPDATE_MEMORIZATIONS': {
      if (!activeProfile) return state;
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: action.payload } : p) };
    }
    case 'UPDATE_MEMORIZATION_STATUS': {
      if (!activeProfile) return state;
      const { type, ids, status } = action.payload;
      const listKey = type === 'surahPart' ? 'surahParts' : type + 's';
      const newList = (activeProfile.memorizations as any)[listKey].map((item: any) => ids.includes(item.id || item.number) ? { ...item, status } : item);
      const newMemorizations = { ...activeProfile.memorizations, [listKey]: newList };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
    }
    case 'SAVE_EVALUATION_RESULTS': {
      if (!activeProfile) return state;
      const record: EvaluationRecord = { id: `eval_${Date.now()}`, date: new Date().toISOString(), items: action.payload };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, evaluationHistory: [record, ...p.evaluationHistory] } : p) };
      const badge = checkPerfectEvaluation(action.payload, newState);
      return unlockBadge(newState, badge);
    }
    case 'ADD_EVALUATION_PLAN': {
      if (!activeProfile) return state;
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, evaluationPlans: [...(p.evaluationPlans || []), action.payload] } : p) };
    }
    case 'UPDATE_EVALUATION_PLAN': {
      if (!activeProfile) return state;
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, evaluationPlans: (p.evaluationPlans || []).map(plan => plan.id === action.payload.id ? { ...plan, ...action.payload } : plan) } : p) };
    }
    case 'REMOVE_EVALUATION_PLAN': {
      if (!activeProfile) return state;
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, evaluationPlans: (p.evaluationPlans || []).filter(plan => plan.id !== action.payload.id) } : p) };
    }
    case 'SET_ACTIVE_EVALUATION_PLAN': return { ...state, activeEvaluationPlan: action.payload };
    case 'SET_EDITING_EVALUATION_PLAN_ID': return { ...state, editingEvaluationPlanId: action.payload };
    case 'ADD_NOTIFICATION_TO_HISTORY': return { ...state, notificationHistory: [action.payload, ...state.notificationHistory] };
    case 'REMOVE_NOTIFICATION_FROM_HISTORY': return { ...state, notificationHistory: state.notificationHistory.filter(n => n.id !== action.payload) };
    case 'CLEAR_NOTIFICATION_HISTORY': return { ...state, notificationHistory: [] };
    case 'SET_KAHF_NOTIFICATION_SHOWN': return { ...state, kahfNotificationShownThisSession: true };
    case 'SET_APP_LANGUAGE': return { ...state, settings: { ...state.settings, lang: action.payload } };
    default: return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  activeProfile: Profile | null;
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => AppState;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const activeProfile = useMemo(() => getActiveProfile(state.profiles, state.activeProfileId), [state.profiles, state.activeProfileId]);

  const t = useCallback((key: string, replacements: Record<string, string | number> = {}): string => {
    let translation = (TRANSLATIONS[state.settings.lang]?.[key]) || key;
    Object.keys(replacements).forEach(rKey => {
      translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
    });
    return translation;
  }, [state.settings.lang]);

  // Chargement initial
  useEffect(() => {
    const loadState = async () => {
      try {
        // 1. Tenter de charger depuis Supabase (prioritaire si connecté)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const remoteSettings = await dbService.getSettings();
          const remoteProfiles = await dbService.getProfiles();

          if (remoteProfiles.length > 0 || remoteSettings) {
            const newState = {
              ...defaultState,
              profiles: remoteProfiles,
              settings: remoteSettings?.settings ? { ...state.settings, ...remoteSettings.settings } : state.settings,
              activeProfileId: remoteSettings?.activeProfileId || (remoteProfiles[0]?.id || null)
            };
            dispatch({ type: 'INITIALIZE_STATE', payload: newState });
            return;
          }
        }

        // 2. Fallback sur localStorage (legacy ou non connecté)
        const savedStateJSON = localStorage.getItem('quranCompanionState_v7');
        if (savedStateJSON) {
          const parsedState = JSON.parse(savedStateJSON);
          const validationResult = appStateSchema.safeParse(parsedState);
          if (validationResult.success) {
            dispatch({ type: 'INITIALIZE_STATE', payload: { ...defaultState, ...validationResult.data } });
          } else {
            console.warn("Invalid data found in localStorage. Resetting state.", validationResult.error);
            localStorage.removeItem('quranCompanionState_v7');
            dispatch({ type: 'SET_APP_SCREEN', payload: 'language' });
          }
        } else {
          const browserLang = navigator.language.split('-')[0];
          const initialLang = ['fr', 'en', 'ar'].includes(browserLang) ? browserLang as 'fr' : 'fr';
          dispatch({ type: 'UPDATE_SETTINGS', payload: { lang: initialLang as any } });
          dispatch({ type: 'SET_APP_SCREEN', payload: 'language' });
        }
      } catch (error) {
        console.error("Failed to load or parse state", error);
        dispatch({ type: 'SET_APP_SCREEN', payload: 'language' });
      }
    };

    loadState();
  }, []);

  // Sauvegarde automatique optimisée (Supabase + localStorage)
  useEffect(() => {
    if (state.appScreen === 'splash' || state.isLoading) return;

    // 1. Sauvegarde LocalStorage immédiate (c'est local, donc gratuit)
    try {
      const stateToSave = { ...state, notificationHistory: [] };
      localStorage.setItem('quranCompanionState_v7', JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }

    // 2. Sauvegarde Supabase DEBOUNCED (pour économiser l'Egress/API)
    const timeoutId = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('☁️ Syncing to Supabase (optimized)...');
        await dbService.syncFullState(state);
      }
    }, 3000); // On attend 3 secondes d'inactivité avant de synchroniser

    return () => clearTimeout(timeoutId);

    // On ne surveille QUE les données persistantes pour éviter de sync lors d'un toast ou d'un changement de vue
  }, [state.profiles, state.settings, state.progress, state.plans, state.activeProfileId]);

  useEffect(() => {
    if (state.appScreen === 'main' && activeProfile && !state.kahfNotificationShownThisSession) {
      const today = new Date();
      if (today.getDay() === 5 && activeProfile.goals.reading?.kahfOption) {
        notificationService.show({ content: <AlKahfReminder />, duration: 30000, type: 'info' });
        dispatch({ type: 'SET_KAHF_NOTIFICATION_SHOWN' });
      }
    }
  }, [state.appScreen, state.kahfNotificationShownThisSession, activeProfile]);

  useEffect(() => {
    const scheduleNotification = () => {
      if (!state.settings.enableNotifications || !state.settings.notificationTime) return;

      const [hours, minutes] = state.settings.notificationTime.split(':').map(Number);

      const checkAndNotify = () => {
        const now = new Date();
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          notificationService.show({
            title: t('dailyReminderTitle'),
            message: t('dailyReminderMessage'),
            type: 'info'
          });
        }
      };

      const intervalId = setInterval(checkAndNotify, 60000);
      return () => clearInterval(intervalId);
    };

    const clearNotification = scheduleNotification();
    return clearNotification;
  }, [state.settings.enableNotifications, state.settings.notificationTime, t]);

  useEffect(() => {
    const theme: Theme = activeProfile?.theme || 'light';
    const accentColor: AccentColor = activeProfile?.accentColor || '#2E7D32';
    const lang = state.settings.lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.className = '';
    document.documentElement.classList.add(theme);
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [state.settings.lang, activeProfile]);

  const storeRef = React.useRef({ state, listeners: new Set<() => void>() });
  storeRef.current.state = state;

  const subscribe = useCallback((callback: () => void) => {
    storeRef.current.listeners.add(callback);
    return () => storeRef.current.listeners.delete(callback);
  }, []);

  const getSnapshot = useCallback(() => storeRef.current.state, []);

  const enhancedDispatch = (action: AppAction) => {
    dispatch(action);
    storeRef.current.listeners.forEach(listener => listener());
  };

  const value = useMemo(() => ({ state, dispatch: enhancedDispatch, t, activeProfile, subscribe, getSnapshot }), [state, t, activeProfile, subscribe, getSnapshot]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useStore must be used within an AppProvider');
  }
  return context;
};

export function useStoreSelector<T>(selector: (state: AppState) => T): T {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useStoreSelector must be used within an AppProvider');
  }
  const { subscribe, getSnapshot } = context;
  const selectedState = useSyncExternalStore(subscribe, () => selector(getSnapshot()));
  return selectedState;
}

export const useSettingsSelector = () => useStoreSelector(state => state.settings);
export const useActiveProfileSelector = () => useStoreSelector(state => getActiveProfile(state.profiles, state.activeProfileId));