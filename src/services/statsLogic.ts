import { ReadingHistory, RevisionPlanDay } from "@/types";

interface WeeklyDataPoint {
  week: string;
  pages?: number;
  units?: number;
}

export const processWeeklyReadingData = (
  readingHistory: ReadingHistory, 
  startDate: string
): WeeklyDataPoint[] => {
  if (!startDate || Object.keys(readingHistory).length === 0) {
    return [];
  }

  const historyByDate: { [date: string]: number } = {};
  const baseDate = new Date(startDate);

  Object.entries(readingHistory).forEach(([dayKey, entry]) => {
    const dayNum = parseInt(dayKey.replace('day_', ''));
    if (!isNaN(dayNum)) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + dayNum - 1);
      const dateString = date.toISOString().split('T')[0];
      historyByDate[dateString] = entry.realPages || 0;
    }
  });

  const weeklyTotals: { [weekStart: string]: number } = {};
  const sortedDates = Object.keys(historyByDate).sort();
  
  sortedDates.forEach(dateString => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    const weekStartDate = new Date(date);
    weekStartDate.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const weekStartString = weekStartDate.toLocaleDateString('fr-CA');

    if (!weeklyTotals[weekStartString]) {
      weeklyTotals[weekStartString] = 0;
    }
    weeklyTotals[weekStartString] += historyByDate[dateString];
  });
  
  const chartData = Object.entries(weeklyTotals).map(([weekStart, pages]) => {
    const date = new Date(weekStart);
    const weekLabel = `Sem. ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
    return { week: weekLabel, pages };
  });

  return chartData.slice(-12);
};


export const processWeeklyRevisionData = (
  revisionPlan: RevisionPlanDay[] | null
): WeeklyDataPoint[] => {
  if (!revisionPlan) return [];

  const weeklyTotals: { [weekStart: string]: number } = {};

  revisionPlan.forEach(day => {
    if (day.status === 'revised' || day.status === 'to-review') {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      const weekStartDate = new Date(date);
      weekStartDate.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const weekStartString = weekStartDate.toLocaleDateString('fr-CA');

      if (!weeklyTotals[weekStartString]) {
        weeklyTotals[weekStartString] = 0;
      }
      weeklyTotals[weekStartString] += day.units.length;
    }
  });

  const chartData = Object.entries(weeklyTotals).map(([weekStart, units]) => {
    const date = new Date(weekStart);
    const weekLabel = `Sem. ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;
    return { week: weekLabel, units };
  });

  return chartData.slice(-12);
};