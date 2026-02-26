import React, { useState } from 'react';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { MemorizationLevel, MemorizedHizb, MemorizedJuzz, MemorizedSurahPart, Juzz, Hizb, SurahPart, MemorizationStatus, HadithMemorizationStatus, Hadith } from '@/types';
import { HIZB_DATA, JUZ_DATA, MEMORIZATION_SURAH_OPTIONS } from '@/constants/quranData';
import { HADITH_COLLECTION } from '@/constants/hadithData';
import { checkAndGroupMemorizations } from '@/services/memorizationLogic';
import Modal from '@/components/ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
    BookOpen, Brain, LayoutGrid, Clock,
    Trash2, Plus, Info, Star, ChevronRight, Activity, Sparkles, BookMarked
} from 'lucide-react';

type FormType = 'surahPart' | 'hizb' | 'juzz' | 'hadith' | null;

const StatusIndicator: React.FC<{ status: MemorizationStatus | HadithMemorizationStatus }> = ({ status }) => {
    const colors: Record<string, string> = {
        excellent: 'bg-success ring-success/20',
        bon: 'bg-accent-color ring-accent-color/20',
        moyen: 'bg-warning ring-warning/20',
        a_revoir: 'bg-danger ring-danger/20',
        acquis: 'bg-success ring-success/20',
        en_memorisation: 'bg-accent-color ring-accent-color/20',
        a_reprendre: 'bg-warning ring-warning/20',
        lu: 'bg-blue-500 ring-blue-500/10',
        non_lu: 'bg-text-secondary/20 ring-text-secondary/10'
    };

    return (
        <div className={clsx("w-2.5 h-2.5 rounded-full ring-4 shadow-[0_0_8px_rgba(0,0,0,0.1)]", colors[status] || colors.bon)}></div>
    );
};

