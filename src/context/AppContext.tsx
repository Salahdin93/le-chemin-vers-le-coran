import React, { createContext, useReducer, ReactNode, Dispatch, useEffect, useMemo, useContext, useCallback, useSyncExternalStore } from 'react';
import { AppState, AppAction, Profile, Memorizations, WizardData, WizardMode, EvaluationRecord, EvaluationStatus, EvaluationItem, Juzz, Hizb, SurahPart, MemorizationStatus, MemorizedJuzz, MemorizedHizb, MemorizedSurahPart, BadgeId, Theme, AccentColor, HadithMemorizationStatus, HadithHistoryEntry, EvaluationPlan } from '../types/types';
import { generateReadingPlan, generateRevisionPlan, recalculateFuturePlan, generateHadithRevisionPlan } from '../services/planLogic';
import { notificationService } from '../components/ui/NotificationContainer';
import AlKahfReminder from '../components/reminders/AlKahfReminder';
import { getInitialBadges, checkPageMilestone, checkRevisionMilestone, checkPerfectEvaluation, checkFirstMemorization, checkConsecutiveDays, checkKhatmaMilestones, checkHadithMilestones } from '../services/achievementLogic';
import { TRANSLATIONS } from '../translations';
import { appStateSchema } from '../schemas/appStateSchema';

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
      return { ...defaultState, ...initialState, notificationHistory: [], kahfNotificationShownThisSession: false };
    }
    case 'UPDATE_SETTINGS': { return { ...state, settings: { ...state.settings, ...action.payload } }; }
    case 'SET_APP_SCREEN': return { ...state, appScreen: action.payload };
    case 'SET_ACTIVE_PROFILE': return { ...state, activeProfileId: action.payload, appScreen: 'main' };
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
      const readingGoal = (wizardData as Record<string, unknown>).wantsReading ? { duration: wizardData.duration!, khatmas: wizardData.khatmas!, kahfOption: wizardData.kahfOption!, kahfPages: wizardData.kahfPages!, pagesPerDay: wizardData.pagesPerDay! } : undefined;
      const revisionGoal = (wizardData as Record<string, unknown>).wantsRevision ? { selection: wizardData.revisionSelection!, revisionMode: wizardData.revisionMode!, unitsPerDay: wizardData.unitsPerDay!, revisionDuration: wizardData.revisionDuration!, frequency: wizardData.revisionFrequency!, boosterSurahs: wizardData.boosterSurahs!, boosterSurahFreq: wizardData.boosterSurahFreq!, prioritizeWeaknesses: (wizardData as Record<string, unknown>).prioritizeWeaknesses as boolean | undefined } : undefined;
      const newProfile: Profile = {
        id: profileId,
        name: wizardData.name || 'Utilisateur',
        gender: wizardData.gender || 'male',
        password: wizardData.password,
        theme: wizardData.theme || 'light',
        accentColor: wizardData.accentColor || '#2E7D32',
        goals: { reading: readingGoal, revision: revisionGoal },
        memorizations: { surahParts: [], hizbs: [], juzz: [] },
        hadithProgress: {},
        hadithHistory: [],
        difficulties: [],
        evaluationPlans: [],
        evaluationHistory: [],
        badges: getInitialBadges(),
      };
      const updatedProfiles = [...state.profiles, newProfile];
      const tFn = (key: string) => (TRANSLATIONS[state.settings.lang] as Record<string, string>)[key] || key;
      const newProgress = { ...defaultState.progress, startDate };
      const readingPlan = newProfile.goals.reading ? generateReadingPlan(newProfile.goals.reading, startDate) : null;
      const revisionPlan = newProfile.goals.revision ? generateRevisionPlan(newProfile.goals.revision, startDate, 1, tFn, newProfile.memorizations) : null;
      return {
        ...state,
        profiles: updatedProfiles,
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
    case 'LOGOUT': return { ...state, activeProfileId: null, appScreen: 'profile-selection' };
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
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p), plans: { ...state.plans, reading: newRecalculatedPlan, originalReading: newOriginalPlan } };
    }
    case 'ADVANCE_DAY': {
      if (!activeProfile?.goals.reading) return state;
      const newReadingDay = state.progress.currentReadingDay + 1;
      const newState = { ...state, progress: { ...state.progress, currentReadingDay: newReadingDay, readingHistory: action.payload.newHistory, consecutiveDays: action.payload.newConsecutiveDays }, plans: { ...state.plans, reading: action.payload.recalculatedPlan } };
      const badge = checkConsecutiveDays(newState);
      return unlockBadge(newState, badge);
    }
    case 'UPDATE_READING_HISTORY': {
      const newState = { ...state, progress: { ...state.progress, readingHistory: action.payload.newHistory }, plans: { ...state.plans, reading: action.payload.recalculatedPlan } };
      const badge = checkPageMilestone(newState);
      return unlockBadge(newState, badge);
    }
    case 'UPDATE_REVISION_STATUS': {
      if (!activeProfile) return state;
      const { revisionIndex, status, difficulties, hizbNum, timeSpent } = action.payload;
      const newRevisionPlan = state.plans.revision ? [...state.plans.revision] : [];
      if (newRevisionPlan[revisionIndex]) {
        newRevisionPlan[revisionIndex].status = status;
        newRevisionPlan[revisionIndex].difficulties = difficulties || [];
        if (timeSpent !== undefined) {
          newRevisionPlan[revisionIndex].timeSpent = (newRevisionPlan[revisionIndex].timeSpent || 0) + timeSpent;
        }
      }
      const newToReviewHistory = [...state.progress.history.toReview];
      const existingHistoryIndex = newToReviewHistory.findIndex(item => item.day === newRevisionPlan[revisionIndex]?.day);
      if (existingHistoryIndex > -1) {
        newToReviewHistory[existingHistoryIndex].status = status; newToReviewHistory[existingHistoryIndex].difficulties = difficulties || [];
      } else if (status !== 'pending') { const day = newRevisionPlan[revisionIndex]; newToReviewHistory.push({ day: day.day, units: day.units, date: new Date().toISOString(), status: status, difficulties: difficulties || [] }); }
      let newDifficulties = [...(activeProfile.difficulties || [])];
      if (status === 'revised' && hizbNum) { newDifficulties = newDifficulties.filter(d => d.hizbNum !== hizbNum); }
      if (status === 'to-review' && hizbNum && difficulties) {
        newDifficulties = newDifficulties.filter(d => d.hizbNum !== hizbNum);
        difficulties.forEach(surahName => { newDifficulties.push({ surahName, hizbNum }); });
      }
      const updatedProfile = { ...activeProfile, difficulties: newDifficulties };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p), progress: { ...state.progress, currentRevisionIndex: revisionIndex === state.progress.currentRevisionIndex ? state.progress.currentRevisionIndex + 1 : state.progress.currentRevisionIndex, history: { ...state.progress.history, toReview: newToReviewHistory } }, plans: { ...state.plans, revision: newRevisionPlan } };
      const badge = checkRevisionMilestone(newState);
      return unlockBadge(newState, badge);
    }
    case 'COMPLETE_GOAL': {
      const { type, goal } = action.payload;
      const history = { ...state.progress.history };
      if (type === 'reading') { history.reading = [...history.reading, goal]; }
      if (type === 'revision') { history.revision = [...history.revision, goal]; }
      const newState = { ...state, progress: { ...state.progress, history } };
      const badge = type === 'reading' ? checkKhatmaMilestones(newState) : null;
      return unlockBadge(newState, badge);
    }
    case 'ADD_MEMORIZATION': {
      if (!activeProfile) return state;
      const { type, item } = action.payload;
      const newMemorizations: Memorizations = JSON.parse(JSON.stringify(activeProfile.memorizations));
      if (type === 'surahPart' && !newMemorizations.surahParts.find(s => s.id === item.id)) {
        newMemorizations.surahParts.push(item);
      } else if (type === 'hizb' && !newMemorizations.hizbs.find(h => h.number === item.number)) {
        newMemorizations.hizbs.push(item);
      } else if (type === 'juzz' && !newMemorizations.juzz.find(j => j.number === item.number)) { newMemorizations.juzz.push(item); }
      const updatedProfile = { ...activeProfile, memorizations: newMemorizations };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
      const badge = checkFirstMemorization(newState);
      return unlockBadge(newState, badge);
    }
    case 'REMOVE_MEMORIZATION': {
      if (!activeProfile) return state;
      const { type, item } = action.payload;
      const newMemorizations = JSON.parse(JSON.stringify(activeProfile.memorizations));
      if (type === 'surahPart') {
        newMemorizations.surahParts = newMemorizations.surahParts.filter((s: SurahPart) => s.id !== item.id);
      } else if (type === 'hizb') {
        newMemorizations.hizbs = newMemorizations.hizbs.filter((h: Hizb) => h.number !== item.number);
      } else if (type === 'juzz') { newMemorizations.juzz = newMemorizations.juzz.filter((j: Juzz) => j.number !== item.number); }
      const updatedProfile = { ...activeProfile, memorizations: newMemorizations };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'UPDATE_MEMORIZATIONS': {
      if (!activeProfile) return state;
      const updatedProfile = { ...activeProfile, memorizations: action.payload };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'SAVE_EVALUATION_RESULTS': {
      if (!activeProfile) return state;
      const results = action.payload as (EvaluationItem & { result: EvaluationStatus })[];
      const evalDate = new Date().toISOString();
      const newRecord: EvaluationRecord = { id: evalDate, date: evalDate, items: results };
      const newHistory = [newRecord, ...activeProfile.evaluationHistory];
      const newMemorizations = JSON.parse(JSON.stringify(activeProfile.memorizations));
      results.forEach((item: EvaluationItem & { result: EvaluationStatus }) => {
        if (item.type === 'hadith') return;
        const status = item.result as MemorizationStatus;
        const level = status === 'a_revoir' ? 'moyen' : status;
        if (item.type === 'juzz') newMemorizations.juzz = newMemorizations.juzz.map((j: MemorizedJuzz) => item.itemId == j.number.toString() ? { ...j, status, level } : j);
        else if (item.type === 'hizb') newMemorizations.hizbs = newMemorizations.hizbs.map((h: MemorizedHizb) => item.itemId == h.number ? { ...h, status, level } : h);
        else if (item.type === 'surahPart') newMemorizations.surahParts = newMemorizations.surahParts.map((s: MemorizedSurahPart) => item.itemId === s.id ? { ...s, status, level } : s);
      });
      const updatedProfile = { ...activeProfile, evaluationHistory: newHistory, memorizations: newMemorizations };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
      const badge = checkPerfectEvaluation(results as (EvaluationItem & { result: EvaluationStatus })[], newState);
      return unlockBadge(newState, badge);
    }
    case 'ADD_EVALUATION_PLAN': {
      if (!activeProfile) return state;
      const newEvaluationPlans = [...(activeProfile.evaluationPlans || []), action.payload];
      const updatedProfile = { ...activeProfile, evaluationPlans: newEvaluationPlans };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'UPDATE_EVALUATION_PLAN': {
      if (!activeProfile) return state;
      const updatedPlan = action.payload;
      const newEvaluationPlans = (activeProfile.evaluationPlans || []).map(plan => plan.id === updatedPlan.id ? { ...plan, ...updatedPlan } : plan);
      const updatedProfile = { ...activeProfile, evaluationPlans: newEvaluationPlans };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'REMOVE_EVALUATION_PLAN': {
      if (!activeProfile) return state;
      const { id } = action.payload;
      const newEvaluationPlans = (activeProfile.evaluationPlans || []).filter(plan => plan.id !== id);
      const updatedProfile = { ...activeProfile, evaluationPlans: newEvaluationPlans };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'SET_ACTIVE_EVALUATION_PLAN': return { ...state, activeEvaluationPlan: action.payload };
    case 'SET_EDITING_EVALUATION_PLAN_ID': return { ...state, editingEvaluationPlanId: action.payload };
    case 'UPDATE_MEMORIZATION_STATUS': {
      if (!activeProfile) return state;
      const { type, ids, status } = action.payload;
      const newMemorizations = JSON.parse(JSON.stringify(activeProfile.memorizations));
      const level = status === 'a_revoir' ? 'moyen' : status;
      if (type === 'juzz') {
        newMemorizations.juzz = newMemorizations.juzz.map((j: MemorizedJuzz) => ids.includes(j.number) ? { ...j, status, level } : j);
      } else if (type === 'hizb') {
        newMemorizations.hizbs = newMemorizations.hizbs.map((h: MemorizedHizb) => ids.includes(Number(h.number)) ? { ...h, status, level } : h);
      } else if (type === 'surahPart') { newMemorizations.surahParts = newMemorizations.surahParts.map((s: MemorizedSurahPart) => ids.some(id => s.id === id) ? { ...s, status, level } : s); }
      const updatedProfile = { ...activeProfile, memorizations: newMemorizations };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'UNLOCK_BADGE': {
      if (!activeProfile) return state;
      const badgeId = action.payload;
      const alreadyUnlocked = activeProfile.badges.find(b => b.id === badgeId)?.unlockedOn;
      if (alreadyUnlocked) return state;
      const newBadges = activeProfile.badges.map(badge => badge.id === badgeId ? { ...badge, unlockedOn: new Date().toISOString() } : badge);
      const updatedProfile = { ...activeProfile, badges: newBadges };
      return { ...state, profiles: state.profiles.map(p => p.id === state.activeProfileId ? updatedProfile : p) };
    }
    case 'SET_KAHF_NOTIFICATION_SHOWN': return { ...state, kahfNotificationShownThisSession: true };
    default:
      return state;
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

  useEffect(() => {
    try {
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
      console.error("Failed to load or parse state from localStorage", error);
      dispatch({ type: 'SET_APP_SCREEN', payload: 'language' });
    }
  }, []);

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
    if (state.appScreen !== 'splash') {
      try {
        const stateToSave = { ...state, notificationHistory: [] };
        localStorage.setItem('quranCompanionState_v7', JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state]);

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