export type HadithMemorizationStatus = 'non_lu' | 'lu' | 'en_memorisation' | 'a_reprendre' | 'acquis';

export interface Hadith {
  id: number;
  arabic: string;
  translations: {
    fr: string;
    en: string;
  };
  source: {
    fr: string;
    en: string;
    ar: string;
  };
}

export interface HadithProgress {
  [hadithId: number]: HadithMemorizationStatus;
}

export interface RevisionFrequency {
  type: 'daily' | 'weekly' | 'custom';
  value: number | number[];
}

export interface HadithRevisionGoal {
  selectedHadiths: number[];
  hadithsPerSession: number;
  frequency: RevisionFrequency;
}

export interface HadithRevisionPlanDay {
  day: number;
  date: Date;
  hadithIds: number[];
  status: 'pending' | 'done' | RevisionStatus;
}

export interface HadithHistoryEntry {
  date: string;
  hadithId: number;
  action: HadithMemorizationStatus;
}

export type Language = 'fr' | 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'sepia' | 'chalkboard' | 'wood' | 'nightblue' | 'sand' | 'emerald' | 'sunrise' | 'leafy' | 'pearl' | 'midnight' | 'aube' | 'crepuscule' | 'oasis';
export type AccentColor = string;
export type Gender = 'male' | 'female';
export type RevisionMode = 'sourate' | 'juzz' | 'hizb';
export type ReadingStatus = 'done' | 'partial' | 'catchup' | 'not_read';
export type RevisionStatus = 'revised' | 'to-review' | 'not_revised' | 'pending';
export type MemorizationLevel = 'excellent' | 'bon' | 'moyen';
export type MemorizationStatus = 'excellent' | 'bon' | 'moyen' | 'a_revoir';
export type AppScreen = 'language' | 'splash' | 'welcome' | 'initial-choice' | 'login' | 'auth' | 'wizard' | 'main' | 'exit' | 'profile-selection';
export type WizardType = 'full' | 'reading' | 'revision';
export type WizardMode = 'new' | 'resume';
export type ActiveView = 'dashboard-view' | 'reading-plan-view' | 'revision-plan-view' | 'memorization-view' | 'history-view' | 'settings-view' | 'hadith-plan-view' | 'hadith-memorization-view' | 'hadith-evaluation-view' | 'hadith-stats-view' | 'hadith-revision-plan-view' | 'hadith-revision-settings-view' | 'evaluation-view' | 'memorization-settings-view' | 'achievements-view' | 'stats-view' | 'hadith-history-view' | 'evaluation-plans-view' | 'evaluation-plan-form-view';
export type EvaluationStatus = 'excellent' | 'bon' | 'moyen' | 'a_revoir';
export type BadgeId =
  | 'khatma_1'
  | 'khatma_5'
  | 'consecutive_7_days'
  | 'consecutive_30_days'
  | 'first_revision'
  | 'first_memorization'
  | 'juzz_amma_memorized'
  | 'perfect_evaluation'
  | 'one_thousand_pages'
  | 'thirty_revisions'
  | 'hadith_first_step'
  | 'hadith_apprentice'
  | 'hadith_guardian'
  | 'hadith_muhaddith';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  unlockedOn: string | null;
}

export interface SurahPart {
  id: string;
  name: string;
  originalSurahId: number;
}

export interface Hizb {
  number: string;
  details: string;
}

export interface Juzz {
  number: number;
}

export type EvaluationContentType = 'surahPart' | 'hizb' | 'juzz' | 'hadith';

export interface EvaluationItem {
  type: EvaluationContentType;
  itemId: string;
  itemName: string;
}

// Added missing EvaluationQuestion interface
export interface EvaluationQuestion {
  id: string;
  type: 'hizb-sequence' | 'surah-in-hizb' | 'surah-sequence' | 'juzz-sequence';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  itemId: string;
  itemType: EvaluationContentType;
}

