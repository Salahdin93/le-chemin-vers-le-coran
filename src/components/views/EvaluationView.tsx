import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/AppContext';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { EvaluationPlan, EvaluationStatus, EvaluationItem, EvaluationContentType } from '../../types';
import ActiveEvaluationScreen from '../screens/ActiveEvaluationScreen';
import { MultiSelectGrid } from '../ui/MultiSelectGrid';
import { ToggleSwitch } from '../ui/Checkbox';
import { clsx } from 'clsx';
import { FULL_SURAH_LIST, HIZB_DATA, JUZ_DATA } from '../../constants/quranData';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Sparkles, Edit, Trash2, Play, History,
    Plus, LayoutGrid, Brain, Info, Activity, Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ConfirmModal from '../ui/ConfirmModal';

type PlanFormData = Partial<EvaluationPlan> & { id?: string };

const EvaluationView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const activeProfile = state.profiles.find(p => p.id === state.activeProfileId);

    const memorizedSurahIds = useMemo(() => {
        if (!activeProfile?.memorizations?.surahParts?.length) return new Set<number>();
        return new Set(activeProfile.memorizations.surahParts.map(p => {
            const idStr = String((p as { id?: string }).id ?? '');
            const num = parseInt(idStr.split('-')[0], 10);
            return isNaN(num) ? parseInt(idStr, 10) : num;
        }).filter(Boolean));
    }, [activeProfile?.memorizations?.surahParts]);
    const memorizedHizbNames = useMemo(() =>
        new Set((activeProfile?.memorizations?.hizbs ?? []).map(h => h.number)),
        [activeProfile?.memorizations?.hizbs]);
    const memorizedJuzzIds = useMemo(() =>
        new Set((activeProfile?.memorizations?.juzz ?? []).map(j => j.number)),
        [activeProfile?.memorizations?.juzz]);
    const memorizedHadithIds = useMemo(() => {
        const hp = activeProfile?.hadithProgress ?? {};
        return new Set(Object.entries(hp).filter(([, status]) => status === 'acquis' || status === 'en_memorisation').map(([id]) => Number(id)));
    }, [activeProfile?.hadithProgress]);

    const [viewMode, setViewMode] = useState<'tabs' | 'form'>('tabs');
    const [, setActiveTab] = useState<'plans' | 'history'>('plans');
    const [editingPlan, setEditingPlan] = useState<PlanFormData | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationItems, setEvaluationItems] = useState<EvaluationItem[]>([]);
    const [openBoosters, setOpenBoosters] = useState<Partial<Record<EvaluationContentType, boolean>>>({});
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);

    const contentTypeToTranslationKey: Record<EvaluationContentType, string> = {
        surahPart: 'revModeSurah',
        hizb: 'revModeHizb',
        juzz: 'revModeJuzz',
        hadith: 'hadith',
    };

    const fullContentPool = useMemo(() => ({
        surahPart: FULL_SURAH_LIST.filter(s => memorizedSurahIds.has(s.id)).map(s => ({ id: s.id, name: s.name })),
        hizb: HIZB_DATA.filter(h => memorizedHizbNames.has(h.name)).map(h => ({ id: parseInt(h.name, 10), name: `${t('hizb')} ${h.name} : ${h.details}` })),
        juzz: JUZ_DATA.filter(j => memorizedJuzzIds.has(j.id)).map(j => ({ id: j.id, name: `${t('juzz')} ${j.id}` })),
        hadith: HADITH_COLLECTION.filter(h => memorizedHadithIds.has(h.id)).map(h => ({ id: h.id, name: `${t('hadith')} ${h.id}` })),
    }), [t, memorizedSurahIds, memorizedHizbNames, memorizedJuzzIds, memorizedHadithIds]);

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
        setEditingPlan({ ...plan, boosterPools: plan.boosterPools || {}, itemsPerSession: plan.itemsPerSession || { main: 5, boosters: {} } });
        setViewMode('form');
        setOpenBoosters({});
    };

    const handleDelete = (planId: string) => {
        setPlanToDelete(planId);
    };

    const confirmDelete = () => {
        if (planToDelete) {
            dispatch({ type: 'REMOVE_EVALUATION_PLAN', payload: { id: planToDelete } });
            setPlanToDelete(null);
        }
    };

    const handleSave = () => {
        if (!editingPlan || !editingPlan.name) {
            dispatch({ type: 'SET_TOAST', payload: t('errorPlanNameRequired') });
            return;
        }
        if (editingPlan.id) dispatch({ type: 'UPDATE_EVALUATION_PLAN', payload: editingPlan as EvaluationPlan });
        else dispatch({ type: 'ADD_EVALUATION_PLAN', payload: { ...editingPlan, id: `eval_${Date.now()}` } as EvaluationPlan });

        dispatch({ type: 'SET_TOAST', payload: t('evaluationPlanSaved') });
        setViewMode('tabs');
        setEditingPlan(null);
    };

    const startEvaluation = (plan: EvaluationPlan) => {
        let sessionItems: EvaluationItem[] = [];
        const createEvaluationItem = (id: string | number, type: EvaluationContentType): EvaluationItem => {
            const item = fullContentPool[type].find(s => s.id == id);
            return { type, itemId: String(id), itemName: item?.name || 'Unknown' };
        };

        const mainItemCount = plan.itemsPerSession?.main || 0;
        if (plan.pool && mainItemCount > 0) {
            const mainPool = [...plan.pool];
            if (plan.order === 'random') mainPool.sort(() => 0.5 - Math.random());
            else if (plan.order === 'descending') mainPool.reverse();
            sessionItems.push(...mainPool.slice(0, mainItemCount).map(id => createEvaluationItem(id, plan.mainContentType)));
        }

        if (plan.boosterPools) {
            Object.entries(plan.boosterPools).forEach(([type, pool]) => {
                const count = plan.itemsPerSession?.boosters?.[type as EvaluationContentType] || 0;
                if (pool && pool.length > 0 && count > 0) {
                    const shuffled = [...pool].sort(() => 0.5 - Math.random());
                    sessionItems.push(...shuffled.slice(0, count).map(id => createEvaluationItem(id, type as EvaluationContentType)));
                }
            });
        }

        if (sessionItems.length === 0) { dispatch({ type: 'SET_TOAST', payload: t('noItemsToEvaluate') }); return; }
        sessionItems.sort(() => 0.5 - Math.random());
        setEvaluationItems(sessionItems);
        setIsEvaluating(true);
    };

    const renderPlanList = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-accent-color/5 rounded-full border border-accent-color/10">
                    <LayoutGrid size={14} className="text-accent-color" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-color">{t('evaluationPlans') || 'Vos protocoles'}</span>
                </div>
                <Button variant="accent" size="sm" className="rounded-full px-8 h-12 shadow-lg shadow-accent-color/20 text-[10px] font-black uppercase tracking-widest" onClick={handleCreateNew}>
                    <Plus size={16} className="mr-2" /> {t('createNewPlan')}
                </Button>
            </div>

            {activeProfile?.evaluationPlans && activeProfile.evaluationPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {activeProfile.evaluationPlans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, scale: 0.98, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="premium-card p-8 flex flex-col group transition-all hover-glow border-2 border-border-main/20 relative overflow-hidden"
                        >
                            <div className="absolute -right-8 -top-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                <Trophy size={160} />
                            </div>

                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tight group-hover:text-accent-color transition-colors">{plan.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-accent-color/10 text-accent-color text-[8px] font-black uppercase tracking-widest rounded-full">{t(contentTypeToTranslationKey[plan.mainContentType])}</span>
                                        <span className="px-3 py-1 bg-slate-900 text-white/40 text-[8px] font-black uppercase tracking-widest rounded-full">{plan.pool.length} items</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-bg-secondary group-hover:bg-accent-color transition-all duration-500 text-text-main group-hover:text-white shadow-inner">
                                    <Brain size={24} />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto relative z-10">
                                <Button onClick={() => startEvaluation(plan)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-accent-color/20 active:scale-95 transition-all">
                                    <Play size={18} className="mr-2" /> {t('launch')}
                                </Button>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(plan)} className="h-14 w-14 rounded-2xl bg-bg-secondary flex items-center justify-center hover:bg-bg-main transition-colors border border-border-main/50">
                                        <Edit size={18} className="opacity-40" />
                                    </button>
                                    <button onClick={() => handleDelete(plan.id)} className="h-14 w-14 rounded-2xl bg-bg-secondary flex items-center justify-center hover:bg-danger/10 hover:text-danger border border-border-main/50 transition-colors">
                                        <Trash2 size={18} className="opacity-40" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState label={t('noEvaluationPlans')} icon={<Sparkles size={48} />} action={handleCreateNew} actionLabel={t('createNewPlan')} />
            )}
        </div>
    );

    const renderHistoryList = () => {
        const resultColors: Record<EvaluationStatus, string> = {
            excellent: "text-success bg-success/10 border-success/20",
            bon: "text-accent-color bg-accent-color/10 border-accent-color/20",
            moyen: "text-warning bg-warning/10 border-warning/20",
            a_revoir: "text-danger bg-danger/10 border-danger/20"
        };
        const history = [...(activeProfile?.evaluationHistory || [])].reverse();

        return (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                {history.length > 0 ? (
                    history.map((record, index) => (
                        <motion.div key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="premium-card p-8 border border-border-main/30 hover-glow group transition-all">
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-main/20">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-bg-secondary rounded-2xl shadow-inner">
                                        <Calendar size={20} className="opacity-30" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black tracking-tight">{new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">{new Date(record.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-bg-secondary text-[10px] font-black opacity-30 tracking-widest border border-border-main/50">SESSION #{history.length - index}</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {record.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-bg-secondary/40 border border-border-main/10 group-hover:bg-bg-secondary transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-color/30" />
                                            <span className="text-sm font-black truncate max-w-[150px]">{item.itemName}</span>
                                        </div>
                                        <span className={clsx("px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border shadow-sm", resultColors[item.result])}>
                                            {t(item.result)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <EmptyState label={t('noEvaluationHistory')} icon={<History size={48} />} />
                )}
            </div>
        );
    };

    const renderPlanForm = () => {
        if (!editingPlan) return null;
        const boosterTypes = contentTypeOptions.filter(opt => opt.value !== editingPlan.mainContentType);
        const updateField = (f: keyof PlanFormData, v: any) => setEditingPlan({ ...editingPlan, [f]: v, ...(f === 'mainContentType' ? { pool: [] } : {}) });

        return (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-16 pb-32 px-4">
                <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 pb-12 border-b-2 border-border-main/50">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-accent-color/10 rounded-[2rem] text-accent-color shadow-inner">
                            <Plus size={40} />
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-gradient">{editingPlan.id ? t('editPlan') : t('createNewPlan')}</h2>
                            <p className="text-text-secondary font-medium mt-2 text-lg">Architecturez votre routine de perfectionnement.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={() => setViewMode('tabs')} className="rounded-2xl px-10 h-16 uppercase text-[10px] font-black tracking-widest transition-all">Annuler</Button>
                        <Button variant="accent" onClick={handleSave} className="rounded-2xl px-12 h-16 uppercase text-[10px] font-black tracking-widest shadow-2xl shadow-accent-color/30">Enregistrer</Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
                    <div className="xl:col-span-8 space-y-20">
                        <section className="space-y-10">
                            <SectionHeader icon={<Info size={20} />} title={t('generalInfo')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ml-6">Nom du protocole</label>
                                    <Input value={editingPlan.name} onChange={e => updateField('name', e.target.value)} placeholder="Ex: Révision hebdomadaire Juzz Amma" className="h-16 rounded-[2rem] bg-bg-secondary/50 border-none shadow-inner px-8 text-lg font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 ml-6">Type principal</label>
                                    <Select value={editingPlan.mainContentType} onChange={e => updateField('mainContentType', e.target.value as EvaluationContentType)} className="h-16 rounded-[2rem] bg-bg-secondary/50 border-none shadow-inner px-8 text-lg font-bold">
                                        {contentTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </Select>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-10">
                            <SectionHeader icon={<LayoutGrid size={20} />} title={t('elementSelection')} />
                            <div className="space-y-12">
                                <div className="premium-card p-1 rounded-[3rem] border-2 border-border-main/30 overflow-hidden shadow-2xl">
                                    <div className="p-8 border-b border-border-main/30 bg-bg-secondary/50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-accent-color text-white flex items-center justify-center text-[10px] font-black shadow-lg">1</div>
                                            <h4 className="text-sm font-black uppercase tracking-widest">Contenu Principal</h4>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{editingPlan.pool?.length || 0} sélectionnés</span>
                                    </div>
                                    <div className="p-8 max-h-[500px] overflow-y-auto no-scrollbar bg-white/5">
                                        <MultiSelectGrid items={fullContentPool[editingPlan.mainContentType!]} selectedItems={editingPlan.pool || []} onChange={(ids) => updateField('pool', ids)} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black tracking-tight">{t('addBoosterItems')}</h4>
                                            <p className="text-xs font-medium opacity-40">Ajoutez des défis transversaux pour une mémorisation robuste.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {boosterTypes.map(booster => (
                                                <button key={booster.value} onClick={() => setOpenBoosters(prev => ({ ...prev, [booster.value]: !prev[booster.value] }))}
                                                    className={clsx("px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        openBoosters[booster.value] ? "bg-accent-color text-white shadow-lg shadow-accent-color/20" : "bg-bg-secondary text-text-main/40 hover:bg-bg-main hover:text-text-main hover:scale-105")}
                                                >
                                                    {booster.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-8">
                                        {boosterTypes.map(booster => openBoosters[booster.value] && (
                                            <motion.div key={`booster-grid-${booster.value}`} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-1 rounded-[2.5rem] border-2 border-accent-color/10 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-accent-color/5 pointer-events-none" />
                                                <div className="p-6 border-b border-accent-color/10 bg-accent-color/[0.02] flex justify-between items-center relative z-10">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-color">{booster.label} Boosters</span>
                                                    <span className="text-[9px] font-black text-accent-color/60">{(editingPlan.boosterPools?.[booster.value] || []).length} items</span>
                                                </div>
                                                <div className="p-6 max-h-[300px] overflow-y-auto no-scrollbar relative z-10">
                                                    <MultiSelectGrid items={fullContentPool[booster.value]} selectedItems={editingPlan.boosterPools?.[booster.value] || []} onChange={(ids) => setEditingPlan(prev => ({ ...prev!, boosterPools: { ...prev!.boosterPools, [booster.value]: ids } }))} />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="xl:col-span-4 space-y-12">
                        <section className="space-y-8 sticky top-32">
                            <SectionHeader icon={<Activity size={20} />} title={t('sessionSettings')} />
                            <div className="p-10 rounded-[3rem] bg-slate-900 shadow-3xl text-white space-y-10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-accent-color/10 to-transparent pointer-events-none" />

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4">Items par session</label>
                                        <Input type="number" min="1" value={editingPlan.itemsPerSession?.main || 1} onChange={e => {
                                            const v = parseInt(e.target.value) || 1;
                                            setEditingPlan(p => ({ ...p!, itemsPerSession: { ...p!.itemsPerSession!, main: v } }));
                                        }} className="h-16 rounded-2xl bg-white/5 border-none shadow-inner px-8 text-xl font-black text-accent-color" />
                                    </div>

                                    {boosterTypes.map(booster => openBoosters[booster.value] && (
                                        <div key={`bc-${booster.value}`} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4">Booster {booster.label}</label>
                                            <Input type="number" min="0" value={editingPlan.itemsPerSession?.boosters?.[booster.value] || 0} onChange={e => {
                                                const v = parseInt(e.target.value) || 0;
                                                setEditingPlan(p => ({ ...p!, itemsPerSession: { ...p!.itemsPerSession!, boosters: { ...p!.itemsPerSession!.boosters, [booster.value]: v } } }));
                                            }} className="h-16 rounded-2xl bg-white/5 border-none shadow-inner px-8 text-xl font-black text-accent-color" />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-4">Ordre de passage</label>
                                    <Select value={editingPlan.order} onChange={e => updateField('order', e.target.value as any)} className="h-16 rounded-2xl bg-white/5 border-none shadow-inner px-8 text-sm font-bold">
                                        <option value="random">{t('orderRandom')}</option>
                                        <option value="ascending">{t('orderAscending')}</option>
                                        <option value="descending">{t('orderDescending')}</option>
                                    </Select>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Planifier</span>
                                        <ToggleSwitch label="" checked={!!editingPlan.isScheduled} onChange={e => updateField('isScheduled', e.target.checked)} />
                                    </div>
                                    <AnimatePresence>
                                        {editingPlan.isScheduled && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
                                                <Input label="Durée (jours)" type="number" min="1" value={editingPlan.duration} onChange={e => updateField('duration', parseInt(e.target.value) || 1)} className="h-14 bg-white/5 border-none text-white font-bold" />
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['daily', 'weekly', 'custom'].map(f => (
                                                        <button key={f} onClick={() => updateField('frequency', { ...editingPlan.frequency!, type: f })}
                                                            className={clsx("h-12 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                                                editingPlan.frequency?.type === f ? "bg-accent-color text-white shadow-xl" : "bg-white/5 text-white/40")}
                                                        >
                                                            {t(`freq${f.charAt(0).toUpperCase() + f.slice(1)}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (isEvaluating) return <ActiveEvaluationScreen items={evaluationItems} onFinish={results => { if (results.length > 0) dispatch({ type: 'SAVE_EVALUATION_RESULTS', payload: results }); setIsEvaluating(false); setEvaluationItems([]); }} />;

    return (
        <div className="space-y-8 md:space-y-16 pb-32 px-4 md:px-0">
            {viewMode !== 'form' && (
                <header className="pb-12 border-b-2 border-border-main/50 flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                                <Trophy size={32} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 text-gradient">L'Excellence du Rappel</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-gradient tracking-tight mb-2">{t('evaluationTitle') || 'Auto-Évaluation'}</h1>
                        <p className="text-text-secondary font-medium text-lg md:text-xl max-w-2xl leading-relaxed">{t('evaluationSubtitle') || 'Mettez votre mémorisation à l\'épreuve pour une maîtrise parfaite.'}</p>
                    </div>
                </header>
            )}

            {viewMode === 'form' ? renderPlanForm() : (
                <Tabs defaultValue="plans" className="w-full" onValueChange={val => setActiveTab(val as any)}>
                    <TabsList className="inline-flex items-center gap-2 p-1.5 bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border-main/50 mb-16">
                        <TabsTrigger value="plans" className="px-10 h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Protocoles</TabsTrigger>
                        <TabsTrigger value="history" className="px-10 h-10 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Historique</TabsTrigger>
                    </TabsList>
                    <AnimatePresence mode="wait">
                        <TabsContent value="plans" className="outline-none">{renderPlanList()}</TabsContent>
                        <TabsContent value="history" className="outline-none">{renderHistoryList()}</TabsContent>
                    </AnimatePresence>
                </Tabs>
            )}

            <ConfirmModal
                isOpen={!!planToDelete}
                onClose={() => setPlanToDelete(null)}
                onConfirm={confirmDelete}
                title={t('deletePlanTitle') || 'Supprimer le protocole'}
                message={t('confirmDeletePlan') || 'Voulez-vous vraiment supprimer ce protocole ?'}
                variant="danger"
                confirmText={t('delete') || 'Supprimer'}
            />
        </div>
    );
};

const SectionHeader: React.FC<{ icon: React.ReactNode, title: string }> = ({ icon, title }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 flex items-center gap-4">
        <span className="p-2 bg-border-main/20 rounded-lg">{icon}</span>
        {title}
        <span className="flex-1 h-px bg-border-main/50" />
    </h3>
);

const EmptyState: React.FC<{ label: string, icon: React.ReactNode, action?: () => void, actionLabel?: string }> = ({ label, icon, action, actionLabel }) => (
    <div className="p-32 text-center premium-card border-none bg-bg-secondary/30 rounded-[4rem] flex flex-col items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-color/5 to-transparent pointer-events-none" />
        <div className="w-24 h-24 bg-bg-main rounded-[2.5rem] flex items-center justify-center text-text-main/5 shadow-inner relative z-10">
            {icon}
        </div>
        <div className="relative z-10 space-y-2">
            <p className="text-xl font-black tracking-tight opacity-40">{label}</p>
            <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest max-w-[200px] mx-auto">Commencez par créer votre premier protocole d'évaluation.</p>
        </div>
        {action && actionLabel && (
            <Button variant="accent" onClick={action} className="relative z-10 px-12 h-14 rounded-2xl uppercase font-black text-[10px] tracking-widest shadow-xl shadow-accent-color/20">{actionLabel}</Button>
        )}
    </div>
);

export default EvaluationView;
