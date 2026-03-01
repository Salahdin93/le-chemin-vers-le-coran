import React, { createContext, useReducer, ReactNode, Dispatch, useEffect, useMemo, useContext, useCallback, useRef, useSyncExternalStore } from 'react';
import { AppState, AppAction, Profile, WizardData, WizardMode, EvaluationRecord, BadgeId, Theme, AccentColor, HadithMemorizationStatus, HadithHistoryEntry, EvaluationPlan, ToReviewHistoryItem, ReadingHistory } from '../types/types';
import { generateReadingPlan, generateReadingPlanResume, getTargetPagesPerDayResume, generateRevisionPlan, recalculateFuturePlan, generateHadithRevisionPlan, generateHadithReadingPlan } from '../services/planLogic';
import { notificationService } from '../components/ui/NotificationContainer';
import AlKahfReminder from '../components/reminders/AlKahfReminder';
import { getInitialBadges, checkRevisionMilestone, checkPerfectEvaluation, checkFirstMemorization, checkKhatmaMilestones, checkHadithMilestones } from '../services/achievementLogic';
import { TRANSLATIONS } from '../translations';
import { dbService, loadFromLocalFallback, saveToLocalFallback } from '../lib/dbService';
import { supabase } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';

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
          // Migration des anciens IDs vers des UUIDs valides pour Supabase
          if (profile.id && !profile.id.includes('-') && !profile.id.startsWith('auth_')) {
            const oldId = profile.id;
            profile.id = generateUUID();
            if (initialState.activeProfileId === oldId) {
              initialState.activeProfileId = profile.id;
            }
          }

          if (!profile.difficulties) profile.difficulties = [];
          if (!(profile.memorizations as any).surahParts) { (profile.memorizations as any).surahParts = (profile.memorizations as any).surahs || []; }
          if ((profile.memorizations as any).juzzs && !(profile.memorizations as any).juzz) { (profile.memorizations as any).juzz = (profile.memorizations as any).juzzs; delete (profile.memorizations as any).juzzs; }
          if (!Array.isArray((profile.memorizations as any).juzz)) (profile.memorizations as any).juzz = [];
          if (!Array.isArray((profile.memorizations as any).hizbs)) (profile.memorizations as any).hizbs = [];
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
    case 'ADD_PROFILE': {
      const t = (key: string) => (TRANSLATIONS[state.settings.lang] as Record<string, string>)[key] || key;
      return { ...state, profiles: [...state.profiles, action.payload], toast: { message: t('profileCreated') || 'Profil créé avec succès', visible: true } };
    }
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
      const wizardMode = (action.payload as any).mode as WizardMode;
      const wizardFlow = state.wizard.type; // 'full' | 'reading' | 'revision'

      // Calculer pagesPerDay avant de générer le plan (reprise = jours restants, sinon durée totale)
      const totalPages = 604;
      const isResumeForCalc = wizardData.wantsResumeExistingProgram === true && wizardData.existingPagesRead != null && wizardData.existingDaysRead != null;
      const calculatedPagesPerDay = isResumeForCalc && wizardData.duration != null
        ? getTargetPagesPerDayResume(
            wizardData.duration,
            wizardData.existingDaysRead ?? 0,
            wizardData.khatmas ?? 1,
            wizardData.existingPagesRead ?? 0,
            !!wizardData.kahfOption,
            wizardData.kahfPages ?? 0
          ) || 1
        : wizardData.duration ? Math.ceil((totalPages * (wizardData.khatmas || 1)) / wizardData.duration) : wizardData.pagesPerDay || 1;
      // En "reprise" lecture, garder la date de début existante pour que le plan reste aligné
      const readingStartDate = (wizardFlow === 'reading' && wizardData.readingGoalMode === 'resume' && state.progress.startDate)
        ? state.progress.startDate
        : startDate;

      const isResumeNewProfile = wizardData.wantsResumeExistingProgram === true && wizardData.existingPagesRead != null && wizardData.existingDaysRead != null && wizardData.wantsReading;
      const readingPlan = wizardData.wantsReading
        ? isResumeNewProfile
          ? generateReadingPlanResume(
              {
                duration: wizardData.duration!,
                khatmas: wizardData.khatmas!,
                kahfOption: wizardData.kahfOption!,
                kahfPages: wizardData.kahfPages!,
                pagesPerDay: calculatedPagesPerDay
              },
              startDate,
              { existingPagesRead: wizardData.existingPagesRead!, existingDaysRead: wizardData.existingDaysRead ?? 0 }
            )
          : generateReadingPlan({
              duration: wizardData.duration!,
              khatmas: wizardData.khatmas!,
              kahfOption: wizardData.kahfOption!,
              kahfPages: wizardData.kahfPages!,
              pagesPerDay: calculatedPagesPerDay
            }, readingStartDate)
        : null;

      const revisionPlan = wizardData.wantsRevision ? generateRevisionPlan({
        selection: wizardData.revisionSelection!,
        revisionMode: wizardData.revisionMode!,
        unitsPerDay: wizardData.unitsPerDay!,
        revisionDuration: wizardData.revisionDuration!,
        frequency: wizardData.revisionFrequency!,
        boosterSurahs: wizardData.boosterSurahs!,
        boosterSurahFreq: wizardData.boosterSurahFreq!,
        prioritizeWeaknesses: (wizardData as Record<string, unknown>).prioritizeWeaknesses as boolean | undefined,
        revisionOrder: (wizardData as Record<string, unknown>).revisionOrder as 'ascending' | 'descending' | 'shuffle' | undefined
      }, startDate, 1, tFn, activeProfile?.memorizations || { surahParts: [], hizbs: [], juzz: [] }) : null;

      let hadithPlan = null;
      if (wizardData.wantsHadith) {
        if (wizardData.hadithType === 'lecture') {
          hadithPlan = generateHadithReadingPlan({
            selectedHadiths: wizardData.hadithSelection || [],
            hadithsPerDay: wizardData.hadithPerDay || 1,
            duration: wizardData.hadithDuration || 30,
            frequency: wizardData.hadithFrequency || { type: 'daily', value: 1 }
          }, startDate);
        } else {
          hadithPlan = generateHadithRevisionPlan({
            selectedHadiths: wizardData.hadithSelection || [],
            hadithsPerSession: wizardData.hadithPerDay || 1,
            frequency: wizardData.hadithFrequency || { type: 'daily', value: 1 }
          }, startDate);
        }
      }

      // Mode modification d'un objectif existant (reading ou revision)
      if ((wizardFlow === 'reading' || wizardFlow === 'revision') && activeProfile) {
        const newReadingGoal = wizardData.wantsReading ? {
          duration: wizardData.duration!,
          khatmas: wizardData.khatmas!,
          kahfOption: wizardData.kahfOption!,
          kahfPages: wizardData.kahfPages!,
          pagesPerDay: calculatedPagesPerDay
        } : activeProfile.goals.reading;

        const newRevisionGoal = wizardData.wantsRevision ? {
          selection: wizardData.revisionSelection!,
          revisionMode: wizardData.revisionMode!,
          unitsPerDay: wizardData.unitsPerDay!,
          revisionDuration: wizardData.revisionDuration!,
          frequency: wizardData.revisionFrequency!,
          boosterSurahs: wizardData.boosterSurahs!,
          boosterSurahFreq: wizardData.boosterSurahFreq!,
          prioritizeWeaknesses: (wizardData as Record<string, unknown>).prioritizeWeaknesses as boolean | undefined,
          revisionOrder: (wizardData as Record<string, unknown>).revisionOrder as 'ascending' | 'descending' | 'shuffle' | undefined
        } : activeProfile.goals.revision;

        const updatedProfile: Profile = {
          ...activeProfile,
          goals: {
            ...activeProfile.goals,
            reading: newReadingGoal,
            revision: newRevisionGoal,
          }
        };

        // Ne jamais réinitialiser la progression quand on ne change que l'objectif de révision
        // En "reprise" lecture, fusionner l'historique et le jour courant
        const newProgress = wizardFlow === 'revision'
          ? state.progress
          : wizardFlow === 'reading' && wizardData.readingGoalMode === 'resume' && (wizardData.resumeDay != null || wizardData.resumeReadingHistory)
            ? {
                ...state.progress,
                currentReadingDay: wizardData.resumeDay ?? state.progress.currentReadingDay,
                readingHistory: { ...state.progress.readingHistory, ...(wizardData.resumeReadingHistory || {}) }
              }
            : wizardMode === 'new'
              ? { ...defaultState.progress, startDate }
              : state.progress;

        const newPlans = {
          reading: wizardData.wantsReading ? readingPlan : (wizardFlow === 'revision' ? state.plans.reading : null),
          originalReading: wizardData.wantsReading ? readingPlan : (wizardFlow === 'revision' ? state.plans.originalReading : null),
          revision: wizardData.wantsRevision ? revisionPlan : (wizardFlow === 'reading' ? state.plans.revision : null),
          hadithRevision: state.plans.hadithRevision
        };

        return {
          ...state,
          profiles: state.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p),
          progress: newProgress,
          plans: newPlans,
          appScreen: 'main',
          activeView: wizardFlow === 'reading' ? 'reading-plan-view' : 'revision-plan-view',
          wizard: { ...state.wizard, isOpen: false },
          isLoading: false,
          toast: { message: tFn('saved') || 'Objectif mis à jour avec succès', visible: true }
        };
      }

      // Mode création d'un profil complet (reprise : jour 1 = premier jour du plan restant)
      const readingDay = isResumeNewProfile ? 1 : (wizardData.existingDaysRead ? wizardData.existingDaysRead + 1 : (wizardData.resumeDay || 1));
      const revisionIndex = wizardData.resumeRevisionIndex || 0;
      const hadithIndex = 0;

      // Préremplir readingHistory (en reprise nouveau profil, on ne met pas les jours passés dans l'historique pour éviter d'écraser le plan jour 1..N)
      let initialReadingHistory: ReadingHistory = {};
      if (!isResumeNewProfile) {
        if (wizardData.resumeReadingHistory && Object.keys(wizardData.resumeReadingHistory).length > 0) {
          initialReadingHistory = wizardData.resumeReadingHistory as ReadingHistory;
        } else if (wizardData.existingDaysRead && wizardData.existingDaysRead > 0 && (wizardData.existingPagesRead ?? 0) > 0) {
          const days = wizardData.existingDaysRead;
          const totalPages = wizardData.existingPagesRead ?? 0;
          const avgPerDay = Math.floor(totalPages / days);
          const remainder = totalPages - (avgPerDay * days);
          for (let d = 1; d <= days; d++) {
            const realPages = d === days ? avgPerDay + remainder : avgPerDay;
            initialReadingHistory[`day_${d}`] = { status: 'done', realPages, adjustment: 0 };
          }
        }
      }

      const newProgress = {
        ...defaultState.progress,
        startDate,
        currentReadingDay: readingDay,
        currentRevisionIndex: revisionIndex,
        currentHadithRevisionIndex: hadithIndex,
        readingHistory: initialReadingHistory,
        ...(isResumeNewProfile && wizardData.existingPagesRead != null && wizardData.existingDaysRead != null
          ? { existingPagesRead: wizardData.existingPagesRead, existingDaysRead: wizardData.existingDaysRead }
          : {})
      };
      const newProfile: Profile = {
        id: profileId,
        name: wizardData.name || 'Utilisateur',
        gender: wizardData.gender || 'male',
        password: wizardData.password,
        theme: wizardData.theme || 'light',
        accentColor: wizardData.accentColor || '#2E7D32',
        avatar: wizardData.avatar,
        goals: {
          reading: wizardData.wantsReading ? {
            duration: wizardData.duration!,
            khatmas: wizardData.khatmas!,
            kahfOption: wizardData.kahfOption!,
            kahfPages: wizardData.kahfPages!,
            pagesPerDay: calculatedPagesPerDay
          } : undefined,
          revision: wizardData.wantsRevision ? {
            selection: wizardData.revisionSelection!,
            revisionMode: wizardData.revisionMode!,
            unitsPerDay: wizardData.unitsPerDay!,
            revisionDuration: wizardData.revisionDuration!,
            frequency: wizardData.revisionFrequency!,
            boosterSurahs: wizardData.boosterSurahs!,
            boosterSurahFreq: wizardData.boosterSurahFreq!,
            prioritizeWeaknesses: (wizardData as Record<string, unknown>).prioritizeWeaknesses as boolean | undefined,
            revisionOrder: (wizardData as Record<string, unknown>).revisionOrder as 'ascending' | 'descending' | 'shuffle' | undefined
          } : undefined,
          hadithRevision: (wizardData.wantsHadith && wizardData.hadithType === 'revision') ? {
            selectedHadiths: wizardData.hadithSelection || [],
            hadithsPerSession: wizardData.hadithPerDay || 1,
            frequency: wizardData.hadithFrequency || { type: 'daily', value: 1 }
          } : undefined
        },
        memorizations: { surahParts: [], hizbs: [], juzz: [] },
        hadithProgress: {},
        hadithHistory: [],
        difficulties: [],
        evaluationPlans: [],
        evaluationHistory: [],
        badges: getInitialBadges(),
        progress: newProgress,
        plans: { reading: readingPlan, originalReading: readingPlan, revision: revisionPlan, hadithRevision: hadithPlan },
      };

      return {
        ...state,
        profiles: [...state.profiles, newProfile],
        activeProfileId: newProfile.id,
        progress: newProgress,
        plans: { reading: readingPlan, originalReading: readingPlan, revision: revisionPlan, hadithRevision: hadithPlan },
        appScreen: 'main',
        activeView: 'dashboard-view',
        wizard: { ...state.wizard, isOpen: false },
        isLoading: false,
        toast: { message: tFn('profileCreated') || 'Profil créé avec succès', visible: true }
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
    case 'ADD_TO_REVISION_PLAN': {
      if (!activeProfile?.goals.revision || !state.plans.revision) return state;
      const revGoal = activeProfile.goals.revision;
      const existingSelection = revGoal.selection || [];
      const addedIds = action.payload.addedIds.filter((id: string) => !existingSelection.includes(id));
      if (addedIds.length === 0) return state;
      const mergedSelection = [...existingSelection, ...addedIds];
      const tFn = (key: string) => TRANSLATIONS[state.settings.lang]?.[key] ?? key;
      const currentReadingDay = state.progress.currentReadingDay || 1;
      const newPlan = generateRevisionPlan(
        { ...revGoal, selection: mergedSelection },
        state.progress.startDate || new Date().toISOString(),
        currentReadingDay,
        tFn,
        activeProfile.memorizations || { surahParts: [], hizbs: [], juzz: [] }
      );
      const currentIdx = state.progress.currentRevisionIndex;
      const mergedPlan = [...state.plans.revision.slice(0, currentIdx), ...newPlan.slice(currentIdx)];
      const updatedProfile = { ...activeProfile, goals: { ...activeProfile.goals, revision: { ...revGoal, selection: mergedSelection } } };
      return {
        ...state,
        profiles: state.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p),
        plans: { ...state.plans, revision: mergedPlan }
      };
    }
    case 'ADD_HADITHS_TO_REVISION_PLAN': {
      if (!activeProfile?.goals.hadithRevision || !state.plans.hadithRevision) return state;
      const hadithGoal = activeProfile.goals.hadithRevision;
      const existingIds = hadithGoal.selectedHadiths || [];
      const addedIds = action.payload.hadithIds.filter((id: number) => !existingIds.includes(id));
      if (addedIds.length === 0) return state;
      const mergedHadiths = [...existingIds, ...addedIds];
      const newGoal = { ...hadithGoal, selectedHadiths: mergedHadiths };
      const newPlan = generateHadithRevisionPlan(newGoal, state.progress.startDate || new Date().toISOString());
      const currentIdx = state.progress.currentHadithRevisionIndex;
      const mergedPlan = [...state.plans.hadithRevision.slice(0, currentIdx), ...newPlan.slice(currentIdx)];
      const updatedProfile = { ...activeProfile, goals: { ...activeProfile.goals, hadithRevision: newGoal } };
      return {
        ...state,
        profiles: state.profiles.map(p => p.id === activeProfile.id ? updatedProfile : p),
        plans: { ...state.plans, hadithRevision: mergedPlan }
      };
    }
    case 'UPDATE_HADITH_REVISION_STATUS': {
      const { dayIndex, status, quality } = action.payload;
      const newHadithPlan = state.plans.hadithRevision ? [...state.plans.hadithRevision] : [];
      if (newHadithPlan[dayIndex]) {
        newHadithPlan[dayIndex].status = status;
        if (quality) newHadithPlan[dayIndex].quality = quality;
      }
      const newCurrentIndex = (dayIndex === state.progress.currentHadithRevisionIndex && status !== 'pending') ? state.progress.currentHadithRevisionIndex + 1 : state.progress.currentHadithRevisionIndex;

      let toReviewHistory = [...state.progress.history.toReview];
      if (quality === 'a_revoir') {
        const item = newHadithPlan[dayIndex];
        const historyItem: ToReviewHistoryItem = {
          type: 'hadith',
          day: dayIndex + 1,
          date: new Date().toISOString(),
          units: [{ text: `Hadiths: ${item.hadithIds?.join(', ')}`, surahs: '' }],
          difficulties: [],
          status: 'to-review',
          quality: quality
        };
        toReviewHistory = [historyItem, ...toReviewHistory];
      }

      return {
        ...state,
        plans: { ...state.plans, hadithRevision: newHadithPlan },
        progress: {
          ...state.progress,
          currentHadithRevisionIndex: newCurrentIndex,
          history: { ...state.progress.history, toReview: toReviewHistory }
        }
      };
    }
    case 'COMPLETE_HADITH_REVISION_GOAL': {
      const newHistory = [...state.progress.history.hadithRevisionHistory, action.payload.goal];
      return { ...state, progress: { ...state.progress, history: { ...state.progress.history, hadithRevisionHistory: newHistory, }, }, };
    }
    case 'UNLOCK_BADGE': {
      if (!activeProfile) return state;
      const badgeId = action.payload as BadgeId;
      const alreadyUnlocked = activeProfile.badges?.find(b => b.id === badgeId && b.unlockedOn !== null);
      if (alreadyUnlocked) return state;
      const updatedBadges = (activeProfile.badges || []).map(b =>
        b.id === badgeId ? { ...b, unlockedOn: new Date().toISOString() } : b
      );
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, badges: updatedBadges } : p) };
    }
    case 'UPDATE_HADITH_PROGRESS': {
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
    case 'LOGOUT': {
      const updatedProfiles = state.profiles.map(p =>
        p.id === state.activeProfileId ? { ...p, progress: state.progress, plans: state.plans } : p
      );
      return { ...state, profiles: updatedProfiles, activeProfileId: null, appScreen: 'profile-selection' };
    }
    case 'RESET_APP': {
      localStorage.removeItem('quranCompanionState_v7');
      return { ...defaultState, profiles: [], activeProfileId: null, appScreen: 'welcome' };
    }
    case 'RESET_PROGRESS': {
      if (!activeProfile) return state;
      const freshProgress = { ...defaultState.progress, startDate: null, history: state.progress.history };
      const clearedGoals = { ...activeProfile.goals, reading: undefined, revision: undefined, hadithRevision: undefined };
      const updatedProfile = { ...activeProfile, goals: clearedGoals };
      const updatedProfiles = state.profiles.map(p => (p.id === activeProfile.id ? updatedProfile : p));
      return {
        ...state,
        profiles: updatedProfiles,
        progress: freshProgress,
        plans: { reading: null, revision: null, hadithRevision: null, originalReading: null }
      };
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
    case 'UPDATE_READING_HISTORY': {
      const { newHistory, timeSpent } = action.payload;
      const mergedHistory = { ...state.progress.readingHistory, ...newHistory };
      if (timeSpent !== undefined) {
        const dayKey = `day_${state.progress.currentReadingDay}`;
        mergedHistory[dayKey] = { ...mergedHistory[dayKey], timeSpent: (mergedHistory[dayKey]?.timeSpent || 0) + timeSpent };
      }
      return { ...state, progress: { ...state.progress, readingHistory: mergedHistory }, plans: { ...state.plans, reading: action.payload.recalculatedPlan } };
    }
    case 'UPDATE_REVISION_STATUS': {
      if (!state.plans.revision) return state;
      const newRevisionPlan = [...state.plans.revision];
      const existing = newRevisionPlan[action.payload.revisionIndex];
      const cumulatedTime = action.payload.timeSpent !== undefined
        ? (existing.timeSpent || 0) + action.payload.timeSpent
        : existing.timeSpent;
      newRevisionPlan[action.payload.revisionIndex] = {
        ...existing,
        status: action.payload.status,
        difficulties: action.payload.difficulties ?? existing.difficulties,
        quality: action.payload.quality ?? existing.quality,
        timeSpent: cumulatedTime,
        surahRatings: action.payload.surahRatings ?? existing.surahRatings
      };
      let newDifficulties = [...(activeProfile?.difficulties || [])];
      if (action.payload.difficulties && action.payload.difficulties.length > 0) {
        action.payload.difficulties.forEach(diff => {
          if (!newDifficulties.find(d => d.surahName === diff && d.hizbNum === action.payload.hizbNum)) {
            newDifficulties.push({ surahName: diff, hizbNum: action.payload.hizbNum || null });
          }
        });
      }
      let toReviewHistory = [...state.progress.history.toReview];
      if (action.payload.status === 'to-review' || action.payload.quality === 'a_revoir') {
        const historyItem: ToReviewHistoryItem = {
          type: 'quran',
          day: action.payload.revisionIndex + 1,
          date: new Date().toISOString(),
          units: newRevisionPlan[action.payload.revisionIndex].units,
          difficulties: action.payload.difficulties || [],
          status: 'to-review',
          quality: action.payload.quality,
          surahRatings: action.payload.surahRatings
        };
        toReviewHistory = [historyItem, ...toReviewHistory];
      }

      const updatedProfile = activeProfile ? { ...activeProfile, difficulties: newDifficulties } : null;
      const newState = {
        ...state,
        plans: { ...state.plans, revision: newRevisionPlan },
        profiles: updatedProfile ? state.profiles.map(p => p.id === activeProfile?.id ? updatedProfile : p) : state.profiles,
        progress: {
          ...state.progress,
          currentRevisionIndex: action.payload.status === 'revised' ? state.progress.currentRevisionIndex + 1 : state.progress.currentRevisionIndex,
          history: { ...state.progress.history, toReview: toReviewHistory }
        }
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
      const listKey = type === 'surahPart' ? 'surahParts' : type === 'juzz' ? 'juzz' : 'hizbs';
      const currentList = (activeProfile.memorizations as any)[listKey];
      const list = Array.isArray(currentList) ? currentList : [];
      const newMemorizations = { ...activeProfile.memorizations, [listKey]: [...list, item] };
      const newState = { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
      const badge = checkFirstMemorization(newState);
      return unlockBadge(newState, badge);
    }
    case 'REMOVE_MEMORIZATION': {
      if (!activeProfile) return state;
      const { type, item } = action.payload;
      const listKey = type === 'surahPart' ? 'surahParts' : type === 'juzz' ? 'juzz' : 'hizbs';
      const currentList = (activeProfile.memorizations as any)[listKey];
      const list = Array.isArray(currentList) ? currentList : [];
      const newMemorizations = { ...activeProfile.memorizations, [listKey]: list.filter((i: any) => i.id !== item.id && i.number !== item.number) };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
    }
    case 'UPDATE_MEMORIZATIONS': {
      if (!activeProfile) return state;
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: action.payload } : p) };
    }
    case 'UPDATE_MEMORIZATION_STATUS': {
      if (!activeProfile) return state;
      const { type, ids, status } = action.payload;
      const listKey = type === 'surahPart' ? 'surahParts' : type === 'juzz' ? 'juzz' : 'hizbs';
      const currentList = (activeProfile.memorizations as any)[listKey];
      const list = Array.isArray(currentList) ? currentList : [];
      const newList = list.map((item: any) => ids.includes(item.id || item.number) ? { ...item, status } : item);
      const newMemorizations = { ...activeProfile.memorizations, [listKey]: newList };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
    }
    case 'UPDATE_MEMORIZATION_ITEM': {
      if (!activeProfile) return state;
      const { type, id, status, level } = action.payload;
      const listKey = type === 'surahPart' ? 'surahParts' : type === 'juzz' ? 'juzz' : 'hizbs';
      const currentList = (activeProfile.memorizations as any)[listKey];
      const list = Array.isArray(currentList) ? currentList : [];
      const newList = list.map((item: any) => (item.id === id || item.number === id) ? { ...item, ...(status != null && { status }), ...(level != null && { level }) } : item);
      const newMemorizations = { ...activeProfile.memorizations, [listKey]: newList };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
    }
    case 'UPDATE_HIZB_COMPONENT_ANNOTATION': {
      if (!activeProfile) return state;
      const { hizbNumber, surahPartId, status, level } = action.payload;
      const currentList = (activeProfile.memorizations as any).hizbs;
      const list = Array.isArray(currentList) ? currentList : [];
      const newList = list.map((h: any) => {
        if (String(h.number) !== String(hizbNumber)) return h;
        const componentSurahParts = Array.isArray(h.componentSurahParts) ? h.componentSurahParts.map((s: any) =>
          s.id === surahPartId ? { ...s, ...(status != null && { status }), ...(level != null && { level }) } : s
        ) : [];
        return { ...h, componentSurahParts };
      });
      const newMemorizations = { ...activeProfile.memorizations, hizbs: newList };
      return { ...state, profiles: state.profiles.map(p => p.id === activeProfile.id ? { ...p, memorizations: newMemorizations } : p) };
    }
    case 'SAVE_EVALUATION_RESULTS': {
      if (!activeProfile) return state;
      const record: EvaluationRecord = { id: `eval_${Date.now()}`, date: new Date().toISOString(), items: action.payload };
      let memo = { ...activeProfile.memorizations };
      for (const item of action.payload) {
        const { type, itemId, result } = item;
        if (!result || type === 'hadith') continue;
        if (type === 'surahPart') {
          const list = [...(memo.surahParts || [])];
          const idx = list.findIndex((p: any) => p.id === itemId);
          if (idx >= 0) {
            list[idx] = { ...list[idx], status: result, level: result as any };
            memo = { ...memo, surahParts: list };
          }
        } else if (type === 'hizb') {
          const list = [...(memo.hizbs || [])];
          const idx = list.findIndex((h: any) => String(h.number) === itemId);
          if (idx >= 0) {
            list[idx] = { ...list[idx], status: result, level: result as any };
            memo = { ...memo, hizbs: list };
          }
        } else if (type === 'juzz') {
          const list = [...(memo.juzz || [])];
          const idx = list.findIndex((j: any) => String(j.number) === itemId);
          if (idx >= 0) {
            list[idx] = { ...list[idx], status: result, level: result as any };
            memo = { ...memo, juzz: list };
          }
        }
      }
      const newState = {
        ...state,
        profiles: state.profiles.map(p =>
          p.id === activeProfile.id
            ? { ...p, evaluationHistory: [record, ...p.evaluationHistory], memorizations: memo }
            : p
        )
      };
      const badge = checkPerfectEvaluation(action.payload, newState);
      return unlockBadge(newState, badge);
    }
    case 'ADD_EXTRA_REVISION': {
      const dateKey = new Date().toISOString().slice(0, 10);
      const current = state.progress.extraRevisions?.[dateKey] || [];
      const next = [...current, action.payload];
      return {
        ...state,
        progress: {
          ...state.progress,
          extraRevisions: { ...state.progress.extraRevisions, [dateKey]: next }
        }
      };
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
    case 'ADD_NOTIFICATION_TO_HISTORY': {
      // Deduplicate: don't add if title+message identical to most recent
      const isDuplicate = state.notificationHistory.some(
        n => n.title === action.payload.title && n.message === action.payload.message
      );
      if (isDuplicate) return state;
      return { ...state, notificationHistory: [action.payload, ...state.notificationHistory] };
    }
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

  const prevProfilesCount = useRef(state.profiles.length);
  const t = useCallback((key: string, replacements: Record<string, string | number> = {}): string => {
    let translation = (TRANSLATIONS[state.settings.lang]?.[key]) || key;
    Object.keys(replacements).forEach(rKey => {
      translation = translation.replace(`{${rKey}}`, String(replacements[rKey]));
    });
    return translation;
  }, [state.settings.lang]);

  // Charger l'état depuis Supabase (utilisé au mount et après connexion). Fallback localStorage si hors ligne.
  const loadFromSupabase = useCallback(async () => {
    try {
      const remoteSettings = await dbService.getSettings();
      const remoteProfiles = await dbService.getProfiles();
      const noProfiles = remoteProfiles.length === 0;
      const newState = {
        ...defaultState,
        profiles: remoteProfiles,
        settings: remoteSettings?.settings ? { ...defaultState.settings, ...remoteSettings.settings } : defaultState.settings,
        activeProfileId: remoteSettings?.activeProfileId || (remoteProfiles[0]?.id || null),
        appScreen: remoteProfiles.length > 1 ? 'profile-selection' : remoteProfiles.length === 1 ? 'main' : noProfiles ? 'language' : 'welcome',
        wizard: noProfiles ? defaultState.wizard : defaultState.wizard
      };
      dispatch({ type: 'INITIALIZE_STATE', payload: newState });
    } catch (e) {
      console.warn('Failed to load from Supabase, trying local fallback', e);
      const local = loadFromLocalFallback();
      if (local?.profiles?.length) {
        const noProfiles = local.profiles.length === 0;
        dispatch({
          type: 'INITIALIZE_STATE',
          payload: {
            ...defaultState,
            profiles: local.profiles,
            settings: local.settings ? { ...defaultState.settings, ...local.settings } : defaultState.settings,
            activeProfileId: local.activeProfileId ?? local.profiles[0]?.id ?? null,
            progress: local.progress ?? defaultState.progress,
            plans: local.plans ?? defaultState.plans,
            appScreen: local.profiles.length > 1 ? 'profile-selection' : 'main',
            wizard: defaultState.wizard
          }
        });
      } else {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' });
      }
    }
  }, [dispatch]);

  // Chargement initial : compte obligatoire, tout depuis Supabase (avec timeout pour éviter blocage splash)
  const INITIAL_LOAD_TIMEOUT_MS = 10_000;

  useEffect(() => {
    let cancelled = false;

    const goToAuth = () => {
      dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' });
    };

    const loadState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        clearTimeout(timeoutId);
        if (user) {
          await loadFromSupabase();
          return;
        }
        goToAuth();
      } catch (error) {
        if (cancelled) return;
        clearTimeout(timeoutId);
        console.error('Failed to load state', error);
        goToAuth();
      }
    };

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      console.warn('Initial load timeout: switching to auth');
      goToAuth();
    }, INITIAL_LOAD_TIMEOUT_MS);

    loadState();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [loadFromSupabase]);

  // Réagir à la connexion / déconnexion : recharger depuis Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          await loadFromSupabase();
        }
      }
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'INITIALIZE_STATE', payload: { ...defaultState, profiles: [], activeProfileId: null } });
        dispatch({ type: 'SET_APP_SCREEN', payload: 'auth' });
      }
    });
    return () => subscription.unsubscribe();
  }, [loadFromSupabase, dispatch]);

  // Sauvegarde : Supabase si connecté, avec fallback localStorage en cas d'échec (hors ligne).
  useEffect(() => {
    if (state.appScreen === 'splash') return;

    const isNewProfile = state.profiles.length !== prevProfilesCount.current;
    prevProfilesCount.current = state.profiles.length;
    const delay = isNewProfile ? 0 : 300;
    const timeoutId = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (isNewProfile) console.log('☁️ Saving new profile to Supabase...');
        await dbService.syncFullState(state);
      } else if (state.profiles.length > 0) {
        saveToLocalFallback(state);
      }
    }, delay);
    return () => clearTimeout(timeoutId);
  }, [state.profiles, state.settings, state.progress, state.plans, state.activeProfileId, state.settings.lang]);

  useEffect(() => {
    if (state.appScreen === 'main' && activeProfile && !state.kahfNotificationShownThisSession) {
      const today = new Date();
      if (today.getDay() === 5 && activeProfile.goals.reading?.kahfOption) {
        notificationService.show({
          title: t('kahfReminderTitle') || "Sourate Al Kahf",
          message: t('kahfReminderMessage') || "C'est vendredi, lisez la sourate Al Kahf.",
          content: <AlKahfReminder />,
          duration: 10000,
          type: 'info'
        });
        dispatch({ type: 'SET_KAHF_NOTIFICATION_SHOWN' });
      }
    }
  }, [state.appScreen, state.kahfNotificationShownThisSession, activeProfile]);

  useEffect(() => {
    const scheduleNotification = () => {
      if (!state.settings.enableNotifications || !state.settings.notificationTime) return;

      const [hours, minutes] = state.settings.notificationTime.split(':').map(Number);
      const hasReading = !!(activeProfile?.goals?.reading && state.plans?.reading?.length);
      const hasRevision = !!(activeProfile?.goals?.revision && state.plans?.revision?.length);
      const hasHadith = !!(state.plans?.hadithRevision?.length);

      const checkAndNotify = () => {
        const now = new Date();
        if (now.getHours() === hours && now.getMinutes() === minutes) {
          const parts: string[] = [];
          if (hasReading) parts.push(t('reminderReadingPart'));
          if (hasRevision) parts.push(t('reminderRevisionPart'));
          if (hasHadith) parts.push(t('reminderHadithPart'));
          const message = parts.length > 0
            ? t('reminderIntro') + parts.join(', ') + '.'
            : t('dailyReminderMessage');
          notificationService.show({
            title: t('dailyReminderTitle'),
            message,
            type: 'info'
          });
        }
      };

      const intervalId = setInterval(checkAndNotify, 60000);
      return () => clearInterval(intervalId);
    };

    const clearNotification = scheduleNotification();
    return clearNotification;
  }, [state.settings.enableNotifications, state.settings.notificationTime, state.plans, activeProfile?.goals, t]);

  useEffect(() => {
    const theme: Theme = activeProfile?.theme || 'onboarding';
    const accentColor: AccentColor = activeProfile?.accentColor || '#38BDF8';
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

  // Persister la langue pour l'écran auth (utilisateur non connecté)
  useEffect(() => {
    if (state.settings?.lang) {
      localStorage.setItem('quranCompanionLang', state.settings.lang);
    }
  }, [state.settings?.lang]);

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