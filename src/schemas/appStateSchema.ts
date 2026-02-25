import { z } from 'zod';

const settingsSchema = z.object({
  lang: z.enum(['fr', 'en', 'ar']),
  enableNotifications: z.boolean(),
  notificationTime: z.string().optional(),
});

const readingHistoryEntrySchema = z.object({
  status: z.enum(['done', 'partial', 'catchup', 'not_read']),
  adjustment: z.number(),
  realPages: z.number(),
  kahf: z.boolean().optional(),
  kahfStatus: z.enum(['done', 'partial', 'not_read']).optional(),
  timeSpent: z.number().optional(),
});

const progressSchema = z.object({
  startDate: z.string().nullable(),
  currentReadingDay: z.number().int().positive(),
  consecutiveDays: z.number().int().nonnegative(),
  totalPagesRead: z.number().int().nonnegative(),
  readingHistory: z.record(z.string(), readingHistoryEntrySchema),
  currentRevisionIndex: z.number().int().nonnegative(),
  currentHadithRevisionIndex: z.number().int().nonnegative().optional(),
  history: z.object({
    reading: z.array(z.any()),
    revision: z.array(z.any()),
    toReview: z.array(z.any()),
    hadithRevisionHistory: z.array(z.any()).optional(),
  }),
});

const readingGoalSchema = z.object({
  duration: z.number(),
  khatmas: z.number(),
  pagesPerDay: z.number(),
  kahfOption: z.boolean(),
  kahfPages: z.number(),
});

const revisionGoalSchema = z.object({
  selection: z.array(z.string()),
  revisionMode: z.enum(['sourate', 'juzz', 'hizb']),
  unitsPerDay: z.number(),
  revisionDuration: z.number(),
  frequency: z.object({
    type: z.enum(['daily', 'weekly', 'custom']),
    value: z.union([z.number(), z.array(z.number())]).optional(),
  }),
  boosterSurahs: z.array(z.string()),
  boosterSurahFreq: z.number(),
  prioritizeWeaknesses: z.boolean().optional(),
});

const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  gender: z.enum(['male', 'female']),
  password: z.string().optional(),
  theme: z.string().optional(),
  accentColor: z.string().optional(),
  goals: z.object({
    reading: readingGoalSchema.optional(),
    revision: revisionGoalSchema.optional(),
    hadithRevision: z.any().optional(),
  }),
  memorizations: z.any(),
  difficulties: z.array(z.any()).optional(),
  evaluationHistory: z.array(z.any()).optional(),
  badges: z.array(z.any()).optional(),
  progress: z.any().optional(), // Allow any for progress inside profile to avoid circularity or complexity
  plans: z.any().optional(),
  hadithProgress: z.any().optional(),
  hadithHistory: z.array(z.any()).optional(),
  evaluationPlans: z.array(z.any()).optional(),
});

export const appStateSchema = z.object({
  profiles: z.array(profileSchema).optional(),
  activeProfileId: z.string().nullable().optional(),
  settings: settingsSchema.optional(),
  progress: progressSchema.optional(),
  plans: z.any().optional(),
  appScreen: z.string().optional(),
  activeView: z.string().optional(),
});