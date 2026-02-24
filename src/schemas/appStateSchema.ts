import { z } from 'zod';

const settingsSchema = z.object({
  lang: z.enum(['fr', 'en', 'ar']),
  theme: z.string(),
  accentColor: z.string().startsWith('#'),
  enableNotifications: z.boolean(),
});

const readingHistoryEntrySchema = z.object({
  status: z.enum(['done', 'partial', 'catchup', 'not_read']),
  adjustment: z.number(),
  realPages: z.number(),
  kahf: z.boolean().optional(),
  kahfStatus: z.enum(['done', 'partial', 'not_read']).optional(),
});

const progressSchema = z.object({
  startDate: z.string().nullable(),
  currentReadingDay: z.number().int().positive(),
  consecutiveDays: z.number().int().nonnegative(),
  totalPagesRead: z.number().int().nonnegative(),
  readingHistory: z.record(z.string(), readingHistoryEntrySchema),
  currentRevisionIndex: z.number().int().nonnegative(),
  history: z.object({
    reading: z.array(z.any()), // Simplifié pour la validation
    revision: z.array(z.any()),
    toReview: z.array(z.any()),
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
    value: z.number(),
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
  accentColor: z.string().startsWith('#').optional(),
  goals: z.object({
    reading: readingGoalSchema.optional(),
    revision: revisionGoalSchema.optional(),
  }),
  memorizations: z.any(), // Simplifié pour la validation
  difficulties: z.array(z.any()),
  evaluationHistory: z.array(z.any()),
  badges: z.array(z.any()),
});

export const appStateSchema = z.object({
  profiles: z.array(profileSchema).optional(),
  activeProfileId: z.string().nullable().optional(),
  settings: settingsSchema.optional(),
  progress: progressSchema.optional(),
  // Nous ne validons pas les autres états qui ne sont pas persistants
});