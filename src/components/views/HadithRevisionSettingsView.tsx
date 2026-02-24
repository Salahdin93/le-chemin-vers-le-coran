import React, { useState, useMemo, useEffect } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { HadithRevisionGoal, RevisionFrequency } from '../../types';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const DayButton: React.FC<{ day: string; index: number; isSelected: boolean; onClick: () => void; }> = ({ day, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={clsx(
            "rounded-full w-10 h-10 flex items-center justify-center font-bold transition-colors duration-200",
            isSelected ? 'bg-primary text-white' : 'bg-bg-main hover:bg-bg-secondary'
        )}
    >
        {day.charAt(0)}
    </button>
);

const HadithRevisionSettingsView: React.FC = () => {
    const { dispatch, t, activeProfile } = useStore();
    
    const initialGoal = activeProfile?.goals.hadithRevision;

    const [selectedHadiths, setSelectedHadiths] = useState<number[]>(initialGoal?.selectedHadiths || []);
    const [hadithsPerSession, setHadithsPerSession] = useState(initialGoal?.hadithsPerSession || 3);
    const [frequency, setFrequency] = useState<RevisionFrequency>(initialGoal?.frequency || { type: 'daily', value: 1 });

    if (!activeProfile) return null;

    const allHadithIds = HADITH_COLLECTION.map(h => h.id);

    const handleToggleHadith = (id: number) => {
        setSelectedHadiths(prev => 
            prev.includes(id) ? prev.filter(hId => hId !== id) : [...prev, id]
        );
    };

    const handleGeneratePlan = () => {
        if (selectedHadiths.length === 0 || hadithsPerSession <= 0) {
            dispatch({ type: 'SET_TOAST', payload: t('errorInvalidHadithPlan', "Veuillez sélectionner au moins un hadith et un nombre de hadiths par session supérieur à zéro.") });
            return;
        }

        const goal: HadithRevisionGoal = { selectedHadiths, hadithsPerSession, frequency };

        dispatch({ type: 'SET_HADITH_REVISION_PLAN', payload: { goal } });
        dispatch({ type: 'SET_TOAST', payload: t('hadithRevisionPlanCreated') });
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-revision-plan-view' });
    };

    const totalRevisionDays = useMemo(() => {
        if (hadithsPerSession <= 0) return 0;
        return Math.ceil(selectedHadiths.length / hadithsPerSession);
    }, [selectedHadiths, hadithsPerSession]);

    const daysOfWeek = JSON.parse(t('dayOfWeek', '["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]'));

    const handleWeeklyDayToggle = (dayIndex: number) => {
        const currentDays = (Array.isArray(frequency.value) ? frequency.value : []).filter(d => typeof d === 'number');
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex].sort();
        setFrequency({ type: 'weekly', value: newDays });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <Card>
                <CardHeader>
                    <CardTitle>{t('hadithRevisionSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Section 1: Hadith Selection */}
                    <div>
                        <h3 className="font-semibold text-lg mb-3">{t('selectHadithsForRevision', "1. Sélectionner les Hadiths à Réviser")}</h3>
                        <div className="flex gap-2 mb-4">
                            <Button size="sm" onClick={() => setSelectedHadiths(allHadithIds)}>{t('selectAll')}</Button>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedHadiths([])}>{t('deselectAll')}</Button>
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                            {HADITH_COLLECTION.map(hadith => (
                                <button
                                    key={hadith.id}
                                    onClick={() => handleToggleHadith(hadith.id)}
                                    className={clsx(
                                        "p-2 rounded-lg border-2 transition-all duration-200 aspect-square flex items-center justify-center font-bold",
                                        selectedHadiths.includes(hadith.id)
                                            ? 'bg-primary border-primary text-white scale-105 shadow-lg'
                                            : 'bg-bg-secondary border-border-main hover:border-primary/50'
                                    )}
                                >
                                    {hadith.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Session Settings */}
                    <div>
                        <h3 className="font-semibold text-lg mb-3">{t('hadithSessionSettings', "2. Paramètres de Session")}</h3>
                        <Input 
                            label={t('hadithsPerSession', "Hadiths par session de révision")}
                            type="number"
                            min="1"
                            value={hadithsPerSession}
                            onChange={(e) => setHadithsPerSession(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />
                    </div>

                    {/* Section 3: Frequency */}
                    <div>
                        <h3 className="font-semibold text-lg mb-3">{t('revisionFrequency', "3. Fréquence de Révision")}</h3>
                        <div className="flex gap-2 rounded-lg bg-bg-main p-1">
                            {(['daily', 'weekly', 'custom'] as const).map(type => (
                                <Button 
                                    key={type}
                                    variant={frequency.type === type ? 'primary' : 'ghost'}
                                    onClick={() => setFrequency({ type, value: type === 'weekly' ? [] : 1 })}
                                    className="flex-1"
                                >
                                    {t(`freq${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                                </Button>
                            ))}
                        </div>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={frequency.type}
                                initial={{ opacity: 0, height: 0, y: -10 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4"
                            >
                                {frequency.type === 'weekly' && (
                                    <div className='p-3 bg-bg-main rounded-lg'>
                                        <p className="text-sm text-center mb-3">{t('selectDaysOfWeek', 'Sélectionnez les jours de révision')}</p>
                                        <div className="flex justify-center gap-2">
                                            {daysOfWeek.map((day: string, index: number) => (
                                                <DayButton 
                                                    key={index}
                                                    day={day}
                                                    index={index}
                                                    isSelected={Array.isArray(frequency.value) && frequency.value.includes(index)}
                                                    onClick={() => handleWeeklyDayToggle(index)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {frequency.type === 'custom' && (
                                    <Input 
                                        label={t('everyXDays', { count: '' })}
                                        type="number"
                                        min="1"
                                        value={typeof frequency.value === 'number' ? frequency.value : 2}
                                        onChange={(e) => setFrequency({ ...frequency, value: parseInt(e.target.value, 10) || 1 })}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Section 4: Summary & Generation */}
                    <div className="pt-4 border-t border-dashed">
                        <div className="p-4 bg-primary/10 rounded-lg text-center mb-4">
                            <h4 className="font-bold text-primary">{t('planSummary', "Résumé du Plan")}</h4>
                            <p className="text-sm">
                                {t('hadithPlanSummaryText', "Vous avez sélectionné {count} hadiths. Votre plan contiendra {days} sessions de révision.", { count: selectedHadiths.length, days: totalRevisionDays })}
                            </p>
                        </div>
                        <Button onClick={handleGeneratePlan} className="w-full" size="lg" disabled={selectedHadiths.length === 0}>
                            {t('generatePlan')}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </motion.div>
    );
};

export default HadithRevisionSettingsView;