const MemorizationView: React.FC = () => {
    const { state, dispatch, t, activeProfile } = useStore();
    const [formType, setFormType] = useState<FormType>(null);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<MemorizationLevel>('bon');
    const [modalContent, setModalContent] = useState<{ title: string, items: { name: string, level: MemorizationLevel, status?: MemorizationStatus }[] } | null>(null)
    const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);

    const memorizations = activeProfile?.memorizations;
    if (!memorizations || !activeProfile) return null;

    const handleAddItem = () => {
        if (!selectedItemId || !formType || !activeProfile) return;

        let payload: any;
        let tempMemorizations = JSON.parse(JSON.stringify(activeProfile.memorizations));
        const status: MemorizationStatus = selectedLevel === 'moyen' ? 'moyen' : selectedLevel;

        if (formType === 'surahPart') {
            const surahOption = MEMORIZATION_SURAH_OPTIONS.find(opt => opt.id === selectedItemId);
            if (surahOption) {
                const itemToAdd: MemorizedSurahPart = { id: surahOption.id, name: surahOption.name, level: selectedLevel, status, originalSurahId: surahOption.originalSurahId };
                payload = { type: 'surahPart', item: itemToAdd };
                if (!tempMemorizations.surahParts.find((s: MemorizedSurahPart) => s.id === itemToAdd.id)) {
                    tempMemorizations.surahParts.push(itemToAdd);
                }
            }
        } else if (formType === 'hizb') {
            const hizbData = HIZB_DATA[Number(selectedItemId)];
            if (hizbData) {
                const hizbNum = Number(hizbData.name);
                const surahPartsInHizb = MEMORIZATION_SURAH_OPTIONS.filter(opt => opt.hizbs.includes(hizbNum));
                const componentSurahParts: MemorizedSurahPart[] = surahPartsInHizb.map(p => ({ id: p.id, name: p.name, level: selectedLevel, status, originalSurahId: p.originalSurahId }));
                const itemToAdd: MemorizedHizb = { number: hizbData.name, details: hizbData.details, level: selectedLevel, status, componentSurahParts };
                payload = { type: 'hizb', item: itemToAdd };
            }
        } else if (formType === 'juzz') {
            const juzzData = JUZ_DATA.find(j => j.id === Number(selectedItemId));
            if (juzzData) {
                const hizb1Num = ((juzzData.id - 1) * 2 + 1).toString();
                const hizb2Num = ((juzzData.id - 1) * 2 + 2).toString();
                const hizb1Details = HIZB_DATA.find(h => h.name === hizb1Num)?.details || '';
                const hizb2Details = HIZB_DATA.find(h => h.name === hizb2Num)?.details || '';
                const itemToAdd: MemorizedJuzz = { number: juzzData.id, level: selectedLevel, status, componentHizbs: [{ number: hizb1Num, details: hizb1Details, level: selectedLevel, status }, { number: hizb2Num, details: hizb2Details, level: selectedLevel, status }] };
                payload = { type: 'juzz', item: itemToAdd };
            }
        } else if (formType === 'hadith') {
            const hadithId = parseInt(selectedItemId);
            if (!isNaN(hadithId)) {
                const hStat = selectedLevel === 'excellent' ? 'acquis' : (selectedLevel === 'bon' ? 'en_memorisation' : 'a_reprendre');
                dispatch({ type: 'UPDATE_HADITH_PROGRESS', payload: { hadithId, status: hStat, date: new Date().toISOString() } });
                dispatch({ type: 'SET_TOAST', payload: t('saved') });
            }
        }

        if (payload) {
            dispatch({ type: 'ADD_MEMORIZATION', payload });
            const { updatedMemorizations, groupedItems } = checkAndGroupMemorizations(tempMemorizations);
            if (groupedItems.length > 0) {
                dispatch({ type: 'UPDATE_MEMORIZATIONS', payload: updatedMemorizations });
                dispatch({ type: 'SET_TOAST', payload: `Félicitations ! ${groupedItems.join(', ')} complété(s) !` });
            }
        }

        setFormType(null);
        setSelectedItemId('');
        setSelectedLevel('bon');
    };

    const handleRemoveItem = (type: 'juzz' | 'hizb' | 'surahPart', item: Juzz | Hizb | SurahPart) => {
        const itemName = 'name' in item ? item.name : `${t(type)} ${item.number}`;
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${itemName}" de votre liste ?`)) {
            dispatch({ type: 'REMOVE_MEMORIZATION', payload: { type, item } });
        }
    };

    const handleHadithStatusChange = (hadithId: number, status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId, status } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
        setSelectedHadith(null);
    };

    const levelClasses: Record<MemorizationLevel, string> = {
        excellent: "bg-success/10 text-success border border-success/20",
        bon: "bg-accent-color/10 text-accent-color border border-accent-color/20",
        moyen: "bg-warning/10 text-warning border border-warning/20"
    };
    const levels = { excellent: t('excellent'), bon: t('bon'), moyen: t('moyen') };
    const hadithStatusText: Record<HadithMemorizationStatus, string> = {
        'acquis': t('statusAcquis'),
        'en_memorisation': t('statusEnMemorisation'),
        'a_reprendre': t('statusARependre'),
        'lu': t('statusLu'),
        'non_lu': t('statusNonLu')
    };

    const memorizedHadiths = Object.entries(activeProfile.hadithProgress || {})
        .filter(([, status]) => status !== 'non_lu')
        .map(([id]) => HADITH_COLLECTION.find(h => h.id === parseInt(id)))
        .filter(Boolean) as Hadith[];

    const renderForm = () => {
        if (!formType) return null;
        let options: { value: string, label: string }[] = [];
        if (formType === 'surahPart') options = MEMORIZATION_SURAH_OPTIONS.map(opt => ({ value: opt.id, label: opt.name }));
        else if (formType === 'hizb') options = HIZB_DATA.map((h, i) => ({ value: i.toString(), label: `${t('hizb')} ${h.name} - ${h.details}` }));
        else if (formType === 'juzz') options = JUZ_DATA.map(j => ({ value: j.id.toString(), label: `${t('juzz')} ${j.id}` }));
        else if (formType === 'hadith') options = HADITH_COLLECTION.map(h => ({ value: h.id.toString(), label: `${t('hadith')} n°${h.id}` }));

        return (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-8 premium-card border-none bg-accent-color/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-color/5 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Plus className="text-accent-color" size={20} />
                            <h3 className="text-lg font-black tracking-tight">{t('addLabel')} {t(formType)}</h3>
                        </div>
                        <button onClick={() => setFormType(null)} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Annuler</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t('selection')}</label>
                            <Select className="h-14 rounded-2xl bg-bg-secondary border-2 border-border-main/50 text-sm font-bold w-full focus:ring-accent-color/20" onChange={e => setSelectedItemId(e.target.value)} defaultValue={selectedItemId}>
                                <option value="" disabled>{t('selectItem')}</option>
                                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">{t('level')}</label>
                            <Select className="h-14 rounded-2xl bg-bg-secondary border-2 border-border-main/50 text-sm font-bold w-full focus:ring-accent-color/20" onChange={e => setSelectedLevel(e.target.value as MemorizationLevel)} defaultValue={selectedLevel}>
                                <option value="bon">{levels.bon}</option>
                                <option value="excellent">{levels.excellent}</option>
                                <option value="moyen">{levels.moyen}</option>
                            </Select>
                        </div>
                    </div>

                    <Button
                        variant="accent"
                        onClick={handleAddItem}
                        className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent-color/20"
                        disabled={!selectedItemId}
                    >
                        {t('confirmAddition')}
                    </Button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-12 pb-32 px-4 md:px-0">
            <header className="pb-8 border-b border-border-main flex flex-col xl:flex-row xl:items-end justify-between gap-10">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent-color/10 rounded-2xl text-accent-color">
                            <Brain size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black text-gradient">{t('memorizedTitle') || 'Mon Trésor Sacré'}</h1>
                            <p className="text-text-secondary font-medium text-sm md:text-base mt-1">{t('memorizedSubtitle') || 'Consacrez vos progrès et gardez une trace de vos accomplissements sacrés.'}</p>
                        </div>
                    </div>
                </div>

                {!formType && (
                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                        <button onClick={() => setFormType('surahPart')} className="flex-1 xl:flex-none h-12 px-6 rounded-xl bg-bg-secondary hover:bg-bg-main transition-all border border-border-main/50 text-[10px] font-black uppercase tracking-widest shadow-sm">+ {t('surah')}</button>
                        <button onClick={() => setFormType('hizb')} className="flex-1 xl:flex-none h-12 px-6 rounded-xl bg-bg-secondary hover:bg-bg-main transition-all border border-border-main/50 text-[10px] font-black uppercase tracking-widest shadow-sm">+ {t('hizb')}</button>
                        <button onClick={() => setFormType('juzz')} className="flex-1 xl:flex-none h-12 px-6 rounded-xl bg-bg-secondary hover:bg-bg-main transition-all border border-border-main/50 text-[10px] font-black uppercase tracking-widest shadow-sm">+ {t('juzz')}</button>
                        <button onClick={() => setFormType('hadith')} className="flex-1 xl:flex-none h-12 px-6 rounded-xl bg-bg-secondary hover:bg-bg-main transition-all border border-border-main/50 text-[10px] font-black uppercase tracking-widest shadow-sm">+ {t('hadith')}</button>
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {formType && renderForm()}
            </AnimatePresence>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="flex flex-wrap items-center gap-2 p-1.5 bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-border-main/50 mb-12 h-auto">
                    {['all', 'juzz', 'hizb', 'surah', 'hadith'].map(tab => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className="px-6 md:px-8 h-10 rounded-xl text-text-main/50 data-[state=active]:bg-white data-[state=active]:!text-slate-900 data-[state=active]:shadow-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            {t(`tab_${tab}`) || t(tab === 'surah' ? 'memorizedSurahs' : tab === 'juzz' ? 'memorizedJuzz' : tab === 'hizb' ? 'memorizedHizbs' : tab === 'hadith' ? 'hadith' : 'showAll')}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="all" className="space-y-6 outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {memorizations.juzz.map((j, i) => (
                                <motion.div
                                    key={`all-j-${j.number}`}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                    className="premium-card p-6 flex items-center justify-between border-2 border-border-main/30 group relative overflow-hidden h-28"
                                >
                                    <div className="flex items-center gap-4 relative z-10 cursor-pointer" onClick={() => setModalContent({ title: `${t('juzz')} ${j.number}`, items: j.componentHizbs.map(h => ({ name: `${t('hizb')} ${h.number} - ${h.details}`, level: h.level, status: h.status })) })}>
                                        <div className="w-12 h-12 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color font-black">{j.number}</div>
                                        <div>
                                            <h4 className="text-sm font-black tracking-tight">{t('juzz')} {j.number}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusIndicator status={j.status || 'bon'} />
                                                <span className={clsx("px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest", levelClasses[j.level])}>{levels[j.level]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveItem('juzz', j)} className="p-2 rounded-lg bg-danger/5 text-danger opacity-0 group-hover:opacity-100 transition-all z-20">
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                            {memorizations.hizbs.map((h, i) => (
                                <motion.div
                                    key={`all-h-${h.number}`}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (memorizations.juzz.length + i) * 0.02 }}
                                    className="premium-card p-6 flex items-center justify-between border-2 border-border-main/30 group h-28"
                                >
                                    <div className="flex items-center gap-4 relative z-10 cursor-pointer" onClick={() => setModalContent({ title: `${t('hizb')} ${h.number} - ${h.details}`, items: h.componentSurahParts.map(s => ({ name: s.name, level: s.level, status: s.status })) })}>
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-black">{h.number}</div>
                                        <div>
                                            <h4 className="text-sm font-black tracking-tight">{t('hizb')} {h.number}</h4>
                                            <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest truncate max-w-[120px]">{h.details}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusIndicator status={h.status || 'bon'} />
                                                <span className={clsx("px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest", levelClasses[h.level])}>{levels[h.level]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveItem('hizb', h)} className="p-2 rounded-lg bg-danger/5 text-danger opacity-0 group-hover:opacity-100 transition-all z-20">
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                            {memorizations.surahParts.map((s, i) => (
                                <motion.div
                                    key={`all-s-${s.id}`}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (memorizations.juzz.length + memorizations.hizbs.length + i) * 0.02 }}
                                    className="premium-card p-6 flex items-center justify-between border-2 border-border-main/30 group h-28"
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600"><BookOpen size={18} /></div>
                                        <div>
                                            <h4 className="text-sm font-black tracking-tight truncate max-w-[120px]">{s.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusIndicator status={s.status || 'bon'} />
                                                <span className={clsx("px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest", levelClasses[s.level])}>{levels[s.level]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveItem('surahPart', s)} className="p-2 rounded-lg bg-danger/5 text-danger opacity-0 group-hover:opacity-100 transition-all z-20">
                                        <Trash2 size={14} />
                                    </button>
                                </motion.div>
                            ))}
                            {memorizedHadiths.map((h, i) => {
                                const status = activeProfile.hadithProgress?.[h.id] || 'non_lu';
                                return (
                                    <motion.div
                                        key={`all-hadith-${h.id}`}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (memorizations.juzz.length + memorizations.hizbs.length + memorizations.surahParts.length + i) * 0.02 }}
                                        className="premium-card p-6 flex items-center justify-between border-2 border-border-main/30 group cursor-pointer h-28"
                                        onClick={() => setSelectedHadith(h)}
                                    >
                                        <div className="flex items-center gap-4 relative z-10 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 font-black">{h.id}</div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[10px] font-bold font-amiri rtl text-right truncate opacity-30 mb-1">{h.arabic}</h4>
                                                <div className="flex items-center gap-2">
                                                    <StatusIndicator status={status} />
                                                    <span className="text-[8px] font-black text-accent-color uppercase tracking-widest">{hadithStatusText[status]}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                        {memorizations.juzz.length === 0 && memorizations.hizbs.length === 0 && memorizations.surahParts.length === 0 && memorizedHadiths.length === 0 && (
                            <EmptyState label={t('noMemorizedItemsOfType')} icon={<Activity size={48} />} />
                        )}
                    </TabsContent>
                    <TabsContent value="juzz" className="space-y-6 outline-none">
                        {memorizations.juzz.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {memorizations.juzz.map((j, i) => (
                                    <motion.div
                                        key={j.number}
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                        className="premium-card p-8 group flex flex-col gap-6 transition-all hover-glow border-2 border-border-main/30 relative overflow-hidden"
                                    >
                                        <div className="absolute -right-6 -top-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                            <LayoutGrid size={120} />
                                        </div>
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="w-14 h-14 rounded-[1.25rem] bg-accent-color/10 flex items-center justify-center text-accent-color shadow-inner">
                                                <span className="text-2xl font-black">{j.number}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <button onClick={() => handleRemoveItem('juzz', j)} className="p-2 rounded-xl bg-danger/5 text-danger opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative z-10 cursor-pointer" onClick={() => setModalContent({ title: `${t('juzz')} ${j.number}`, items: j.componentHizbs.map(h => ({ name: `${t('hizb')} ${h.number} - ${h.details}`, level: h.level, status: h.status })) })}>
                                            <h4 className="text-xl font-black tracking-tight mb-2">{t('juzz')} {j.number}</h4>
                                            <div className="flex items-center gap-3">
                                                <StatusIndicator status={j.status || 'bon'} />
                                                <span className={clsx("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", levelClasses[j.level])}>{levels[j.level]}</span>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-border-main/30 flex justify-between items-center relative z-10">
                                            <span className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em]">{j.componentHizbs.length} {t('hizbs')}</span>
                                            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-accent-color" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState label={t('noMemorizedJuzz')} icon={<LayoutGrid size={48} />} />
                        )}
                    </TabsContent>

                    <TabsContent value="hizb" className="space-y-6 outline-none">
                        {memorizations.hizbs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {memorizations.hizbs.map((h, i) => (
                                    <motion.div
                                        key={h.number}
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                        className="premium-card p-6 flex items-center justify-between transition-all hover-glow border-2 border-border-main/30 group"
                                    >
                                        <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => setModalContent({ title: `${t('hizb')} ${h.number} - ${h.details}`, items: h.componentSurahParts.map(s => ({ name: s.name, level: s.level, status: s.status })) })}>
                                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform">
                                                <span className="text-xl font-black">{h.number}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-base font-black tracking-tight truncate mb-1">{t('hizb')} {h.number}</h4>
                                                <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-3 line-clamp-1">{h.details}</p>
                                                <div className="flex items-center gap-3">
                                                    <StatusIndicator status={h.status || 'bon'} />
                                                    <span className={clsx("px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", levelClasses[h.level])}>{levels[h.level]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveItem('hizb', h)} className="p-3 rounded-xl hover:bg-danger/5 text-danger opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState label={t('noMemorizedHizbs')} icon={<Clock size={48} />} />
                        )}
                    </TabsContent>

                    <TabsContent value="surah" className="space-y-6 outline-none">
                        {memorizations.surahParts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {memorizations.surahParts.map((s, i) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                        className="premium-card p-6 flex flex-col justify-between transition-all hover-glow border-2 border-border-main/30 group relative overflow-hidden h-40"
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner">
                                                <BookOpen size={20} />
                                            </div>
                                            <button onClick={() => handleRemoveItem('surahPart', s)} className="p-2 rounded-xl bg-danger/5 text-danger opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="relative z-10 mt-4">
                                            <h4 className="text-lg font-black tracking-tight mb-2 truncate">{s.name}</h4>
                                            <div className="flex items-center gap-3">
                                                <StatusIndicator status={s.status || 'bon'} />
                                                <span className={clsx("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", levelClasses[s.level])}>{levels[s.level]}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState label={t('noMemorizedSurahs')} icon={<Star size={48} />} />
                        )}
                    </TabsContent>

                    <TabsContent value="hadith" className="space-y-6 outline-none">
                        {memorizedHadiths.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {memorizedHadiths.map((h, i) => {
                                    const status = activeProfile.hadithProgress?.[h.id] || 'non_lu';
                                    return (
                                        <motion.div
                                            key={h.id}
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="premium-card p-6 flex items-center justify-between transition-all hover-glow border-2 border-border-main/30 group cursor-pointer"
                                            onClick={() => setSelectedHadith(h)}
                                        >
                                            <div className="flex items-center gap-5 flex-1 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner group-hover:scale-110 transition-transform">
                                                    <span className="text-xl font-black">{h.id}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold font-amiri rtl text-right truncate opacity-30 mb-2">{h.arabic}</h4>
                                                    <div className="flex items-center gap-3">
                                                        <StatusIndicator status={status} />
                                                        <span className="text-[10px] font-black text-accent-color uppercase tracking-widest">{hadithStatusText[status]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <EmptyState label={t('noMemorizedHadiths')} icon={<BookMarked size={48} />} />
                        )}
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            {/* Modals */}
            <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)}>
                {modalContent && (
                    <div className="space-y-8 p-2">
                        <header className="border-b border-border-main pb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-accent-color/10 rounded-xl text-accent-color">
                                    <Activity size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Détails de progression</span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight text-gradient">{modalContent.title}</h3>
                        </header>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-4 no-scrollbar">
                            {modalContent.items.map((item, index) => (
                                <div key={item.name + index} className='flex justify-between items-center p-5 rounded-2xl bg-bg-secondary/40 border border-border-main/30 group hover:bg-bg-secondary transition-colors'>
                                    <div className="flex items-center gap-4">
                                        <StatusIndicator status={item.status || 'bon'} />
                                        <span className="text-base font-black tracking-tight">{item.name}</span>
                                    </div>
                                    <span className={clsx("px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full", levelClasses[item.level])}>{levels[item.level]}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="secondary" onClick={() => setModalContent(null)} className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest border-border-main/50">Fermer</Button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!selectedHadith} onClose={() => setSelectedHadith(null)}>
                {selectedHadith && (
                    <div className="space-y-10 p-2">
                        <header className="flex items-center justify-between border-b border-border-main pb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600">
                                    <BookMarked size={28} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black tracking-tight">{t('hadithNumber', { number: selectedHadith.id })}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Collection Arba'in An-Nawawi</span>
                                </div>
                            </div>
                        </header>

                        <div className="space-y-8 text-left max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
                            <div className="p-10 premium-card border-none bg-accent-color/5 shadow-inner relative overflow-hidden">
                                <Sparkles className="absolute -right-4 -top-4 opacity-[0.05] text-accent-color" size={80} />
                                <p className='font-amiri text-3xl rtl text-right leading-[2.5] text-text-main/90'>{selectedHadith.arabic}</p>
                            </div>

                            <div className="p-8 rounded-[2rem] border-2 border-dashed border-border-main/50 bg-bg-secondary/20 relative">
                                <Info className="absolute -left-3 -top-3 text-border-main" size={24} />
                                <p className="text-base md:text-lg font-medium leading-relaxed italic text-text-secondary opacity-80">
                                    "{selectedHadith.translations[state.settings.lang as keyof typeof selectedHadith.translations] || selectedHadith.translations.en}"
                                </p>
                            </div>

                            <div className='pt-10 border-t border-border-main/30'>
                                <h4 className='text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-8 text-center'>{t('updateStatus')}</h4>
                                <div className='grid grid-cols-2 gap-4'>
                                    <button onClick={() => handleHadithStatusChange(selectedHadith.id, 'lu')} className="h-14 rounded-2xl bg-bg-secondary border border-border-main/50 text-[10px] font-black uppercase tracking-widest hover:bg-bg-main transition-all">{t('statusLu')}</button>
                                    <button onClick={() => handleHadithStatusChange(selectedHadith.id, 'en_memorisation')} className="h-14 rounded-2xl bg-accent-color/5 border border-accent-color/20 text-[10px] font-black uppercase tracking-widest text-accent-color hover:bg-accent-color/10 transition-all">{t('statusEnMemorisation')}</button>
                                    <button onClick={() => handleHadithStatusChange(selectedHadith.id, 'a_reprendre')} className="h-14 rounded-2xl bg-warning/5 border border-warning/20 text-[10px] font-black uppercase tracking-widest text-warning hover:bg-warning/10 transition-all">{t('statusARependre')}</button>
                                    <button onClick={() => handleHadithStatusChange(selectedHadith.id, 'acquis')} className="h-14 rounded-2xl bg-success text-white shadow-lg shadow-success/20 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">{t('statusAcquis')}</button>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setSelectedHadith(null)} className="w-full text-text-main/20 hover:text-text-main font-black uppercase tracking-widest text-[10px]">Fermer le Hadith</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const EmptyState: React.FC<{ label: string, icon: React.ReactNode }> = ({ label, icon }) => (
    <div className="p-24 text-center premium-card border-none bg-bg-secondary/40 flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-bg-main rounded-[2rem] flex items-center justify-center text-text-main/5 shadow-inner">
            {icon}
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{label}</p>
    </div>
);

export default MemorizationView;