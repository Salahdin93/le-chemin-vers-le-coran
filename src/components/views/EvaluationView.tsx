import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useStore } from '../../context/AppContext';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { EvaluationPlan, EvaluationStatus, EvaluationItem, RevisionFrequency, EvaluationContentType } from '../../types';
import ActiveEvaluationScreen from '../screens/ActiveEvaluationScreen';
import { MultiSelectGrid } from '../ui/MultiSelectGrid';
import { ToggleSwitch } from '../ui/Checkbox';
import { clsx } from 'clsx';
import { FULL_SURAH_LIST, HIZB_DATA, JUZ_DATA } from '../../constants/quranData';
import { HADITH_COLLECTION } from '../../constants/hadithData';

type PlanFormData = Partial<EvaluationPlan> & { id?: string };

const EvaluationView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);

    const [viewMode, setViewMode] = useState<'tabs' | 'form'>('tabs');
    const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
    const [editingPlan, setEditingPlan] = useState<PlanFormData | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([]);

    const [openBoosters, setOpenBoosters] = useState<Partial<Record<EvaluationContentType, boolean>>>({});

    const contentTypeToTranslationKey: Record<EvaluationContentType, string> = {
        surahPart: 'revModeSurah',
        hizb: 'revModeHizb',
        juzz: 'revModeJuzz',
        hadith: 'hadith',
    };

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

    const handleCreateNew = () => {
        setEditingPlan({
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
        setViewMode('form');
        setOpenBoosters({});
    };

    const handleEdit = (plan: EvaluationPlan) => {
        setEditingPlan({
            ...plan,
            boosterPools: plan.boosterPools || {},
            itemsPerSession: plan.itemsPerSession || { main: 5, boosters: {} }
        });
        setViewMode('form');
        setOpenBoosters({});
    };

    const handleDelete = (planId: string) => {
        if (window.confirm(t('confirmDeletePlan'))) {
            dispatch({ type: 'REMOVE_EVALUATION_PLAN', payload: { id: planId } });
        }
    };

    const handleCancel = () => {
        setViewMode('tabs');
        setEditingPlan(null);
    };

    const handleSave = () => {
        if (!editingPlan || !editingPlan.name) {
            dispatch({ type: 'SET_TOAST', payload: t('errorPlanNameRequired') });
            return;
        }
        if (editingPlan.id) {
            dispatch({ type: 'UPDATE_EVALUATION_PLAN', payload: editingPlan as EvaluationPlan });
        } else {
            const newPlan: EvaluationPlan = { ...editingPlan, id: `eval_${Date.now()}` } as EvaluationPlan;
            dispatch({ type: 'ADD_EVALUATION_PLAN', payload: newPlan });
        }
        dispatch({ type: 'SET_TOAST', payload: t('evaluationPlanSaved') });
        setViewMode('tabs');
        setEditingPlan(null);
    };

    const startEvaluation = (plan: EvaluationPlan) => {
        let sessionItems: EvaluationItem[] = [];
        const createEvaluationItem = (id: string | number, type: EvaluationContentType): EvaluationItem => {
            const sourceItems = fullContentPool[type];
            const item = sourceItems.find(s => s.id == id);
            return { type, itemId: String(id), itemName: item?.name || 'Unknown' };
        };

        const mainItemCount = plan.itemsPerSession?.main || 0;
        if (plan.pool && mainItemCount > 0) {
            const mainPool = [...plan.pool];
            if (plan.order === 'random') mainPool.sort(() => 0.5 - Math.random());
            else if (plan.order === 'descending') mainPool.reverse();
            const mainItemIds = mainPool.slice(0, mainItemCount);
            sessionItems.push(...mainItemIds.map(id => createEvaluationItem(id, plan.mainContentType)));
        }

        if (plan.boosterPools && plan.itemsPerSession?.boosters) {
            for (const key in plan.boosterPools) {
                const boosterType = key as EvaluationContentType;
                const boosterPool = plan.boosterPools[boosterType];
                const boosterItemCount = plan.itemsPerSession.boosters[boosterType] || 0;

                if (boosterPool && boosterPool.length > 0 && boosterItemCount > 0) {
                    const shuffledBoosterPool = [...boosterPool].sort(() => 0.5 - Math.random());
                    const boosterItemIds = shuffledBoosterPool.slice(0, boosterItemCount);
                    sessionItems.push(...boosterItemIds.map(id => createEvaluationItem(id, boosterType)));
                }
            }
        }

        if (sessionItems.length === 0) {
            dispatch({ type: 'SET_TOAST', payload: t('noItemsToEvaluate') });
            return;
        }

        sessionItems.sort(() => 0.5 - Math.random());
        setEvaluationItems(sessionItems);
        setIsEvaluating(true);
    };

    const handleFinishEvaluation = (results: (EvaluationItem & { result: EvaluationStatus })[]) => {
        if (results.length > 0) dispatch({ type: 'SAVE_EVALUATION_RESULTS', payload: results });
        setIsEvaluating(false);
        setEvaluationItems([]);
    };

    if (isEvaluating) {
        return <ActiveEvaluationScreen items={evaluationItems} onFinish={handleFinishEvaluation} />;
    }

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
                            <p className="text-sm text-muted-foreground">{t(contentTypeToTranslationKey[plan.mainContentType])} | {plan.pool.length} {t('itemsInPool')}</p>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Button onClick={() => startEvaluation(plan)} className="flex-1">{t('launch')}</Button>
                            <Button onClick={() => handleEdit(plan)} variant="secondary">{t('edit')}</Button>
                            <Button onClick={() => handleDelete(plan.id)} variant="danger">{t('delete')}</Button>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-10 px-4 border-2 border-dashed border-border rounded-lg">
                    <p className="opacity-70">{t('noEvaluationPlans')}</p>
                    <Button onClick={handleCreateNew} className="mt-4">{t('createNewPlan')}</Button>
                </div>
            )}
        </div>
    );

    const renderHistoryList = () => {
        const statusClasses: Record<EvaluationStatus, string> = { excellent: "bg-green-100 text-green-800", bon: "bg-blue-100 text-blue-800", moyen: "bg-yellow-100 text-yellow-800", a_revoir: "bg-red-100 text-red-800" };
        return (
            <div className="space-y-4">
                {activeProfile?.evaluationHistory && activeProfile.evaluationHistory.length > 0 ? (
                    activeProfile.evaluationHistory.map(record => (
                        <div key={record.id} className="p-3 bg-card rounded-lg border-l-4 border-primary">
                            <p className="font-bold text-lg">{new Date(record.date).toLocaleString(state.settings.lang)}</p>
                            <div className="mt-2 space-y-1">
                                {record.items.map(item => (<div key={item.itemId} className="flex justify-between items-center text-sm"><span>{item.itemName}</span><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusClasses[item.result]}`}>{t(item.result)}</span></div>))}
                            </div>
                        </div>
                    ))
                ) : (<p className="text-center opacity-70 py-8">{t('noEvaluationHistory')}</p>)}
            </div>
        );
    };

    const renderPlanForm = () => {
        if (!editingPlan) return null;

        const updateField = (field: keyof PlanFormData, value: any) => {
            const newState = { ...editingPlan, [field]: value };
            if (field === 'mainContentType') newState.pool = [];
            setEditingPlan(newState);
        };

        const updateItemsPerSession = (type: 'main' | EvaluationContentType, value: number) => {
            setEditingPlan(prev => ({
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
            setEditingPlan(prev => ({ ...prev!, boosterPools: { ...prev!.boosterPools, [type]: ids } }));
        };

        const toggleBooster = (boosterType: EvaluationContentType) => {
            setOpenBoosters(prev => ({ ...prev, [boosterType]: !prev[boosterType] }));
        };

        const updateFreq = (freq: Partial<RevisionFrequency>) => {
            updateField('frequency', { ...editingPlan.frequency!, ...freq });
        };

        const boosterTypes = contentTypeOptions.filter(opt => opt.value !== editingPlan.mainContentType);

        return (
            <div className="space-y-8">
                <h2 className="text-xl font-bold">{editingPlan.id ? `${t('editPlan')} : ${editingPlan.name}` : t('createNewPlan')}</h2>

                <section>
                    <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">{t('generalInfo')}</h3>
                    <div className="space-y-4">
                        <Input label={t('planName')} value={editingPlan.name} onChange={e => updateField('name', e.target.value)} placeholder={t('planNamePlaceholder')} />
                        <Select label={t('mainContentType')} value={editingPlan.mainContentType} onChange={e => updateField('mainContentType', e.target.value as EvaluationContentType)}>
                            {contentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </Select>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">{t('elementSelection')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 font-semibold">{t('selectMainItems')}</label>
                            <MultiSelectGrid items={fullContentPool[editingPlan.mainContentType!]} selectedItems={editingPlan.pool || []} onChange={(ids) => updateField('pool', ids)} />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">{t('addBoosterItems')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {boosterTypes.map(booster => (
                                    <Button key={booster.value} variant={openBoosters[booster.value] ? 'primary' : 'secondary'} onClick={() => toggleBooster(booster.value)}>
                                        {t('add')} {booster.label}
                                    </Button>
                                ))}
                            </div>
                            {boosterTypes.map(booster => openBoosters[booster.value] && (
                                <div key={`booster-grid-${booster.value}`} className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                                    <h5 className="font-semibold mb-2">{`${t('select')} ${booster.label}`}</h5>
                                    <MultiSelectGrid items={fullContentPool[booster.value]} selectedItems={editingPlan.boosterPools?.[booster.value] || []} onChange={(ids) => updateBoosterPool(booster.value, ids)} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">{t('sessionSettings')}</h3>
                    <div className="space-y-4">
                        <Input label={`${t('itemsPerSessionLabel')} (${t(contentTypeToTranslationKey[editingPlan.mainContentType!])})`} type="number" min="1" value={editingPlan.itemsPerSession?.main || 1} onChange={e => updateItemsPerSession('main', parseInt(e.target.value) || 1)} />
                        {boosterTypes.map(booster => openBoosters[booster.value] && (
                            <Input key={`booster-count-${booster.value}`} label={`${t('boosterItemsPerSession')} (${booster.label})`} type="number" min="0" value={editingPlan.itemsPerSession?.boosters?.[booster.value] || 0} onChange={e => updateItemsPerSession(booster.value, parseInt(e.target.value) || 0)} />
                        ))}
                        <Select label={t('elementOrder')} value={editingPlan.order} onChange={e => updateField('order', e.target.value as 'random' | 'ascending' | 'descending')}>
                            <option value="random">{t('orderRandom')}</option>
                            <option value="ascending">{t('orderAscending')}</option>
                            <option value="descending">{t('orderDescending')}</option>
                        </Select>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">{t('scheduling')}</h3>
                    <ToggleSwitch label={t('enableScheduledEvaluation')} checked={!!editingPlan.isScheduled} onChange={(e) => updateField('isScheduled', e.target.checked)} />
                    <div className={clsx(!editingPlan.isScheduled && "opacity-50 pointer-events-none", "space-y-4 mt-4")}>
                        <Input label={t('planDurationInDays')} type="number" min="1" value={editingPlan.duration} onChange={e => updateField('duration', parseInt(e.target.value) || 1)} />
                        <div>
                            <label className="font-semibold block mb-2">{t('evaluationFrequency')} </label>
                            <div className="flex gap-2 flex-wrap">
                                <Button size='sm' variant={editingPlan.frequency?.type === 'daily' ? 'primary' : 'secondary'} onClick={() => updateFreq({ type: 'daily' })}>{t('freqDaily')}</Button>
                                <Button size='sm' variant={editingPlan.frequency?.type === 'weekly' ? 'primary' : 'secondary'} onClick={() => updateFreq({ type: 'weekly' })}>{t('freqWeekly')}</Button>
                                <Button size='sm' variant={editingPlan.frequency?.type === 'custom' ? 'primary' : 'secondary'} onClick={() => updateFreq({ type: 'custom' })}>{t('freqCustom')}</Button>
                            </div>
                            {editingPlan.frequency?.type === 'weekly' && <Select className="mt-2" value={editingPlan.frequency.value as number} onChange={e => updateFreq({ value: parseInt(e.target.value) })}>{JSON.parse(t('dayOfWeek')).map((day: string, i: number) => <option key={i} value={i}>{day}</option>)}</Select>}
                            {editingPlan.frequency?.type === 'custom' && <Input className="mt-2" type='number' min={2} value={(editingPlan.frequency.value as number) > 1 ? (editingPlan.frequency.value as number) : 2} onChange={e => updateFreq({ value: parseInt(e.target.value) })} placeholder={t('everyXDays', { count: 'X' })} />}
                        </div>
                    </div>
                </section>

                <div className="flex gap-4 pt-4 border-t border-border">
                    <Button onClick={handleSave} className="flex-1">{t('savePlan')}</Button>
                    <Button onClick={handleCancel} variant="secondary">{t('cancel')}</Button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4">
            {viewMode === 'form' ? (
                renderPlanForm()
            ) : (
                <div className="space-y-4">
                    <div className="flex border-b border-border">
                        <button onClick={() => setActiveTab('plans')} className={clsx("px-4 py-2 font-semibold transition-colors", activeTab === 'plans' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>{t('myEvaluationPlans')}</button>
                        <button onClick={() => setActiveTab('history')} className={clsx("px-4 py-2 font-semibold transition-colors", activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>{t('history')}</button>
                    </div>
                    <div className="py-4">
                        {activeTab === 'plans' ? renderPlanList() : renderHistoryList()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EvaluationView;