import React, { useState, useMemo } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { HadithMemorizationStatus } from '../../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const HadithMemorizationView: React.FC = () => {
    const { dispatch, t, state } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentHadith = useMemo(() => HADITH_COLLECTION[currentIndex], [currentIndex]);
    const progress = activeProfile?.hadithProgress || {};
    const currentStatus = progress[currentHadith.id] || 'not_started';

    if (!activeProfile) return null;

    const handleStatusChange = (status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId: currentHadith.id, status } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const goToNext = () => {
        setCurrentIndex(prev => (prev + 1) % HADITH_COLLECTION.length);
    };

    const goToPrev = () => {
        setCurrentIndex(prev => (prev - 1 + HADITH_COLLECTION.length) % HADITH_COLLECTION.length);
    };

    const statusOptions: { status: HadithMemorizationStatus, labelKey: string, variant: 'secondary' | 'warning' | 'success' }[] = [
        { status: 'non_lu', labelKey: 'statusNotStarted', variant: 'secondary' },
        { status: 'en_memorisation', labelKey: 'statusInProgress', variant: 'warning' },
        { status: 'acquis', labelKey: 'statusMastered', variant: 'success' },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>{t('hadithNumber', { number: currentHadith.id })}</span>
                        <Button variant="ghost" onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-plan-view' })}>{t('backToMenu')}</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-bg-main rounded-lg border-r-4 border-primary dir-rtl text-right">
                        <p className="font-amiri text-2xl leading-loose">{currentHadith.arabic}</p>
                    </div>
                    <div className="p-4 bg-bg-main rounded-lg">
                        <p className="italic">"{currentHadith.translations[state.settings.lang] || currentHadith.translations.en}"</p>
                    </div>
                    <p className="text-sm text-center text-text-main/70">
                        <strong>{t('source')}:</strong> {currentHadith.source[state.settings.lang] || currentHadith.source.en}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('updateStatus')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                    {statusOptions.map(opt => (
                        <Button 
                            key={opt.status}
                            variant={currentStatus === opt.status ? opt.variant : 'ghost'}
                            onClick={() => handleStatusChange(opt.status)}
                            className="flex-1"
                        >
                            {t(opt.labelKey)}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <Button onClick={goToPrev} className="gap-2"><ArrowLeft size={16} /> {t('previous')}</Button>
                <span>{currentIndex + 1} / {HADITH_COLLECTION.length}</span>
                <Button onClick={goToNext} className="gap-2">{t('next')} <ArrowRight size={16} /></Button>
            </div>
        </div>
    );
};

export default HadithMemorizationView;