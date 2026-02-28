import React from 'react';
import { motion } from 'framer-motion';
import { WizardData } from '@/types';
import { Rocket, RotateCcw } from 'lucide-react';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepReadingGoalChoice: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const isResume = formData.readingGoalMode === 'resume';

    return (
        <div className="space-y-6">
            <p className="text-base font-bold text-white mb-6">
                {t('readingGoalChoicePrompt') || 'Reprendre un programme en cours ou commencer un nouveau ?'}
            </p>
            <div className="flex flex-col gap-4">
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => updateData({ readingGoalMode: 'new' })}
                    className="w-full flex items-start gap-5 p-6 rounded-2xl text-left transition-all"
                    style={{
                        background: isResume === false
                            ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                            : 'rgba(255,255,255,0.06)',
                        border: isResume === false ? '1.5px solid rgba(52,211,153,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-400">
                        <Rocket size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-lg text-white">{t('newProgram') || 'Nouveau programme'}</p>
                        <p className="text-sm text-white/60 mt-1">{t('newProgramDesc') || 'Définir un nouvel objectif de lecture depuis le début.'}</p>
                    </div>
                </motion.button>
                <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => updateData({ readingGoalMode: 'resume' })}
                    className="w-full flex items-start gap-5 p-6 rounded-2xl text-left transition-all"
                    style={{
                        background: isResume === true
                            ? 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))'
                            : 'rgba(255,255,255,0.06)',
                        border: isResume === true ? '1.5px solid rgba(251,191,36,0.5)' : '1.5px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <div className="p-4 rounded-2xl bg-amber-500/20 text-amber-400">
                        <RotateCcw size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-lg text-white">{t('resumeProgram') || 'Reprendre un programme en cours'}</p>
                        <p className="text-sm text-white/60 mt-1">{t('resumeProgramDesc') || 'J\'étais déjà en train de lire et je veux continuer.'}</p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};

export default StepReadingGoalChoice;
