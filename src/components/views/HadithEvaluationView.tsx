import React from 'react';
import { useStore } from '../../context/AppContext';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Trophy, Activity, Zap } from 'lucide-react';

const HadithEvaluationView: React.FC = () => {
    const { dispatch, t } = useStore();

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-20">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center space-y-12"
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                        className="w-32 h-32 bg-accent-color/10 rounded-[3rem] flex items-center justify-center text-accent-color mx-auto shadow-2xl shadow-accent-color/10"
                    >
                        <Zap size={60} fill="currentColor" className="opacity-20" />
                        <Sparkles className="absolute -top-4 -right-4 text-accent-color" size={32} />
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-black text-gradient tracking-tight italic">
                        {t('hadithEvaluation') || 'Évaluation des Hadiths'}
                    </h1>
                    <p className="text-xl font-medium text-text-secondary leading-relaxed max-w-lg mx-auto">
                        Le protocole d'examen complet arrive bientôt. Préparez-vous à tester votre maîtrise avec précision.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-8">
                    <button
                        onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-plan-view' })}
                        className="p-8 premium-card border-none bg-bg-secondary/40 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-bg-secondary transition-all group"
                    >
                        <div className="w-12 h-12 bg-accent-color/10 rounded-2xl flex items-center justify-center text-accent-color group-hover:scale-110 transition-transform">
                            <Brain size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 italic transition-opacity">Continuer l'Apprentissage</span>
                    </button>

                    <button
                        onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-stats-view' })}
                        className="p-8 premium-card border-none bg-bg-secondary/40 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-bg-secondary transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Activity size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 italic transition-opacity">Consulter mes Statistiques</span>
                    </button>
                </div>

                <div className="pt-8 border-t border-border-main/50 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20">Prochaines fonctionnalités</p>
                    <div className="flex flex-wrap justify-center gap-6 opacity-30 text-[9px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-2"><Trophy size={14} /> Examens par cycles</span>
                        <span className="flex items-center gap-2"><Sparkles size={14} /> Questions aléatoires</span>
                        <span className="flex items-center gap-2"><Zap size={14} /> Mode contre-la-montre</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default HadithEvaluationView;