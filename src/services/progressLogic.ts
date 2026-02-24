import { AppState } from "@/types";
import { TOTAL_PAGES } from "@/constants/quranData";

// Define thresholds for triggering the modal.
// For example, trigger if the user is behind by more than 1.5 days worth of reading.
const BEHIND_THRESHOLD_FACTOR = 1.5;
const AHEAD_THRESHOLD_FACTOR = 1.5;

type ProgressStatus = 'behind' | 'ahead' | 'ontrack';

export const checkReadingProgress = (state: AppState): ProgressStatus | null => {
    const { profiles, activeProfileId, progress, plans } = state;
    const profile = profiles.find(p => p.id === activeProfileId);

    if (!profile?.goals.reading || !plans?.originalReading || !progress.startDate) {
        return null;
    }

    const readingGoal = profile.goals.reading;
    const originalPlan = plans.originalReading;
    const currentDay = progress.currentReadingDay;

    // Don't check on the first day or if the plan is finished
    if (currentDay <= 1 || currentDay > readingGoal.duration) {
        return null;
    }

    // Calculate total pages that SHOULD have been read by the end of yesterday
    let totalPagesPlanned = 0;
    for (let i = 1; i < currentDay; i++) {
        const dayPlan = originalPlan.find(d => d.day === i);
        if (dayPlan) {
            totalPagesPlanned += dayPlan.pages;
        }
    }

    // Calculate total pages ACTUALLY read
    const totalPagesRead = Object.values(progress.readingHistory).reduce((sum, day) => sum + day.realPages, 0);

    const difference = totalPagesRead - totalPagesPlanned;

    // Calculate the average number of pages per day based on the original plan
    const totalPagesToRead = readingGoal.khatmas * TOTAL_PAGES;
    const averagePagesPerDay = totalPagesToRead / readingGoal.duration;

    // Check if the user is significantly behind
    if (difference < 0 && Math.abs(difference) > (averagePagesPerDay * BEHIND_THRESHOLD_FACTOR)) {
        return 'behind';
    }

    // Check if the user is significantly ahead
    if (difference > 0 && difference > (averagePagesPerDay * AHEAD_THRESHOLD_FACTOR)) {
        return 'ahead';
    }

    return 'ontrack';
};