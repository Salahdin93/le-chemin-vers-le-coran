import React, { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import { EvaluationPlan, EvaluationStatus, EvaluationContentType } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EvaluationPlansView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const { activeProfile } = state;
    const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');

    const contentTypeToTranslationKey: Record<EvaluationContentType, string> = {
        surahPart: 'revModeSurah',
        hizb: 'revModeHizb',
        juzz: 'revModeJuzz',
        hadith: 'hadith',
    };

    const handleCreateNew = () => {
        dispatch({ type: 'SET_EDITING_EVALUATION_PLAN_ID', payload: null });
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-plan-form-view' });
    };

    const handleEdit = (plan: EvaluationPlan) => { 
        dispatch({ type: 'SET_EDITING_EVALUATION_PLAN_ID', payload: plan.id });
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-plan-form-view' });
    };

    const handleDelete = (planId: string) => { 
        if (window.confirm(t('confirmDeletePlan'))) {
            dispatch({ type: 'REMOVE_EVALUATION_PLAN', payload: { id: planId } });
        }
    };
    
    const handleLaunch = (plan: EvaluationPlan) => {
        dispatch({ type: 'SET_ACTIVE_EVALUATION_PLAN', payload: plan });
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-view' });
    };

    const renderPlanList = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{t('myEvaluationPlans')}</h2>
                <Button onClick={handleCreateNew}>{t('createNewPlan')}</Button>
            </div>
            {activeProfile?.evaluationPlans && activeProfile.evaluationPlans.length > 0 ? (
                activeProfile.evaluationPlans.map(plan => (
                    <Card key={plan.id}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <p className="text-sm text-text-main/70">{t(contentTypeToTranslationKey[plan.mainContentType])} | {plan.pool.length} {t('itemsInPool')}</p>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Button onClick={() => handleLaunch(plan)} className="flex-1">{t('launch')}</Button>
                            <Button onClick={() => handleEdit(plan)} variant="secondary">{t('edit')}</Button>
                            <Button onClick={() => handleDelete(plan.id)} variant="danger">{t('delete')}</Button>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-10 px-4 border-2 border-dashed border-border-main rounded-lg">
                    <p className="opacity-70">{t('noEvaluationPlans')}</p>
                    <Button onClick={handleCreateNew} className="mt-4">{t('createNewPlan')}</Button>
                </div>
            )}
        </div>
    );

    const renderHistoryList = () => {
        const statusClasses: Record<EvaluationStatus, string> = { excellent: "bg-green-100 text-green-800", bon: "bg-blue-100 text-blue-800", moyen: "bg-yellow-100 text-yellow-800", a_revoir: "bg-red-100 text-red-800" };
        const history = activeProfile?.evaluationHistory || [];
        return (
            <div className="space-y-4">
                 <h2 className="text-xl font-bold mb-4">{t('evaluationHistory', 'Historique des Évaluations')}</h2>
                {history.length > 0 ? (
                    history.map(record => (
                        <div key={record.id} className="p-4 bg-bg-secondary rounded-lg border-l-4 border-primary">
                            <p className="font-bold text-lg">{new Date(record.date).toLocaleString(state.settings.lang)}</p>
                            <div className="mt-2 space-y-1">
                                {record.items.map(item => (<div key={item.itemId + item.type} className="flex justify-between items-center text-sm"><span>{item.itemName}</span><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusClasses[item.result]}`}>{t(item.result)}</span></div>))}
                            </div>
                        </div>
                    ))
                ) : (<p className="text-center opacity-70 py-8">{t('noEvaluationHistory')}</p>)}
            </div>
        );
    };

    return (
        <div className="p-4">
             <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'plans' | 'history')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="plans">{t('myEvaluationPlans')}</TabsTrigger>
                    <TabsTrigger value="history">{t('history')}</TabsTrigger>
                </TabsList>
                <TabsContent value="plans" className="py-4">
                    {renderPlanList()}
                </TabsContent>
                <TabsContent value="history" className="py-4">
                    {renderHistoryList()}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default EvaluationPlansView;