export interface EvaluationRecord {
  id: string;
  date: string;
  items: (EvaluationItem & { result: EvaluationStatus })[];
}

export interface EvaluationPlan {
  id: string;
  name: string;
  mainContentType: EvaluationContentType;
  order: 'random' | 'ascending' | 'descending';
  itemsPerSession: {
    main: number;
    boosters: Partial<Record<EvaluationContentType, number>>;
  };
  isScheduled: boolean;
  frequency: RevisionFrequency;
  duration: number; // Duration in days
  pool: (string | number)[];
  boosterPools?: Partial<Record<EvaluationContentType, (string | number)[]>>;
}

export interface SurahWithLevel {
  id: number;
  name: string;
  level: MemorizationLevel;
}

export interface MemorizedSurahPart extends SurahPart {
  level: MemorizationLevel;
  status: MemorizationStatus;
}

export interface MemorizedHizb extends Hizb {
  level: MemorizationLevel;
  status: MemorizationStatus;
  componentSurahParts: MemorizedSurahPart[];
}

export interface MemorizedJuzz extends Juzz {
  level: MemorizationLevel;
  status: MemorizationStatus;
  componentHizbs: { number: string, details: string, level: MemorizationLevel, status: MemorizationStatus }[];
}

export interface Memorizations {
  surahParts: MemorizedSurahPart[];
  hizbs: MemorizedHizb[];
  juzz: MemorizedJuzz[];
}

export interface PersistentDifficulty {
  surahName: string;
  hizbNum: number | null;
}

export interface Settings {
  lang: Language;
  enableNotifications: boolean;
  notificationTime?: string;
}

export interface ReadingGoal {
  duration: number;
  khatmas: number;
  pagesPerDay: number;
  kahfOption: boolean;
  kahfPages: number;
}

export interface RevisionGoal {
  selection: string[];
  revisionMode: RevisionMode;
  unitsPerDay: number;
  revisionDuration: number;
  frequency: RevisionFrequency;
  boosterSurahs: string[];
  boosterSurahFreq: number;
  prioritizeWeaknesses?: boolean;
}

export interface MemorizedSurah {
  id: number;
  name: string;
  verses: number;
  level: MemorizationLevel;
}

export interface Profile {
  id: string;
  name: string;
  gender: Gender;
  password?: string;
  theme: Theme;
  accentColor: AccentColor;
  goals: {
    reading?: ReadingGoal;
    revision?: RevisionGoal;
    hadithRevision?: HadithRevisionGoal;
  };
  memorizations: Memorizations;
  evaluationHistory: EvaluationRecord[];
  badges: Badge[];
  progress?: Progress;
  plans?: AppState['plans'];
  hadithProgress?: HadithProgress;
  hadithHistory?: HadithHistoryEntry[];
  evaluationPlans?: EvaluationPlan[];
  difficulties?: PersistentDifficulty[];
  isLinked?: boolean;
}

export interface ReadingHistoryEntry {
  status: ReadingStatus;
  adjustment: number;
  realPages: number;
  kahf?: boolean;
  kahfStatus?: ReadingStatus;
  timeSpent?: number;
}

export interface ReadingHistory {
  [dayKey: string]: ReadingHistoryEntry;
}

export interface CompletedReadingGoal {
  khatmas: number;
  duration: number;
  completedAt: string;
  dailyHistory: ReadingHistory;
}

export interface CompletedRevisionGoal {
  count: number;
  duration: number;
  completedAt: string;
  dailyPlan: RevisionPlanDay[];
}

export interface CompletedHadithRevisionGoal {
  count: number;
  duration: number;
  completedAt: string;
  dailyPlan: HadithRevisionPlanDay[];
}
export type HadithRevisionHistoryEntry = HadithRevisionPlanDay;

export interface ToReviewHistoryItem {
  day: number;
  units: RevisionUnit[];
  date: string;
  status: RevisionStatus;
  difficulties: string[];
}

