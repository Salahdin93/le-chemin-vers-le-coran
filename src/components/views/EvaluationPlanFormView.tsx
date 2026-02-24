import React, { useState, useMemo, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { EvaluationPlan, RevisionFrequency, EvaluationContentType } from '@/types';
import { MultiSelectGrid } from '@/components/ui/MultiSelectGrid';
import { ToggleSwitch } from '@/components/ui/Checkbox';
import { clsx } from 'clsx';
import { FULL_SURAH_LIST, HIZB_DATA, JUZ_DATA } from '@/constants/quranData';
import { HADITH_COLLECTION } from '@/constants/hadithdata';

type PlanFormData = Partial<EvaluationPlan> & { id?: string | null };

const EvaluationPlanFormView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const { activeProfile, editingEvaluationPlanId } = state;
    
    const [formData, setFormData] = useState<PlanFormData>({});
    const [openBoosters, setOpenBoosters] = useState<Partial<Record<EvaluationContentType, boolean>>>({});

    useEffect(() => {
        const planToEdit = activeProfile?.evaluationPlans.find(p => p.id === editingEvaluationPlanId);
        if (planToEdit) {
            setFormData({ 
                ...planToEdit, 
                boosterPools: planToEdit.boosterPools || {},
                itemsPerSession: planToEdit.itemsPerSession || { main: 5, boosters: {} } 
            });
            const activeBoosters = Object.keys(planToEdit.boosterPools || {}).reduce((acc, key) => {
                acc[key as EvaluationContentType] = true;
                return acc;
            }, {} as Record<EvaluationContentType, boolean>);
            setOpenBoosters(activeBoosters);
        } else {
            setFormData({ 
                name: '', 
                mainContentType: 'surahPart', 
                order: 'random', 
                itemsPerSession: { main: 5, boosters: {} },
                isScheduled: false, 
                frequency: { type: 'daily', value: 1 }, 
                duration: 30, 
                pool: [], 
                boosterPools: {} 
            });
            setOpenBoosters({});
        }
    }, [editingEvaluationPlanId, activeProfile?.evaluationPlans]);

    const fullContentPool = useMemo(() => ({
        surahPart: FULL_SURAH_LIST.map(s => ({ id: s.id, name: s.name })),
        hizb: HIZB_DATA.map(h => ({ id: parseInt(h.name, 10), name: `${t('hizb')} ${h.name} : ${h.details}` })),
        juzz: JUZ_DATA.map(j => ({ id: j.id, name: `${t('juzz')} ${j.id}` })),
        hadith: HADITH_COLLECTION.map(h => ({ id: h.id, name: `${t('hadith')} ${h.id}` })),
    }), [t]);

    const contentTypeOptions: { value: EvaluationContentType, label: string }[] = [
        { value: 'surahPart', label: t('revModeSurah') },
        { value: 'hizb', label: t('revModeHizb') },
        { value: 'juzz', label: t('revModeJuzz') },
        { value: 'hadith', label: t('hadith') },
    ];
    
    const handleSave = () => {
        if (!formData || !formData.name) {
            dispatch({ type: 'SET_TOAST', payload: t('errorPlanNameRequired') });
            return;
        }
        if (formData.id) {
            dispatch({ type: 'UPDATE_EVALUATION_PLAN', payload: formData as EvaluationPlan });
        } else {
            const newPlan: EvaluationPlan = { ...formData, id: `eval_${Date.now()}` } as EvaluationPlan;
            dispatch({ type: 'ADD_EVALUATION_PLAN', payload: newPlan });
        }
        dispatch({ type: 'SET_TOAST', payload: t('evaluationPlanSaved') });
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-plans-view'});
    };
    
    const handleCancel = () => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'evaluation-plans-view'});
    }

    if (!formData.mainContentType) return <div>{t('loading')}</div>;

    const updateField = (field: keyof PlanFormData, value: any) => {
        const newState = { ...formData, [field]: value };
        if (field === 'mainContentType') newState.pool = [];
        setFormData(newState);
    };
    
    const updateItemsPerSession = (type: 'main' | EvaluationContentType, value: number) => {
        setFormData(prev => ({
            ...prev!,
            itemsPerSession: {
                main: type === 'main' ? value : prev!.itemsPerSession!.main,
                boosters: {
                    ...prev!.itemsPerSession!.boosters,
                    ...(type !== 'main' && { [type]: value })
                }
            }
        }));
    };

    const updateBoosterPool = (type: EvaluationContentType, ids: (string | number)[]) => {
        setFormData(prev => ({ ...prev!, boosterPools: { ...prev!.boosterPools, [type]: ids } }));
    };
    
    const toggleBooster = (boosterType: EvaluationContentType) => {
        setOpenBoosters(prev => ({ ...prev, [boosterType]: !prev[boosterType] }));
    };
    
    const updateFreq = (freq: Partial<RevisionFrequency>) => {
        updateField('frequency', { ...formData.frequency!, ...freq });
    };

    const boosterTypes = contentTypeOptions.filter(opt => opt.value !== formData.mainContentType);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{editingEvaluationPlanId ? `${t('editPlan')}` : t('createNewPlan')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                 <section>
                    <h3 className="text-lg font-semibold border-b border-border-main pb-2 mb-4">{t('generalInfo')}</h3>
                    <div className="space-y-4">
                        <Input label={t('planName')} value={formData.name} onChange={e => updateField('name', e.target.value)} placeholder={t('planNamePlaceholder')} />
                        <Select label={t('mainContentType')} value={formData.mainContentType} onChange={e => updateField('mainContentType', e.target.value as EvaluationContentType)}>
                            {contentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold border-b border-border-main pb-2 mb-4">{t('elementSelection')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 font-semibold">{t('selectMainItems')}</label>
                            <MultiSelectGrid items={fullContentPool[formData.mainContentType!]} selectedItems={formData.pool || []} onChange={(ids) => updateField('pool', ids)} />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">{t('addBoosterItems')}</h4>
                             <p className="text-sm text-text-main/70 mb-3">{t('boosterDescription')}</p>
                            <div className="flex flex-wrap gap-2">
                                {boosterTypes.map(booster => (
                                    <Button key={booster.value} variant={openBoosters[booster.value] ? 'primary' : 'secondary'} onClick={() => toggleBooster(booster.value)}>
                                        {t('add')} {booster.label}
                                    </Button>
                                ))}
                            </div>
                            {boosterTypes.map(booster => openBoosters[booster.value] && (
                                <div key={`booster-grid-${booster.value}`} className="mt-4 p-4 border border-border-main rounded-lg bg-bg-main">
                                    <h5 className="font-semibold mb-2">{`${t('select')} ${booster.label}`}</h5>
                                    <MultiSelectGrid items={fullContentPool[booster.value]} selectedItems={formData.boosterPools?.[booster.value] || []} onChange={(ids) => updateBoosterPool(booster.value, ids)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold border-b border-border-main pb-2 mb-4">{t('sessionSettings')}</h3>
                    <div className="space-y-4">
                        <Input label={`${t('itemsPerSessionLabel')} (${t(contentTypeOptions.find(opt => opt.value === formData.mainContentType)!.label)})`} type="number" min="1" value={formData.itemsPerSession?.main || 1} onChange={e => updateItemsPerSession('main', parseInt(e.target.value) || 1)} />
                        {boosterTypes.map(booster => openBoosters[booster.value] && (
                            <Input key={`booster-count-${booster.value}`} label={`${t('boosterItemsPerSession')} (${booster.label})`} type="number" min="0" value={formData.itemsPerSession?.boosters?.[booster.value] || 0} onChange={e => updateItemsPerSession(booster.value, parseInt(e.target.value) || 0)} />
                        ))}
                        <Select label={t('elementOrder')} value={formData.order} onChange={e => updateField('order', e.target.value as 'random' | 'ascending' | 'descending')}>
                            <option value="random">{t('orderRandom')}</option>
                            <option value="ascending">{t('orderAscending')}</option>
                            <option value="descending">{t('orderDescending')}</option>
                        </Select>
                    </div>
                </section>

                <div className="flex gap-4 pt-4 border-t border-dashed border-border-main">
                    <Button onClick={handleSave} className="flex-1">{t('savePlan')}</Button>
                    <Button onClick={handleCancel} variant="ghost">{t('cancel')}</Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default EvaluationPlanFormView;