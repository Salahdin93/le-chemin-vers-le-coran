import React from 'react';
import { WizardData } from '@/types';
import Input from '@/components/ui/Input';
import { SimpleCheckbox } from '@/components/ui/Checkbox';
import { motion } from 'framer-motion';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepResumeExisting: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const daysRead = formData.existingDaysRead || 0;
    const pagesRead = formData.existingPagesRead || 0;
    const avgPagesPerDay = daysRead > 0 ? Math.round(pagesRead / daysRead) : 0;

    const [showChoice, setShowChoice] = React.useState(false);
    const [isConfirmed, setIsConfirmed] = React.useState(false);

    React.useEffect(() => {
        if (daysRead > 0 && pagesRead > 0 && !isConfirmed) {
            setShowChoice(true);
        } else {
            setShowChoice(false);
        }
    }, [daysRead, pagesRead, isConfirmed]);

    const handleConfirm = () => {
        setIsConfirmed(true);
    };

    const handleReject = () => {
        setIsConfirmed(false);
        setShowChoice(false);
        // On laisse durer pour que l'utilisateur ajuste manuellement
    };

    return (
        <div className="space-y-6">
            {/* Toggle: reprendre ou commencer de zéro */}
            <div className="flex gap-3">
                <button
                    type="button"
                    className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300"
                    style={{
                        background: formData.resumeExistingReading
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                            : 'rgba(255,255,255,0.06)',
                        border: formData.resumeExistingReading
                            ? '1px solid rgba(52,211,153,0.5)'
                            : '1px solid rgba(255,255,255,0.1)',
                        color: formData.resumeExistingReading ? '#fff' : 'rgba(255,255,255,0.4)',
                        boxShadow: formData.resumeExistingReading ? '0 0 20px rgba(52,211,153,0.25)' : 'none',
                    }}
                    onClick={() => updateData({ resumeExistingReading: true })}
                >
                    {t('confirmResumeExistingAction')}
                </button>
                <button
                    type="button"
                    className="flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300"
                    style={{
                        background: formData.resumeExistingReading === false
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                            : 'rgba(255,255,255,0.06)',
                        border: formData.resumeExistingReading === false
                            ? '1px solid rgba(52,211,153,0.5)'
                            : '1px solid rgba(255,255,255,0.1)',
                        color: formData.resumeExistingReading === false ? '#fff' : 'rgba(255,255,255,0.4)',
                        boxShadow: formData.resumeExistingReading === false ? '0 0 20px rgba(52,211,153,0.25)' : 'none',
                    }}
                    onClick={() => updateData({ resumeExistingReading: false, existingDaysRead: 0, existingPagesRead: 0 })}
                >
                    {t('confirmStartFromScratchAction')}
                </button>
            </div>

            {/* Formulaire si reprendre */}
            {formData.resumeExistingReading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t('daysAlreadyRead')}
                            type="number"
                            min="1"
                            value={daysRead || ''}
                            onChange={e => {
                                const days = parseInt(e.target.value) || 0;
                                updateData({ existingDaysRead: days });
                                setIsConfirmed(false);

                                if (days > 0 && pagesRead > 0) {
                                    const avg = pagesRead / days;
                                    let duration = 60;
                                    let khatmas = 1;
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
                                setIsConfirmed(false);

                                if (daysRead > 0 && pages > 0) {
                                    const avg = pages / daysRead;
                                    let duration = 60;
                                    let khatmas = 1;
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

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
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

                    {/* Résumé de progression et confirmation du plan */}
                    {daysRead > 0 && pagesRead > 0 && (
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
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
                            </motion.div>

                            {showChoice && !isConfirmed && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 rounded-[2rem] bg-bg-main/40 border border-border-main/50 space-y-4"
                                >
                                    <p className="text-xs font-bold text-center text-white/80">
                                        {t('deducedPlanPrompt').replace('{duration}', String(formData.duration)).replace('{khatmas}', String(formData.khatmas))}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                                        >
                                            {t('confirmPlan')}
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                                        >
                                            {t('manualAdjustment')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {!isConfirmed && !showChoice && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 rounded-[2rem] bg-white/5 border border-white/10 space-y-4"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center text-white/40">
                                        {t('chooseTargetDuration')}
                                    </p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1, 3, 7, 10, 15, 20, 30, 40, 60, 90, 120].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    updateData({ duration: d, khatmas: 1 });
                                                    setIsConfirmed(true);
                                                }}
                                                className="py-2 rounded-lg bg-white/10 border border-white/10 text-white text-[10px] font-black hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all"
                                            >
                                                {d} j
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">OU</span>
                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1, 2, 3].map(k => (
                                            <button
                                                key={k}
                                                onClick={() => {
                                                    updateData({ khatmas: k, duration: 30 });
                                                    setIsConfirmed(true);
                                                }}
                                                className="py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black hover:bg-emerald-500/20 transition-all"
                                            >
                                                {k} Khatma{k > 1 ? 's' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {!isConfirmed && !showChoice && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-5 rounded-[2.5rem] bg-bg-secondary/30 border border-border-main/30 space-y-5"
                                >
                                    <div className="grid grid-cols-2 gap-6">
                                        <Input
                                            label={t('durationInDays')}
                                            type="number"
                                            min="7"
                                            value={formData.duration || ''}
                                            onChange={e => updateData({ duration: parseInt(e.target.value) || 30 })}
                                            variant="wizard"
                                        />
                                        <Input
                                            label={t('numberOfKhatmas')}
                                            type="number"
                                            min="1"
                                            value={formData.khatmas || ''}
                                            onChange={e => updateData({ khatmas: parseInt(e.target.value) || 1 })}
                                            variant="wizard"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-emerald-400/60">
                                        {Math.round(604 * (formData.khatmas || 1) / (formData.duration || 1))} {t('pagesPerDayLabel').toLowerCase()}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    )}

                    <p className="text-[10px] font-medium text-center text-white/30 uppercase tracking-widest">
                        {t('resumeExistingReadingDesc')}
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default StepResumeExisting;
