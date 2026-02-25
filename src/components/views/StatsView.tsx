import React from 'react';
import { useStore } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { processWeeklyReadingData, processWeeklyRevisionData } from '../../services/statsLogic';
import EmptyState from '../ui/EmptyState';
import { TOTAL_PAGES } from '../../constants/quranData';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { HadithMemorizationStatus } from '../../types';
import { motion } from 'framer-motion';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, Award } from 'lucide-react';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-black">
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
    { name: t('statusAcquis'), value: hadithStatusCounts.acquis || 0, color: 'var(--accent-color)' },
    { name: t('statusEnMemorisation'), value: hadithStatusCounts.en_memorisation || 0, color: '#3b82f6' },
    { name: t('statusARependre'), value: hadithStatusCounts.a_reprendre || 0, color: '#f59e0b' },
    { name: t('statusLu'), value: hadithStatusCounts.lu || 0, color: '#64748b' },
    { name: t('statusNonLu'), value: hadithStatusCounts.non_lu || 0, color: '#cbd5e1' },
  ].filter(item => item.value > 0);

  const masteredHadiths = hadithStatusCounts.acquis || 0;
  const noData = weeklyReadingData.length === 0 && weeklyRevisionData.length === 0;

  return (
    <div className="space-y-12 pb-32 px-4 md:px-0">
      <header className="pb-8 border-b border-border-main flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-black text-gradient mb-2">{t('statistics')}</h1>
          <p className="text-text-secondary font-medium text-sm md:text-base">{t('statsSubtitle') || 'Analysez vos efforts et visualisez votre ascension spirituelle.'}</p>
        </div>
        <div className="flex items-center gap-3 p-1 bg-bg-secondary/50 rounded-2xl border border-border-main/50 self-start md:self-auto">
          <div className="px-4 py-2 flex items-center gap-2">
            <Activity size={16} className="text-accent-color" />
            <span className="text-[10px] font-black uppercase tracking-widest">{t('liveStats') || 'Live Update'}</span>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="premium-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-color/5 rounded-full blur-2xl group-hover:bg-accent-color/10 transition-colors" />
            <TrendingUp size={24} className="text-accent-color mb-4 opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">{t('readingProgress')}</span>
            <p className="text-5xl font-black text-gradient leading-none mb-4">{readingProgressPercent}%</p>
            <div className="w-full h-1 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readingProgressPercent}%` }}
                className="h-full bg-accent-color shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
              />
            </div>
            <p className="mt-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">{totalPagesRead} / {totalPagesGoal} pages</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="premium-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
            <Activity size={24} className="text-blue-500 mb-4 opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">{t('revisionProgress')}</span>
            <p className="text-5xl font-black text-blue-500 leading-none mb-4">{revisionProgressPercent}%</p>
            <div className="w-full h-1 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${revisionProgressPercent}%` }}
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <p className="mt-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">{revisionDaysDone} / {totalRevisionDays} {t('days')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="premium-card p-8 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors" />
            <Award size={24} className="text-yellow-500 mb-4 opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">{t('hadithProgress')}</span>
            <div className="flex items-baseline gap-2 mb-4">
              <p className="text-5xl font-black text-yellow-500 leading-none">{masteredHadiths}</p>
              <span className="text-xl font-black opacity-20">/ {totalHadiths}</span>
            </div>
            <div className="w-full h-1 bg-bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(masteredHadiths / totalHadiths) * 100}%` }}
                className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              />
            </div>
            <p className="mt-4 text-[10px] font-bold opacity-40 uppercase tracking-widest">{t('hadithsMastered')}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hadith Distribution */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <div className="premium-card p-0 overflow-hidden flex flex-col h-full">
            <header className="p-8 border-b border-border-main bg-bg-secondary/30">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <PieChartIcon size={18} className="text-yellow-500" />
                {t('hadithStats')}
              </h3>
            </header>
            <div className="p-8 flex-1 flex flex-col items-center">
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
                      innerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {hadithStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(var(--bg-secondary-rgb), 0.95)',
                        border: '1px solid var(--border-main)',
                        borderRadius: '1rem',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend
                      iconType="circle"
                      formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-2">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activity Charts */}
        {noData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="h-full flex items-center justify-center border-2 border-dashed border-border-main/50 rounded-[2.5rem] bg-bg-main/30 p-12">
              <EmptyState icon={<BarChart3 size={48} className="opacity-10" />} title={t('noDataYet')} message={t('statsAppearHere')} />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {weeklyReadingData.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <div className="premium-card p-0 overflow-hidden">
                  <header className="p-6 border-b border-border-main bg-bg-secondary/30">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <BarChart3 size={18} className="text-accent-color" />
                      {t('readingActivity')}
                    </h3>
                  </header>
                  <div className="p-8">
                    <div className="h-48 md:h-64">
                      <ResponsiveContainer>
                        <BarChart data={weeklyReadingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 9, fontWeight: 900, fill: 'currentColor', opacity: 0.3 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fontWeight: 900, fill: 'currentColor', opacity: 0.3 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(var(--accent-rgb), 0.05)' }}
                            contentStyle={{
                              background: 'var(--card-bg)',
                              borderColor: 'var(--border-main)',
                              borderRadius: '0.75rem',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          />
                          <Bar
                            dataKey="pages"
                            fill="var(--accent-color)"
                            radius={[8, 8, 0, 0]}
                            barSize={32}
                            className="drop-shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {weeklyRevisionData.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                <div className="premium-card p-0 overflow-hidden">
                  <header className="p-6 border-b border-border-main bg-bg-secondary/30">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                      <Activity size={18} className="text-blue-500" />
                      {t('revisionActivity')}
                    </h3>
                  </header>
                  <div className="p-8">
                    <div className="h-48 md:h-64">
                      <ResponsiveContainer>
                        <BarChart data={weeklyRevisionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 9, fontWeight: 900, fill: 'currentColor', opacity: 0.3 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 9, fontWeight: 900, fill: 'currentColor', opacity: 0.3 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                            contentStyle={{
                              background: 'var(--card-bg)',
                              borderColor: 'var(--border-main)',
                              borderRadius: '0.75rem',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}
                          />
                          <Bar
                            dataKey="units"
                            fill="#3b82f6"
                            radius={[8, 8, 0, 0]}
                            barSize={32}
                            className="drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsView;
