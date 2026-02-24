import React from 'react';
import { useStore } from '../../context/AppContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { processWeeklyReadingData, processWeeklyRevisionData } from '../../services/statsLogic';
import EmptyState from '../ui/EmptyState';
import { TOTAL_PAGES } from '../../constants/quranData';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { HadithMemorizationStatus } from '../../types';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const StatsView: React.FC = () => {
  const { state, t, activeProfile } = useStore();
  const { progress, plans } = state;

  const weeklyReadingData = processWeeklyReadingData(progress.readingHistory, progress.startDate!);
  const weeklyRevisionData = processWeeklyRevisionData(plans.revision);

  const readingGoal = activeProfile?.goals.reading;
  const revisionPlan = plans.revision;
  const hadithProgress = activeProfile?.hadithProgress || {};

  // Quran Stats
  const totalPagesRead = Object.values(progress.readingHistory).reduce((acc, h) => acc + (h.realPages || 0), 0);
  const totalPagesGoal = readingGoal ? readingGoal.khatmas * TOTAL_PAGES : 0;
  const readingProgressPercent = totalPagesGoal > 0 ? Math.floor((totalPagesRead / totalPagesGoal) * 100) : 0;
  const revisionDaysDone = progress.currentRevisionIndex;
  const totalRevisionDays = revisionPlan?.length || 0;
  const revisionProgressPercent = totalRevisionDays > 0 ? Math.floor((revisionDaysDone / totalRevisionDays) * 100) : 0;

  // Hadith Stats
  const hadithStatusCounts = Object.values(hadithProgress).reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
  }, {} as Record<HadithMemorizationStatus, number>);
  
  const totalHadiths = HADITH_COLLECTION.length;
  const notStartedCount = totalHadiths - Object.values(hadithProgress).length;
  if(notStartedCount > 0) {
      hadithStatusCounts.non_lu = (hadithStatusCounts.non_lu || 0) + notStartedCount;
  }
  
  const hadithStatusData = [
      { name: t('statusAcquis', 'Acquis'), value: hadithStatusCounts.acquis || 0, color: '#22c55e' },
      { name: t('statusEnMemorisation', 'En mémorisation'), value: hadithStatusCounts.en_memorisation || 0, color: '#3b82f6' },
      { name: t('statusARependre', 'À reprendre'), value: hadithStatusCounts.a_reprendre || 0, color: '#f59e0b' },
      { name: t('statusLu', 'Lu'), value: hadithStatusCounts.lu || 0, color: '#6b7280' },
      { name: t('statusNonLu', 'Non lu'), value: hadithStatusCounts.non_lu || 0, color: '#e5e7eb' },
  ].filter(item => item.value > 0);
  
  const masteredHadiths = hadithStatusCounts.acquis || 0;

  const noData = weeklyReadingData.length === 0 && weeklyRevisionData.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
              <CardHeader><CardTitle>{t('readingProgress')}</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-5xl font-bold">{readingProgressPercent}%</p>
                  <p className="text-sm text-text-secondary mt-2">{totalPagesRead} / {totalPagesGoal} pages lues</p>
              </CardContent>
          </Card>
          <Card className="text-center">
              <CardHeader><CardTitle>{t('revisionProgress')}</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-5xl font-bold">{revisionProgressPercent}%</p>
                  <p className="text-sm text-text-secondary mt-2">{revisionDaysDone} / {totalRevisionDays} jours complétés</p>
              </CardContent>
          </Card>
          <Card className="text-center">
              <CardHeader><CardTitle>{t('hadithProgress')}</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-5xl font-bold">{masteredHadiths} / {totalHadiths}</p>
                  <p className="text-sm text-text-secondary mt-2">{t('hadithsMastered', 'hadiths acquis')}</p>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>📊 {t('hadithStats', 'Statistiques des Hadiths')}</CardTitle></CardHeader>
        <CardContent>
            <div className="w-full h-72">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={hadithStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={110}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {hadithStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-main)', borderRadius: '0.5rem' }} />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
      
      {noData ? (
        <Card>
           <CardHeader>
              <CardTitle>📈 {t('activityHistory', "Historique d'Activité")}</CardTitle>
            </CardHeader>
          <CardContent>
            <EmptyState 
              icon="📊"
              title={t('noDataYet', "Pas encore de données")}
              message={t('statsAppearHere', "Vos statistiques de lecture et de révision apparaîtront ici dès que vous commencerez à enregistrer votre progression.")}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {weeklyReadingData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📖 {t('readingActivity', 'Activité de Lecture (Pages par semaine)')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={weeklyReadingData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-main)', borderRadius: '0.5rem' }} />
                      <Legend formatter={() => t('pagesRead')} />
                      <Bar dataKey="pages" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {weeklyRevisionData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🧠 {t('revisionActivity', 'Activité de Révision (Unités par semaine)')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={weeklyRevisionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-main)', borderRadius: '0.5rem' }} />
                      <Legend formatter={() => t('unitsRevised', 'Unités révisées')} />
                      <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StatsView;