export interface Progress {
  startDate: string | null;
  currentReadingDay: number;
  consecutiveDays: number;
  totalPagesRead: number;
  readingHistory: ReadingHistory;
  currentRevisionIndex: number;
  currentHadithRevisionIndex: number;
  history: {
    reading: CompletedReadingGoal[];
    revision: CompletedRevisionGoal[];
    toReview: ToReviewHistoryItem[];
    hadithRevisionHistory: CompletedHadithRevisionGoal[];
  };
}

export interface PlanDay {
  day: number;
  startPage: number;
  endPage: number;
  pages: number;
  recalculatedPages: number;
  isKahfDay: boolean;
}

export interface RevisionUnit {
  text: string;
  surahs: string;
}

export interface RevisionPlanDay {
  day: number;
  date: Date;
  units: RevisionUnit[];
  status: RevisionStatus;
  difficulties: string[];
  timeSpent?: number;
}

export interface WizardData {
  name?: string;
  gender?: Gender;
  password?: string;
  passwordConfirm?: string;
  termsAccepted?: boolean;
  duration?: number;
  khatmas?: number;
  pagesPerDay?: number;
  kahfOption?: boolean;
  kahfPages?: number;
  revisionSelection?: string[];
  revisionMode?: RevisionMode;
  unitsPerDay?: number;
  revisionDuration?: number;
  revisionFrequency?: RevisionFrequency;
  boosterSurahs?: string[];
  boosterSurahFreq?: number;
  resumeDay?: number;
  resumeRevisionIndex?: number;
  accentColor?: AccentColor;
  theme?: Theme;
  enableNotifications?: boolean;
  resumeReadingHistory?: ReadingHistory;
  resumeRevisionPlan?: RevisionPlanDay[];
  prioritizeWeaknesses?: boolean;
  wantsRevision?: boolean;
  wantsReading?: boolean;
  // Hadith plan
  wantsHadith?: boolean;
  hadithType?: 'lecture' | 'revision'; // renamed from memorisation per user request
  hadithPerDay?: number;
  hadithDuration?: number;
  hadithFrequency?: RevisionFrequency;
  prioritizeHadithWeaknesses?: boolean;
  hadithSelection?: number[]; // list of hadith numbers (1-40 or 1-100)
  // Resume an existing reading when creating new profile
  resumeExistingReading?: boolean;
  existingDaysRead?: number;
  existingPagesRead?: number;
}

export interface NotificationProps {
  id: string;
  title?: string;
  message?: string;
  content?: React.ReactNode;
  type: 'info' | 'success' | 'warning' | 'error' | 'danger';
}

export interface AppState {
  isLoading: boolean;
  appScreen: AppScreen;
  activeView: ActiveView;
  profiles: Profile[];
  activeProfileId: string | null;
  settings: Settings;
  progress: Progress;
  plans: {
    reading: PlanDay[] | null;
    revision: RevisionPlanDay[] | null;
    hadithRevision: HadithRevisionPlanDay[] | any[] | null;
    originalReading: PlanDay[] | null;
  };
  wizard: {
    isOpen: boolean;
    type: WizardType;
    mode: WizardMode;
  };
  toast: {
    message: string;
    visible: boolean;
  };
  isShareModalOpen: boolean;
  readjustmentModal: {
    isOpen: boolean;
    type: 'behind' | 'ahead' | null;
  };
  notificationHistory: NotificationProps[];
  kahfNotificationShownThisSession?: boolean;
  activeEvaluationPlan: EvaluationPlan | null;
  editingEvaluationPlanId: string | null;
}

