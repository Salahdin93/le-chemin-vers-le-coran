import React from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { HADITH_COLLECTION } from '../../constants/hadithData';

const COLORS = {
    acquis: '#22c55e', // green-500
    en_memorisation: '#f59e0b', // amber-500
    a_reprendre: '#ef4444', // red-500
    lu: '#3b82f6', // blue-500
    non_lu: '#6b7280', // gray-500
};

const HadithStatsView: React.FC = () => {
    const { t } = useStore();
    const activeProfile = useActiveProfileSelector();

    if (!activeProfile) return null;

    const progress = activeProfile.hadithProgress || {};
    const totalHadiths = HADITH_COLLECTION.length;

    const stats = {
        acquis: Object.values(progress).filter(s => s === 'acquis').length,
        en_memorisation: Object.values(progress).filter(s => s === 'en_memorisation').length,
        a_reprendre: Object.values(progress).filter(s => s === 'a_reprendre').length,
        lu: Object.values(progress).filter(s => s === 'lu').length,
        non_lu: 0
    };
    stats.non_lu = totalHadiths - (stats.acquis + stats.en_memorisation + stats.a_reprendre + stats.lu);

    const pieData = [
        { name: t('statusAcquis'), value: stats.acquis },
        { name: t('statusEnMemorisation'), value: stats.en_memorisation },
        { name: t('statusARependre'), value: stats.a_reprendre },
        { name: t('statusLu'), value: stats.lu },
        { name: t('statusNonLu'), value: stats.non_lu },
    ].filter(item => item.value > 0);

    const pieColors = [
        COLORS.acquis,
        COLORS.en_memorisation,
        COLORS.a_reprendre,
        COLORS.lu,
        COLORS.non_lu,
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('hadithStats')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border-main)', borderRadius: '0.5rem' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HadithStatsView;