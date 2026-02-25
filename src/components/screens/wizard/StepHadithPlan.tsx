import React from 'react';
import { motion } from 'framer-motion';
import { WizardData, RevisionFrequency } from '@/types';
import Input from '@/components/ui/Input';
import { ToggleSwitch } from '@/components/ui/Checkbox';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const FreqBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
        style={{
            background: active ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(255,255,255,0.07)',
            border: active ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: active ? '#fff' : 'rgba(255,255,255,0.6)',
            boxShadow: active ? '0 0 16px rgba(52,211,153,0.3)' : 'none',
        }}
    >
        {children}
    </button>
);

const StepHadithPlan: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const hadithType = formData.hadithType || 'lecture';
    const freq = formData.hadithFrequency || { type: 'daily', value: 1 };

    const updateFreq = (patch: Partial<RevisionFrequency>) =>
        updateData({ hadithFrequency: { ...freq, ...patch } });

    const hadithPerDay = formData.hadithPerDay || 1;
    const hadithDuration = formData.hadithDuration || 30;

    return (
        <div className="space-y-6">
            {/* Type de hadith */}
            <div>
                <label className="block mb-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                    {t('hadithTypeLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'lecture', label: t('practiceLecture'), icon: '📖', desc: t('practiceLectureDesc') },
                        { value: 'revision', label: t('practiceRevision'), icon: '🧠', desc: t('practiceRevisionDesc') },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            className="p-4 rounded-2xl text-left transition-all duration-300"
                            style={{
                                background: hadithType === opt.value
                                    ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                                    : 'rgba(255,255,255,0.06)',
                                border: hadithType === opt.value
                                    ? '1px solid rgba(52,211,153,0.5)'
                                    : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: hadithType === opt.value ? '0 0 20px rgba(52,211,153,0.2)' : 'none',
                            }}
                            onClick={() => updateData({ hadithType: opt.value as 'lecture' | 'revision' })}
                        >
                            <div className="text-2xl mb-2">{opt.icon}</div>
                            <p className="font-black text-sm text-white">{opt.label}</p>
                            <p className="text-[10px] font-medium mt-1 text-white/60">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Nombre/jour et durée */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label={hadithType === 'revision' ? t('hadithsPerDayRevision') : t('hadithsPerDayRead')}
                    type="number"
                    min="1"
                    value={hadithPerDay}
                    onChange={e => updateData({ hadithPerDay: parseInt(e.target.value) || 1 })}
                    variant="wizard"
                />
                <Input
                    label={t('totalDurationDays')}
                    type="number"
                    min="7"
                    value={hadithDuration}
                    onChange={e => updateData({ hadithDuration: parseInt(e.target.value) || 30 })}
                    variant="wizard"
                />
            </div>

            {/* Fréquence */}
            <div>
                <label className="block mb-3 text-[10px] font-black uppercase tracking-widest text-white/90">
                    {t('revisionFrequency')}
                </label>
                <div className="flex gap-2 flex-wrap">
                    <FreqBtn active={freq.type === 'daily'} onClick={() => updateFreq({ type: 'daily' })}>{t('freqDaily')}</FreqBtn>
                    <FreqBtn active={freq.type === 'weekly'} onClick={() => updateFreq({ type: 'weekly', value: 0 })}>{t('freqWeekly')}</FreqBtn>
                    <FreqBtn active={freq.type === 'custom'} onClick={() => updateFreq({ type: 'custom', value: 2 })}>{t('freqCustom')}</FreqBtn>
                </div>
                {freq.type === 'custom' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
                        <Input
                            label={t('everyXDays').replace('{count}', '')}
                            type="number"
                            min="2"
                            value={(freq.value as number) > 1 ? (freq.value as number) : 2}
                            onChange={e => updateFreq({ value: parseInt(e.target.value) || 2 })}
                            variant="wizard"
                        />
                    </motion.div>
                )}
            </div>

            {hadithType === 'revision' && (
                <div className="pt-4" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <ToggleSwitch
                        label={t('prioritizeHadithWeaknesses')}
                        checked={formData.prioritizeHadithWeaknesses || false}
                        onChange={(e) => updateData({ prioritizeHadithWeaknesses: e.target.checked })}
                        className="bg-transparent border-none p-0"
                        variant="wizard"
                    />
                </div>
            )}

            {/* Aperçu */}
            {hadithPerDay > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl text-center space-y-1"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                        {t('hadithGoalSummary').split(':')[0]}
                    </p>
                    <p className="text-sm font-bold text-white">
                        {hadithPerDay} {t('hadithLabel').toLowerCase()}{hadithPerDay > 1 ? 's' : ''} / {t('day').toLowerCase()}
                    </p>
                    <p className="text-[10px] font-medium text-white/40 uppercase tracking-tighter">
                        {hadithDuration} {t('days')} {(formData.hadithSelection?.length || 0) > 0 ? `• ${formData.hadithSelection?.length} ${t('selected')}` : ''}
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default StepHadithPlan;
