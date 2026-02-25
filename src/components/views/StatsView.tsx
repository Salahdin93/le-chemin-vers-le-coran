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

  const totalPagesRead = Object.values(progress.readingHistory).reduce((acc, h) => acc + (h.realPages || 0), 0);
  const totalPagesGoal = readingGoal ? readingGoal.khatmas * TOTAL_PAGES : 0;
  const readingProgressPercent = totalPagesGoal > 0 ? Math.floor((totalPagesRead / totalPagesGoal) * 100) : 0;
  const revisionDaysDone = progress.currentRevisionIndex;
  const totalRevisionDays = revisionPlan?.length || 0;
  const revisionProgressPercent = totalRevisionDays > 0 ? Math.floor((revisionDaysDone / totalRevisionDays) * 100) : 0;

  const hadithStatusCounts = Object.values(hadithProgress).reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<HadithMemorizationStatus, number>);

  const totalHadiths = HADITH_COLLECTION.length;
  const notStartedCount = totalHadiths - Object.values(hadithProgress).length;
  if (notStartedCount > 0) {
    hadithStatusCounts.non_lu = (hadithStatusCounts.non_lu || 0) + notStartedCount;
  }

  const hadithStatusData = [
    { name: t('statusAcquis'), value: hadithStatusCounts.acquis || 0, color: '#10b981' },
    { name: t('statusEnMemorisation'), value: hadithStatusCounts.en_memorisation || 0, color: '#3b82f6' },
    { name: t('statusARependre'), value: hadithStatusCounts.a_reprendre || 0, color: '#f59e0b' },
    { name: t('statusLu'), value: hadithStatusCounts.lu || 0, color: '#64748b' },
    { name: t('statusNonLu'), value: hadithStatusCounts.non_lu || 0, color: '#cbd5e1' },
  ].filter(item => item.value > 0);

  const masteredHadiths = hadithStatusCounts.acquis || 0;
  const noData = weeklyReadingData.length === 0 && weeklyRevisionData.length === 0;

  return (
    <div className="space-y-12 pb-32 px-2 md:px-0">
      <header className="pb-8 border-b border-border-main">
        <h1 className="text-3xl md:text-4xl font-black text-gradient mb-2">{t('statistics')}</h1>
        <p className="text-text-secondary font-medium text-sm md:text-base">{t('statsSubtitle') || 'Analysez vos efforts et visualisez votre ascension spirituelle.'}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="!bg-accent-color/5 border-accent-color/10 shadow-none ring-1 ring-accent-color/5 overflow-visible h-full flex flex-col items-center justify-center p-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color mb-4">{t('readingProgress')}</span>
            <p className="text-5xl md:text-6xl font-black mb-2">{readingProgressPercent}%</p>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{totalPagesRead} / {totalPagesGoal} pages</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="!bg-blue-500/5 border-blue-500/10 shadow-none ring-1 ring-blue-500/5 overflow-visible h-full flex flex-col items-center justify-center p-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4">{t('revisionProgress')}</span>
            <p className="text-5xl md:text-6xl font-black mb-2">{revisionProgressPercent}%</p>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{revisionDaysDone} / {totalRevisionDays} {t('days')}</p>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="!bg-yellow-500/5 border-yellow-500/10 shadow-none ring-1 ring-yellow-500/5 overflow-visible h-full flex flex-col items-center justify-center p-8 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500 mb-4">{t('hadithProgress')}</span>
            <p className="text-5xl md:text-6xl font-black mb-2">{masteredHadiths}<span className="text-2xl opacity-20 mx-2">/</span>{totalHadiths}</p>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{t('hadithsMastered')}</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="p-0 overflow-hidden border-none shadow-premium bg-slate-900 text-white">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                {t('hadithStats')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="w-full h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={hadithStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={100}
                      innerRadius={40}
                      dataKey="value"
                    >
                      {hadithStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: 'white' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {noData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="h-full flex items-center justify-center border-dashed border-2 border-border-main/50 bg-bg-main/30">
              <EmptyState icon={<BarChart size={48} className="opacity-10" />} title={t('noDataYet')} message={t('statsAppearHere')} />
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {weeklyReadingData.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <Card className="premium-card p-0 overflow-hidden border-none shadow-premium">
                  <CardHeader className="p-6 border-b border-border-main">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-accent-color" />
                      {t('readingActivity')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-48 md:h-64">
                      <ResponsiveContainer>
                        <BarChart data={weeklyReadingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey="week" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }} contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-main)', borderRadius: '0.75rem', fontSize: '12px' }} />
                          <Bar dataKey="pages" fill="var(--accent-color)" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {weeklyRevisionData.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <Card className="premium-card p-0 overflow-hidden border-none shadow-premium">
                  <CardHeader className="p-6 border-b border-border-main">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {t('revisionActivity')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-48 md:h-64">
                      <ResponsiveContainer>
                        <BarChart data={weeklyRevisionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis dataKey="week" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-main)', borderRadius: '0.75rem', fontSize: '12px' }} />
                          <Bar dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsView;