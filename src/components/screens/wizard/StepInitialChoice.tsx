import React from 'react';
import { motion } from 'framer-motion';
import { WizardData } from '@/types';
import { BookOpen, RefreshCw, ScrollText } from 'lucide-react';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    setWantsReading: (val: boolean) => void;
    setWantsRevision: (val: boolean) => void;
    t: (key: string) => string;
}

interface PlanOption {
    id: 'reading' | 'revision' | 'hadith';
    labelKey: string;
    descKey: string;
    icon: React.ReactNode;
    color: string;
    glow: string;
}

const options: PlanOption[] = [
    {
        id: 'reading',
        labelKey: 'reading',
        descKey: 'readingPlanDescWeb',
        icon: <BookOpen size={26} />,
        color: 'rgba(52,211,153,0.9)',
        glow: 'rgba(52,211,153,0.25)',
    },
    {
        id: 'revision',
        labelKey: 'revision',
        descKey: 'revisionPlanDescWeb',
        icon: <RefreshCw size={26} />,
        color: 'rgba(251,191,36,0.9)',
        glow: 'rgba(251,191,36,0.25)',
    },
    {
        id: 'hadith',
        labelKey: 'hadithLabel',
        descKey: 'hadithPlanDescWeb',
        icon: <ScrollText size={26} />,
        color: 'rgba(167,139,250,0.9)',
        glow: 'rgba(167,139,250,0.25)',
    },
];

const StepInitialChoice: React.FC<StepProps> = ({ formData, updateData, setWantsReading, setWantsRevision, t }) => {
    const wantsReading = formData.wantsReading ?? true;
    const wantsRevision = formData.wantsRevision ?? false;
    const wantsHadith = formData.wantsHadith ?? false;

    const toggle = (id: 'reading' | 'revision' | 'hadith') => {
        if (id === 'reading') {
            const next = !wantsReading;
            setWantsReading(next);
            updateData({ wantsReading: next });
        } else if (id === 'revision') {
            const next = !wantsRevision;
            setWantsRevision(next);
            updateData({ wantsRevision: next });
        } else {
            updateData({ wantsHadith: !wantsHadith });
        }
    };

    const isSelected = (id: 'reading' | 'revision' | 'hadith') => {
        if (id === 'reading') return wantsReading;
        if (id === 'revision') return wantsRevision;
        return wantsHadith;
    };

    return (
        <div className="space-y-4">
            <p className="text-xs font-bold text-center mb-4 text-white/70">
                {t('selectMultipleObjectives')}
            </p>

            {options.map((opt, i) => {
                const selected = isSelected(opt.id);
                return (
                    <motion.button
                        key={opt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        type="button"
                        className="w-full flex items-center gap-5 p-5 rounded-2xl transition-all duration-300 relative overflow-hidden text-left"
                        style={{
                            background: selected
                                ? `linear-gradient(135deg, ${opt.glow.replace('0.25', '0.2')}, rgba(255,255,255,0.05))`
                                : 'rgba(255,255,255,0.05)',
                            border: selected
                                ? `1.5px solid ${opt.color.replace('0.9', '0.5')}`
                                : '1.5px solid rgba(255,255,255,0.1)',
                            boxShadow: selected ? `0 0 28px ${opt.glow}` : 'none',
                        }}
                        onClick={() => toggle(opt.id)}
                    >
                        {/* Shimmer */}
                        <div
                            className="absolute inset-0 transition-opacity duration-500"
                            style={{
                                background: `linear-gradient(135deg, transparent, ${opt.glow.replace('0.25', '0.05')})`,
                                opacity: selected ? 1 : 0,
                            }}
                        />

                        {/* Icon */}
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-300"
                            style={{
                                background: selected ? `${opt.glow.replace('0.25', '0.3')}` : 'rgba(255,255,255,0.07)',
                                border: `1px solid ${selected ? opt.color.replace('0.9', '0.4') : 'rgba(255,255,255,0.1)'}`,
                                color: selected ? opt.color : 'rgba(255,255,255,0.4)',
                            }}
                        >
                            {opt.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 relative z-10">
                            <p className="font-black text-base text-white">{t(opt.labelKey)}</p>
                            <p className="text-xs font-medium mt-0.5 text-white/60">{t(opt.descKey)}</p>
                        </div>

                        {/* Checkmark */}
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 transition-all duration-300"
                            style={{
                                background: selected ? opt.color.replace('0.9', '1') : 'rgba(255,255,255,0.08)',
                                border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                                boxShadow: selected ? `0 0 12px ${opt.glow}` : 'none',
                            }}
                        >
                            {selected && (
                                <motion.svg
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                                >
                                    <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </motion.svg>
                            )}
                        </div>
                    </motion.button>
                );
            })}

            {/* Validation */}
            {!wantsReading && !wantsRevision && !wantsHadith && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs font-bold py-2"
                    style={{ color: 'rgba(252,165,165,0.8)' }}
                >
                    ⚠️ {t('selectAtLeastOneObjective')}
                </motion.p>
            )}
        </div>
    );
};

export default StepInitialChoice;

