import React from 'react';
import { motion } from 'framer-motion';
import { WizardData } from '@/types';
import { Rocket, RotateCcw, Sparkles } from 'lucide-react';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepJourneyConfig: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const wantsResume = formData.wantsResumeExistingProgram === true;

    return (
        <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                    {t('journeyConfig') || 'Configuration du voyage'}
                </span>
            </div>
            <p className="text-base font-bold text-white mb-6">
                {t('programType') || 'Avez-vous déjà un programme de lecture/révision en cours ?'}
            </p>
            <div className="flex flex-col gap-4">
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => updateData({ wantsResumeExistingProgram: false })}
                    className="w-full flex items-start gap-5 p-6 rounded-2xl text-left transition-all"
                    style={{
                        background: wantsResume === false
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                            : 'rgba(255,255,255,0.06)',
                        border: wantsResume === false ? '1.5px solid rgba(52,211,153,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400">
                        <Rocket size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-lg text-white">{t('startNew') || 'Commencer un nouveau programme'}</p>
                        <p className="text-sm text-white/60 mt-1">{t('startNewDesc') || 'Je débute aujourd\'hui avec l\'application.'}</p>
                    </div>
                </motion.button>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => updateData({ wantsResumeExistingProgram: true })}
                    className="w-full flex items-start gap-5 p-6 rounded-2xl text-left transition-all"
                    style={{
                        background: wantsResume === true
                            ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))'
                            : 'rgba(255,255,255,0.06)',
                        border: wantsResume === true ? '1.5px solid rgba(251,191,36,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-400">
                        <RotateCcw size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-lg text-white">{t('resumeProgram') || 'Reprendre mon programme'}</p>
                        <p className="text-sm text-white/60 mt-1">{t('resumeProgramDesc') || 'J\'étais déjà en train de lire/réviser et je veux continuer.'}</p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

export default StepJourneyConfig;
