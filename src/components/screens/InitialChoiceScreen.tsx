import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { WizardMode, WizardType } from '@/types';
import Button from '../ui/Button';
import { ArrowLeft, Rocket, RotateCcw, Sparkles } from 'lucide-react';

const ChoiceButton: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void, color: string }> =
    ({ icon, title, description, onClick, color }) => (
        <motion.div
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative group p-6 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-start gap-5 relative z-10">
                <div className={`p-4 rounded-2xl bg-${color}-500/20 text-${color}-400 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>
                <div className="flex-1 text-left">
                    <span className="font-black text-xl text-white block mb-1 group-hover:text-emerald-300 transition-colors">
                        {title}
                    </span>
                    <p className="text-sm text-emerald-100/40 line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </motion.div>
    );

const InitialChoiceScreen: React.FC = () => {
    const { dispatch, t } = useStore();

    const startWizard = (mode: WizardMode, type: WizardType) => {
        dispatch({ type: 'START_WIZARD', payload: { type, mode } });
    };

    const goBack = () => {
        dispatch({ type: 'SET_APP_SCREEN', payload: 'welcome' });
    };

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-6 overflow-hidden premium-bg"
        >

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative max-w-lg w-full glass-card p-10 border-none shadow-premium bg-white/5"
            >
                <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />

                <header className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                        <Sparkles size={12} className="text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                            Configuration du voyage
                        </span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                        {t('programType') || 'Type de programme'}
                    </h2>
                    <div className="w-12 h-1 bg-amber-400/30 rounded-full mx-auto mt-4" />
                </header>

                <div className="flex flex-col gap-6">
                    <ChoiceButton
                        icon={<Rocket size={24} />}
                        title={t('startNew') || 'Nouveau programme'}
                        description={t('startNewDesc') || 'Commencez un nouveau voyage avec un plan personnalisé'}
                        color="emerald"
                        onClick={() => startWizard('new', 'full')}
                    />
                    <ChoiceButton
                        icon={<RotateCcw size={24} />}
                        title={t('resumeProgram') || 'Reprendre'}
                        description={t('resumeProgramDesc') || 'Continuez un programme existant en renseignant votre progression actuelle'}
                        color="amber"
                        onClick={() => startWizard('resume', 'full')}
                    />
                </div>

                <div className="mt-10 flex flex-col items-center">
                    <Button
                        variant="ghost"
                        className="gap-2 text-emerald-100/40 hover:text-emerald-100 border-none bg-transparent hover:bg-white/5"
                        onClick={goBack}
                    >
                        <ArrowLeft size={16} />
                        <span className="font-bold uppercase tracking-widest text-xs">{t('back') || 'Retour'}</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default InitialChoiceScreen;