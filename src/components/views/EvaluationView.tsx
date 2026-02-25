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

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

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
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black uppercase tracking-widest opacity-40">{t('myEvaluationPlans')}</h2>
                <Button variant="accent" size="sm" className="rounded-full px-6" onClick={handleCreateNew}>+ {t('createNewPlan')}</Button>
            </div>
            {activeProfile?.evaluationPlans && activeProfile.evaluationPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProfile.evaluationPlans.map(plan => (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-6 flex flex-col group transition-all hover-glow">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                                    <p className="text-[10px] font-bold text-accent-color uppercase tracking-widest">{t(contentTypeToTranslationKey[plan.mainContentType])} • {plan.pool.length} pool</p>
                                </div>
                                <div className="p-3 rounded-xl bg-accent-color/5 text-accent-color">
                                    <Trophy size={20} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-auto">
                                <Button onClick={() => startEvaluation(plan)} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-accent-color/20">{t('launch')}</Button>
                                <Button onClick={() => handleEdit(plan)} variant="secondary" className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center">
                                    <Edit size={18} />
                                </Button>
                                <Button onClick={() => handleDelete(plan.id)} variant="secondary" className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center hover:bg-danger/10 hover:text-danger border-none transition-colors">
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="p-16 text-center glass-card border-none bg-bg-main/30 rounded-[3rem]">
                    <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Sparkles size={32} className="text-text-main/10" />
                    </div>
                    <p className="text-sm font-bold opacity-30 max-w-sm mx-auto mb-8">{t('noEvaluationPlans')}</p>
                    <Button variant="accent" onClick={handleCreateNew} className="rounded-full px-10 h-14 uppercase font-black tracking-widest shadow-premium">{t('createNewPlan')}</Button>
                </div>
            )}
        </div>
    );

    const renderHistoryList = () => {
        const resultColors: Record<EvaluationStatus, string> = {
            excellent: "text-green-500 bg-green-500/10",
            bon: "text-blue-500 bg-blue-500/10",
            moyen: "text-warning bg-warning/10",
            a_revoir: "text-danger bg-danger/10"
        };
        return (
            <div className="space-y-4 max-w-3xl mx-auto">
                {activeProfile?.evaluationHistory && activeProfile.evaluationHistory.length > 0 ? (
                    activeProfile.evaluationHistory.map((record, index) => (
                        <motion.div key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="premium-card p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-main/50">
                                <div>
                                    <p className="text-sm font-black">{new Date(record.date).toLocaleDateString(state.settings.lang, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{new Date(record.date).toLocaleTimeString(state.settings.lang, { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-xs font-black opacity-30">#{activeProfile.evaluationHistory.length - index}</div>
                            </div>
                            <div className="space-y-3">
                                {record.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-bg-secondary/50 border border-border-main/30">
                                        <span className="text-sm font-bold">{item.itemName}</span>
                                        <span className={clsx("px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg", resultColors[item.result])}>
                                            {t(item.result)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-16 text-center glass-card border-none bg-bg-main/30 rounded-[3rem]">
                        <p className="text-sm font-bold opacity-30">{t('noEvaluationHistory')}</p>
                    </div>
                )}
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-12 pb-32">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border-main">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gradient">{editingPlan.id ? `${t('editPlan')}` : t('createNewPlan')}</h2>
                        <p className="text-text-secondary font-medium mt-1">{editingPlan.name || 'Définissez vos paramètres de réussite.'}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleCancel} className="rounded-full px-8 h-12 uppercase text-[10px] font-black tracking-widest">{t('cancel')}</Button>
                        <Button variant="accent" onClick={handleSave} className="rounded-full px-10 h-12 uppercase text-[10px] font-black tracking-widest shadow-lg shadow-accent-color/20">{t('savePlan')}</Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-12">
                        <section className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-3">
                                <span className="w-10 h-px bg-border-main" /> {t('generalInfo')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label={t('planName')} value={editingPlan.name} onChange={e => updateField('name', e.target.value)} placeholder={t('planNamePlaceholder')} className="h-14 rounded-2xl bg-bg-secondary/50" />
                                <Select label={t('mainContentType')} value={editingPlan.mainContentType} onChange={e => updateField('mainContentType', e.target.value as EvaluationContentType)} className="h-14 rounded-2xl bg-bg-secondary/50">
                                    {contentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </Select>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-3">
                                <span className="w-10 h-px bg-border-main" /> {t('elementSelection')}
                            </h3>
                            <div className="space-y-8">
                                <div className="p-1 rounded-[2.5rem] bg-bg-secondary/30 border border-border-main/50 overflow-hidden">
                                    <div className="p-6 border-b border-border-main/50 bg-bg-secondary/50">
                                        <label className="text-xs font-black uppercase tracking-widest opacity-60 mb-2 block">{t('selectMainItems')}</label>
                                    </div>
                                    <div className="p-6 max-h-[400px] overflow-y-auto no-scrollbar">
                                        <MultiSelectGrid items={fullContentPool[editingPlan.mainContentType!]} selectedItems={editingPlan.pool || []} onChange={(ids) => updateField('pool', ids)} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black uppercase tracking-tight">{t('addBoosterItems')}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {boosterTypes.map(booster => (
                                                <button
                                                    key={booster.value}
                                                    onClick={() => toggleBooster(booster.value)}
                                                    className={clsx(
                                                        "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                        openBoosters[booster.value] ? "bg-accent-color text-white" : "bg-bg-secondary text-text-main/40 hover:text-text-main"
                                                    )}
                                                >
                                                    {booster.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {boosterTypes.map(booster => openBoosters[booster.value] && (
                                            <motion.div key={`booster-grid-${booster.value}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                                <div className="p-8 rounded-[2.5rem] bg-accent-color/[0.02] border border-accent-color/10 space-y-4">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-accent-color">{`${t('select')} ${booster.label}`}</h5>
                                                    <MultiSelectGrid items={fullContentPool[booster.value]} selectedItems={editingPlan.boosterPools?.[booster.value] || []} onChange={(ids) => updateBoosterPool(booster.value, ids)} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-10">
                        <section className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-3">
                                <span className="w-10 h-px bg-border-main" /> {t('sessionSettings')}
                            </h3>
                            <div className="p-8 rounded-[2.5rem] bg-bg-secondary/50 border border-border-main/50 space-y-8">
                                <Input
                                    label={`${t('itemsPerSessionLabel')} (${t(contentTypeToTranslationKey[editingPlan.mainContentType!])})`}
                                    type="number" min="1"
                                    value={editingPlan.itemsPerSession?.main || 1}
                                    onChange={e => updateItemsPerSession('main', parseInt(e.target.value) || 1)}
                                    className="h-12 bg-bg-main"
                                />
                                {boosterTypes.map(booster => openBoosters[booster.value] && (
                                    <Input
                                        key={`booster-count-${booster.value}`}
                                        label={`${t('boosterItemsPerSession')} (${booster.label})`}
                                        type="number" min="0"
                                        value={editingPlan.itemsPerSession?.boosters?.[booster.value] || 0}
                                        onChange={e => updateItemsPerSession(booster.value, parseInt(e.target.value) || 0)}
                                        className="h-12 bg-bg-main"
                                    />
                                ))}
                                <Select label={t('elementOrder')} value={editingPlan.order} onChange={e => updateField('order', e.target.value as 'random' | 'ascending' | 'descending')} className="h-12 bg-bg-main">
                                    <option value="random">{t('orderRandom')}</option>
                                    <option value="ascending">{t('orderAscending')}</option>
                                    <option value="descending">{t('orderDescending')}</option>
                                </Select>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-3">
                                <span className="w-10 h-px bg-border-main" /> {t('scheduling')}
                            </h3>
                            <div className="p-8 rounded-[2.5rem] bg-bg-secondary/50 border border-border-main/50 space-y-8">
                                <ToggleSwitch label={t('enableScheduledEvaluation')} checked={!!editingPlan.isScheduled} onChange={(e) => updateField('isScheduled', e.target.checked)} />

                                <AnimatePresence>
                                    {editingPlan.isScheduled && (
                                        <motion.div initial={{ opacity: 0, opacity: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-8 pt-4 border-t border-border-main/50 overflow-hidden">
                                            <Input label={t('planDurationInDays')} type="number" min="1" value={editingPlan.duration} onChange={e => updateField('duration', parseInt(e.target.value) || 1)} className="h-12 bg-bg-main" />
                                            <div className="space-y-4">
                                                <label className="text-xs font-black uppercase tracking-widest opacity-60 block">{t('evaluationFrequency')} </label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button onClick={() => updateFreq({ type: 'daily' })} className={clsx("h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", editingPlan.frequency?.type === 'daily' ? "bg-accent-color text-white shadow-lg" : "bg-bg-main text-text-main/40")}>{t('freqDaily')}</button>
                                                    <button onClick={() => updateFreq({ type: 'weekly' })} className={clsx("h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", editingPlan.frequency?.type === 'weekly' ? "bg-accent-color text-white shadow-lg" : "bg-bg-main text-text-main/40")}>{t('freqWeekly')}</button>
                                                    <button onClick={() => updateFreq({ type: 'custom' })} className={clsx("h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", editingPlan.frequency?.type === 'custom' ? "bg-accent-color text-white shadow-lg" : "bg-bg-main text-text-main/40")}>{t('freqCustom')}</button>
                                                </div>
                                                {editingPlan.frequency?.type === 'weekly' && (
                                                    <Select className="h-12 bg-bg-main rounded-xl mt-2" value={editingPlan.frequency.value as number} onChange={e => updateFreq({ value: parseInt(e.target.value) })}>
                                                        {JSON.parse(t('dayOfWeek')).map((day: string, i: number) => <option key={i} value={i}>{day}</option>)}
                                                    </Select>
                                                )}
                                                {editingPlan.frequency?.type === 'custom' && (
                                                    <Input className="h-12 bg-bg-main rounded-xl mt-2" type='number' min={2} value={(editingPlan.frequency.value as number) > 1 ? (editingPlan.frequency.value as number) : 2} onChange={e => updateFreq({ value: parseInt(e.target.value) })} placeholder={t('everyXDays', { count: 'X' })} />
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8 md:space-y-12 pb-32 px-2 md:px-0">
            {viewMode !== 'form' && (
                <header className="pb-8 border-b border-border-main flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-gradient mb-2">{t('evaluationTitle') || 'Auto-Évaluation'}</h1>
                        <p className="text-text-secondary font-medium text-sm md:text-base">{t('evaluationSubtitle') || 'Mettez votre mémorisation à l\'épreuve pour une maîtrise parfaite.'}</p>
                    </div>
                </header>
            )}

            {viewMode === 'form' ? (
                renderPlanForm()
            ) : (
                <div className="space-y-10">
                    <Tabs defaultValue="plans" className="w-full" onValueChange={(val) => setActiveTab(val as any)}>
                        <TabsList className="flex items-center gap-1 p-1 bg-bg-secondary/50 backdrop-blur-md rounded-2xl border border-border-main/50 mb-10 w-fit">
                            <TabsTrigger value="plans" className="px-8 h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('myEvaluationPlans')}</TabsTrigger>
                            <TabsTrigger value="history" className="px-8 h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('history')}</TabsTrigger>
                        </TabsList>

                        <AnimatePresence mode="wait">
                            <TabsContent value="plans" className="outline-none">
                                {renderPlanList()}
                            </TabsContent>
                            <TabsContent value="history" className="outline-none">
                                {renderHistoryList()}
                            </TabsContent>
                        </AnimatePresence>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

export default EvaluationView;
