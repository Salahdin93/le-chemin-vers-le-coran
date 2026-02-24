import React, { useState } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { Hadith, HadithMemorizationStatus } from '../../types';
import { clsx } from 'clsx';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const HadithCard: React.FC<{ hadith: Hadith; status: HadithMemorizationStatus }> = ({ hadith, status }) => {
    const { state, dispatch, t } = useStore();
    const [showTranslation, setShowTranslation] = useState(false);

    const statusStyles: Record<HadithMemorizationStatus, string> = {
        non_lu: 'border-border-main',
        lu: 'border-blue-500',
        en_memorisation: 'border-yellow-500',
        a_reprendre: 'border-red-500',
        acquis: 'border-green-500',
    };

    const handleStatusChange = (newStatus: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId: hadith.id, status: newStatus } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    return (
        <Card className={clsx('!p-0 flex flex-col border-2 transition-colors', statusStyles[status])}>
            <CardHeader>
                <CardTitle className="text-primary">{t('hadithNumber', { number: hadith.id })}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
                <div className="p-4 bg-bg-main rounded-lg min-h-[100px]">
                    <p className="font-amiri text-xl leading-relaxed rtl text-right">{hadith.arabic}</p>
                </div>
                
                <AnimatePresence>
                    {showTranslation && state.settings.lang !== 'ar' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="p-3 bg-border-main/20 rounded-lg text-sm italic">
                                "{hadith.translations[state.settings.lang] || hadith.translations.en}"
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="mt-auto pt-4 space-y-3">
                    {state.settings.lang !== 'ar' && (
                        <Button variant="ghost" onClick={() => setShowTranslation(!showTranslation)} className="gap-2 w-full">
                            {showTranslation ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showTranslation ? t('hideTranslation') : t('showTranslation')}
                        </Button>
                    )}
                    <div className="space-y-2">
                         <h5 className="text-sm font-bold pt-2 border-t border-dashed">{t('status')}:</h5>
                         <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleStatusChange('lu')}>{t('statusLu')}</Button>
                            <Button size="sm" variant="ghost" className="bg-yellow-500/20 text-yellow-700" onClick={() => handleStatusChange('en_memorisation')}>{t('statusEnMemorisation')}</Button>
                            <Button size="sm" variant="warning" onClick={() => handleStatusChange('a_reprendre')}>{t('statusARependre')}</Button>
                            <Button size="sm" variant="success" onClick={() => handleStatusChange('acquis')}>{t('statusAcquis')}</Button>
                         </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const HadithPlanView: React.FC = () => {
    const activeProfile = useActiveProfileSelector();

    if (!activeProfile) return null;

    const hadithProgress = activeProfile.hadithProgress || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {HADITH_COLLECTION.map(hadith => (
                <HadithCard
                    key={hadith.id}
                    hadith={hadith}
                    status={hadithProgress[hadith.id] || 'non_lu'}
                />
            ))}
        </div>
    );
};

export default HadithPlanView;