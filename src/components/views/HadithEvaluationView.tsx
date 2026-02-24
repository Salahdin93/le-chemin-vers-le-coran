import React from 'react';
import { useStore } from '../../context/AppContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';

const HadithEvaluationView: React.FC = () => {
    const { dispatch, t } = useStore();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('hadithEvaluation')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="mb-4">{t('comingSoon')}</p>
                <Button onClick={() => dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'hadith-plan-view' })}>
                    {t('backToMenu')}
                </Button>
            </CardContent>
        </Card>
    );
};
export default HadithEvaluationView;