export type AppAction =
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'INITIALIZE_STATE'; payload: any }
  | { type: 'SET_APP_SCREEN'; payload: AppScreen }
  | { type: 'SET_ACTIVE_VIEW'; payload: ActiveView }
  | { type: 'SET_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'START_WIZARD'; payload: { type: WizardType; mode: WizardMode } }
  | { type: 'FINISH_WIZARD'; payload: { wizardData: Partial<WizardData>, mode: WizardMode, profileId?: string, startDate?: string } }
  | { type: 'LOGOUT' }
  | { type: 'RESET_APP' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'UPDATE_PLANS'; payload: { reading: PlanDay[] | null; revision: RevisionPlanDay[] | null } }
  | { type: 'ADVANCE_DAY'; payload: { newHistory: ReadingHistory; newConsecutiveDays: number; recalculatedPlan: PlanDay[] } }
  | { type: 'UPDATE_READING_HISTORY'; payload: { newHistory: ReadingHistory; recalculatedPlan: PlanDay[] } }
  | { type: 'UPDATE_REVISION_STATUS'; payload: { revisionIndex: number; status: RevisionStatus; difficulties?: string[]; hizbNum?: number; timeSpent?: number; } }
  | { type: 'COMPLETE_GOAL'; payload: { type: 'reading'; goal: CompletedReadingGoal } | { type: 'revision'; goal: CompletedRevisionGoal } }
  | { type: 'UPDATE_PROFILE'; payload: Partial<Profile> & { id?: string } }
  | { type: 'ADD_MEMORIZATION'; payload: { type: 'surahPart' | 'hizb' | 'juzz', item: any } }
  | { type: 'REMOVE_MEMORIZATION'; payload: { type: 'surahPart' | 'hizb' | 'juzz', item: any } }
  | { type: 'UPDATE_MEMORIZATIONS'; payload: Memorizations }
  | { type: 'TOGGLE_SHARE_MODAL'; payload: boolean }
  | { type: 'TOGGLE_READJUSTMENT_MODAL'; payload: { isOpen: boolean; type: 'behind' | 'ahead' | null } }
  | { type: 'ADJUST_PACE' }
  | { type: 'EXTEND_DURATION'; payload: number }
  | { type: 'SAVE_EVALUATION_RESULTS'; payload: (EvaluationItem & { result: EvaluationStatus })[] }
  | { type: 'ADD_EVALUATION_PLAN'; payload: EvaluationPlan }
  | { type: 'UPDATE_EVALUATION_PLAN'; payload: Partial<EvaluationPlan> & { id: string } }
  | { type: 'REMOVE_EVALUATION_PLAN'; payload: { id: string } }
  | { type: 'SET_ACTIVE_EVALUATION_PLAN'; payload: EvaluationPlan | null }
  | { type: 'SET_EDITING_EVALUATION_PLAN_ID'; payload: string | null }
  | { type: 'ADD_NOTIFICATION_TO_HISTORY'; payload: NotificationProps }
  | { type: 'REMOVE_NOTIFICATION_FROM_HISTORY'; payload: string }
  | { type: 'CLEAR_NOTIFICATION_HISTORY' }
  | { type: 'SET_KAHF_NOTIFICATION_SHOWN' }
  | { type: 'UPDATE_MEMORIZATION_STATUS'; payload: { type: 'juzz' | 'hizb' | 'surahPart'; ids: (string | number)[]; status: MemorizationStatus } }
  | { type: 'ADD_PROFILE'; payload: Profile }
  | { type: 'REMOVE_PROFILE'; payload: string }
  | { type: 'SET_ACTIVE_PROFILE'; payload: string | null }
  | { type: 'UNLOCK_BADGE'; payload: BadgeId }
  | { type: 'UPDATE_HADITH_STATUS'; payload: { hadithId: number; status: HadithMemorizationStatus } }
  | { type: 'SET_HADITH_REVISION_PLAN'; payload: { goal: HadithRevisionGoal; } }
  | { type: 'UPDATE_HADITH_REVISION_STATUS'; payload: { dayIndex: number; status: RevisionStatus } }
  | { type: 'UPDATE_HADITH_PROGRESS'; payload: { hadithId: number; status: HadithMemorizationStatus; date: string } }
  | { type: 'SET_APP_LANGUAGE'; payload: Language }
  | { type: 'COMPLETE_HADITH_REVISION_GOAL'; payload: { goal: CompletedHadithRevisionGoal } };