import React, { useEffect } from 'react';
import { WizardData } from '@/types';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { SimpleCheckbox } from '@/components/ui/Checkbox';
import { motion } from 'framer-motion';

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
                            className="p-4 rounded-2xl grid grid-cols-3 gap-3"
                            style={{
                                background: 'rgba(52,211,153,0.08)',
                                border: '1px solid rgba(52,211,153,0.2)',
                            }}
                        >
                            <div className="text-center">
                                <p className="text-2xl font-black text-white">{daysRead}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/50">
                                    {t('daysReadLabel')}
                                </p>
                            </div>
                            <div className="text-center" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                                <p className="text-2xl font-black text-white">{pagesRead}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/50">
                                    {t('pagesReadLabel')}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-emerald-300">{avgPagesPerDay}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-white/50">
                                    {t('pagesPerDayLabel')}
                                </p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Objectifs : durée, khatmas, Al-Kahf */}
            <div className="space-y-4">
                <Select
                    label={t('duration')}
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
