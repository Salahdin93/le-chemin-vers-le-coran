import React from 'react';
import { motion } from 'framer-motion';
import { WizardData } from '@/types';
import Input from '@/components/ui/Input';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepResumeExisting: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const daysRead = formData.existingDaysRead || 0;
    const pagesRead = formData.existingPagesRead || 0;
    const avgPagesPerDay = daysRead > 0 ? Math.round(pagesRead / daysRead) : 0;

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
                    {t('resumeExistingReadingAction')}
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
                    {t('startFromScratchAction')}
                </button>
            </div>

            {/* Formulaire si reprendre */}
            {formData.resumeExistingReading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t('daysAlreadyRead')}
                            type="number"
                            min="1"
                            value={daysRead || ''}
                            onChange={e => updateData({ existingDaysRead: parseInt(e.target.value) || 0 })}
                            variant="wizard"
                            placeholder="ex: 15"
                        />
                        <Input
                            label={t('pagesAlreadyRead')}
                            type="number"
                            min="1"
                            value={pagesRead || ''}
                            onChange={e => updateData({ existingPagesRead: parseInt(e.target.value) || 0 })}
                            variant="wizard"
                            placeholder="ex: 240"
                        />
                    </div>

                    {/* Résumé de progression */}
                    {daysRead > 0 && pagesRead > 0 && (
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
                    )}

                    <p className="text-xs font-medium text-center text-white/40">
                        {t('resumeExistingReadingDesc')}
                    </p>
                </motion.div>
            )}

        </div>
    );
};

export default StepResumeExisting;
