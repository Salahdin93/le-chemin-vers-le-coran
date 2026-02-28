import React, { useEffect, useMemo } from 'react';
import { WizardData } from '@/types';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { SimpleCheckbox } from '@/components/ui/Checkbox';
import { motion } from 'framer-motion';

const TOTAL_PAGES = 604;

/** Calcule les pages/jour cible pour la reprise (durée, khatmas, Al-Kahf). */
function getTargetPagesPerDayResume(
    duration: number,
    khatmas: number,
    pagesRead: number,
    kahfOption: boolean,
    kahfPages: number
): number {
    const totalToRead = TOTAL_PAGES * khatmas;
    const remaining = Math.max(0, totalToRead - pagesRead);
    let pagesForNormalDays = remaining;
    let fridaysCount = 0;
    if (kahfOption && (kahfPages ?? 0) > 0) {
        const start = new Date();
        for (let i = 0; i < duration; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            if (d.getDay() === 5) fridaysCount++;
        }
        pagesForNormalDays = Math.max(0, remaining - fridaysCount * (kahfPages ?? 0));
    }
    const normalDaysCount = duration - fridaysCount;
    return normalDaysCount > 0 ? Math.round(pagesForNormalDays / normalDaysCount) : 0;
}

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepReadingGoals: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const isResume = formData.wantsResumeExistingProgram === true;
    const daysRead = formData.existingDaysRead || 0;
    const pagesRead = formData.existingPagesRead || 0;
    const avgPagesPerDay = daysRead > 0 ? Math.round(pagesRead / daysRead) : 0;
    const duration = formData.duration ?? 30;
    const khatmas = formData.khatmas ?? 1;
    const kahfOption = !!formData.kahfOption;
    const kahfPages = formData.kahfPages ?? 0;
    const targetPagesPerDay = useMemo(() => getTargetPagesPerDayResume(duration, khatmas, pagesRead, kahfOption, kahfPages), [duration, khatmas, pagesRead, kahfOption, kahfPages]);

    useEffect(() => {
        if (isResume) {
            updateData({ resumeExistingReading: true });
        }
    }, [isResume]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-6">
            {/* Bloc reprise : jours/pages déjà lus (si "Reprendre mon programme" choisi à l'étape précédente) */}
            {isResume && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {t('resumeExistingReading')}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t('daysAlreadyRead')}
                            type="number"
                            min="1"
                            value={daysRead || ''}
                            onChange={e => {
                                const days = parseInt(e.target.value) || 0;
                                updateData({ existingDaysRead: days });
                                if (days > 0 && pagesRead > 0) {
                                    const avg = pagesRead / days;
                                    let duration = 60;
                                    const khatmas = 1;
                                    if (avg >= 18) duration = 30;
                                    else if (avg >= 8) duration = 60;
                                    else if (avg >= 3.5) duration = 120;
                                    else duration = 240;
                                    updateData({ duration, khatmas });
                                }
                            }}
                            variant="wizard"
                            placeholder="ex: 15"
                        />
                        <Input
                            label={t('pagesAlreadyRead')}
                            type="number"
                            min="1"
                            value={pagesRead || ''}
                            onChange={e => {
                                const pages = parseInt(e.target.value) || 0;
                                updateData({ existingPagesRead: pages });
                                if (daysRead > 0 && pages > 0) {
                                    const avg = pages / daysRead;
                                    let duration = 60;
                                    const khatmas = 1;
                                    if (avg >= 18) duration = 30;
                                    else if (avg >= 8) duration = 60;
                                    else if (avg >= 3.5) duration = 120;
                                    else duration = 240;
                                    updateData({ duration, khatmas });
                                }
                            }}
                            variant="wizard"
                            placeholder="ex: 240"
                        />
                    </div>
                    {daysRead > 0 && pagesRead > 0 && (
                        <div
                            className="p-4 rounded-2xl grid grid-cols-3 gap-3 bg-emerald-500/10 border border-emerald-400/30"
                        >
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{daysRead}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/70">
                                    {t('daysReadLabel')}
                                </p>
                            </div>
                            <div className="text-center border-l border-r border-white/20">
                                <p className="text-2xl font-black text-white">{pagesRead}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/70">
                                    {t('pagesReadLabel')}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-emerald-300">
                                    {isResume && duration > 0 ? targetPagesPerDay : avgPagesPerDay}
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/70">
                                    {t('pagesPerDayLabel')}
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Objectifs : durée (en reprise = jours restants pour terminer), khatmas, Al-Kahf */}
            <div className="space-y-4">
                {isResume && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                        {t('durationDaysRemainingHelp')}
                    </p>
                )}
                <Select
                    label={isResume ? t('durationDaysRemaining') : t('duration')}
                    value={formData.duration || 30}
                    onChange={(e) => updateData({ duration: parseInt(e.target.value) })}
                    variant="wizard"
                >
                    {[7, 10, 15, 20, 30, 40, 60, 90, 120].map(d => <option key={d} value={d}>{d} {t('days')}</option>)}
                </Select>
                <Input
                    label={t('khatmas')}
                    type="number"
                    min="1"
                    value={formData.khatmas || 1}
                    onChange={(e) => updateData({ khatmas: parseInt(e.target.value) || 1 })}
                    variant="wizard"
                />
                <SimpleCheckbox
                    label={t('kahfOption')}
                    checked={!!formData.kahfOption}
                    onChange={(e) => updateData({ kahfOption: e.target.checked })}
                    variant="wizard"
                />
                {formData.kahfOption && (
                    <Input
                        label={t('kahfPages')}
                        type="number"
                        min="0"
                        value={formData.kahfPages || 0}
                        onChange={(e) => updateData({ kahfPages: parseInt(e.target.value) || 0 })}
                        variant="wizard"
                    />
                )}
            </div>
        </div>
    );
};

export default StepReadingGoals;
