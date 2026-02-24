import React, { useState } from 'react';
import { useStore } from '@/context/AppContext';
import { EvaluationStatus, EvaluationItem } from '@/types';
import Button from '@/components/ui/Button';
import { LOGO_URL } from '@/constants/ui';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface ActiveEvaluationScreenProps {
    items: EvaluationItem[];
    onFinish: (results: (EvaluationItem & { result: EvaluationStatus })[]) => void;
}

const ActiveEvaluationScreen: React.FC<ActiveEvaluationScreenProps> = ({ items, onFinish }) => {
    const { t } = useStore();
    const [sessionItems, setSessionItems] = useState<(EvaluationItem & { result?: EvaluationStatus })[]>(items);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    const handleEvaluation = (result: EvaluationStatus | 'skip') => {
        const updatedItems = [...sessionItems];
        if (result !== 'skip') {
            updatedItems[currentItemIndex].result = result;
        }
        setSessionItems(updatedItems);

        if (currentItemIndex < sessionItems.length - 1) {
            setCurrentItemIndex(currentItemIndex + 1);
        } else {
            onFinish(updatedItems.filter(item => item.result) as (EvaluationItem & { result: EvaluationStatus })[]);
        }
    };

    const currentItem = sessionItems[currentItemIndex];
    const progressPercent = ((currentItemIndex + 1) / sessionItems.length) * 100;

    if (sessionItems.length === 0 || !currentItem) {
        return (
            <div className="flex flex-col items-center justify-center p-4 text-center">
                <img src={LOGO_URL} alt="Logo" className="w-32 h-32 object-contain mb-4 opacity-50" />
                <p className="text-xl">{t('evaluationNoItems')}</p>
                <p className="text-sm opacity-70 mt-2">{t('evaluationNoItemsDesc')}</p>
                <Button onClick={() => onFinish([])} className="mt-6">{t('back')}</Button>
            </div>
        );
    }

    const evaluationOptions: { status: EvaluationStatus, label: string, icon: string, color: string }[] = [
        { status: 'excellent', label: t('excellent'), icon: '⭐', color: 'success' },
        { status: 'bon', label: t('bon'), icon: '👍', color: 'primary' },
        { status: 'moyen', label: t('moyen'), icon: '⚠️', color: 'warning' },
        { status: 'a_revoir', label: t('a_revoir'), icon: '🔁', color: 'danger' }
    ];

    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>{t('evaluationSessionTitle')}</CardTitle>
                <p className="text-sm text-text-secondary">{t('evaluationItemProgress', { current: currentItemIndex + 1, total: sessionItems.length })}</p>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="w-full bg-border-main rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercent}%`, transition: 'width 0.5s ease-in-out' }}></div>
                </div>

                <div className="p-8 bg-bg-main rounded-lg border-2 border-dashed border-primary/50">
                    <p className="text-sm opacity-70 mb-2">{t(currentItem.type === 'surahPart' ? 'revModeSurah' : currentItem.type)}{t('reciteLabel')} :</p>
                    <h1 className="text-4xl font-amiri font-bold text-center">{currentItem.itemName}</h1>
                </div>

                <div>
                    <h3 className="font-semibold mb-4">{t('evaluationQuestion')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {evaluationOptions.map(opt => (
                            <Button
                                key={opt.status}
                                variant={opt.color as any}
                                size="lg"
                                className="flex items-center justify-center gap-2"
                                onClick={() => handleEvaluation(opt.status)}
                            >
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                            </Button>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-4" onClick={() => handleEvaluation('skip')}>{t('skipItem')}</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default ActiveEvaluationScreen;