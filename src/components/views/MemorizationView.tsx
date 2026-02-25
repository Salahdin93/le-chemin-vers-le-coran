import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { MemorizationLevel, MemorizedHizb, MemorizedJuzz, MemorizedSurahPart, Juzz, Hizb, SurahPart, MemorizationStatus, HadithMemorizationStatus, Hadith } from '@/types';
import { HIZB_DATA, JUZ_DATA, MEMORIZATION_SURAH_OPTIONS } from '@/constants/quranData';
import { HADITH_COLLECTION } from '@/constants/hadithData';
import { checkAndGroupMemorizations } from '@/services/memorizationLogic';
import Modal from '@/components/ui/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FormType = 'surahPart' | 'hizb' | 'juzz' | null;

const StatusIndicator: React.FC<{ status: MemorizationStatus | HadithMemorizationStatus }> = ({ status }) => {
    const statusClasses: Record<MemorizationStatus | HadithMemorizationStatus, string> = {
        excellent: 'bg-green-500',
        bon: 'bg-blue-500',
        moyen: 'bg-yellow-500',
        a_revoir: 'bg-red-500',
        acquis: 'bg-green-500',
        en_memorisation: 'bg-blue-500',
        a_reprendre: 'bg-yellow-500',
        lu: 'bg-gray-400',
        non_lu: 'bg-gray-300'
    };
    return (
        <div className={`w-3 h-3 rounded-full ${statusClasses[status]}`}></div>
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

    const showHizbDetails = (hizb: MemorizedHizb) => {
        setModalContent({
            title: `${t('hizb')} ${hizb.number} - ${hizb.details}`,
            items: hizb.componentSurahParts.map(s => ({ name: s.name, level: s.level, status: s.status }))
        });
    };

    const showJuzzDetails = (juzz: MemorizedJuzz) => {
        setModalContent({
            title: `${t('juzz')} ${juzz.number}`,
            items: juzz.componentHizbs.map(h => ({ name: `${t('hizb')} ${h.number} - ${h.details}`, level: h.level, status: h.status }))
        });
    };

    const handleHadithStatusChange = (hadithId: number, status: HadithMemorizationStatus) => {
        dispatch({ type: 'UPDATE_HADITH_STATUS', payload: { hadithId, status } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
        setSelectedHadith(null);
    };

    const levelClasses: Record<MemorizationLevel, string> = { excellent: "bg-green-100 text-green-800", bon: "bg-blue-100 text-blue-800", moyen: "bg-yellow-100 text-yellow-800" };
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

        return (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-6 glass-card border-none bg-accent-color/5 space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-accent-color">Ajouter {t(formType)}</h3>
                    <button onClick={() => setFormType(null)} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Ignorer</button>
                </div>
                <Select className="h-12 text-sm font-bold" onChange={e => setSelectedItemId(e.target.value)} defaultValue={selectedItemId}>
                    <option value="" disabled>{t('select')}</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                    <Select className="h-12 text-sm font-bold" onChange={e => setSelectedLevel(e.target.value as MemorizationLevel)} defaultValue={selectedLevel}>
                        <option value="bon">{levels.bon}</option>
                        <option value="excellent">{levels.excellent}</option>
                        <option value="moyen">{levels.moyen}</option>
                    </Select>
                    <Button variant="accent" onClick={handleAddItem} className="h-12" disabled={!selectedItemId}>{t('add')}</Button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="space-y-8 md:space-y-12 pb-32 px-2 md:px-0">
            <header className="pb-8 border-b border-border-main flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gradient mb-2">{t('memorizedTitle')}</h1>
                    <p className="text-text-secondary font-medium text-sm md:text-base">{t('memorizedSubtitle') || 'Consacrez vos progrès et gardez une trace de vos accomplissements sacrés.'}</p>
                </div>
                {!formType && (
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Button variant="secondary" size="sm" className="flex-1 md:flex-none h-11 px-6 rounded-full text-xs font-black uppercase tracking-widest" onClick={() => setFormType('surahPart')}>+ {t('surah')}</Button>
                        <Button variant="secondary" size="sm" className="flex-1 md:flex-none h-11 px-6 rounded-full text-xs font-black uppercase tracking-widest" onClick={() => setFormType('hizb')}>+ {t('hizb')}</Button>
                        <Button variant="secondary" size="sm" className="flex-1 md:flex-none h-11 px-6 rounded-full text-xs font-black uppercase tracking-widest" onClick={() => setFormType('juzz')}>+ {t('juzz')}</Button>
                    </div>
                )}
            </header>

            {renderForm()}

            <Tabs defaultValue="juzz" className="w-full">
                <TabsList className="flex items-center gap-1 p-1 bg-bg-secondary/50 backdrop-blur-md rounded-2xl border border-border-main/50 mb-8 overflow-x-auto no-scrollbar">
                    <TabsTrigger value="juzz" className="flex-1 min-w-[100px] h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('memorizedJuzz')}</TabsTrigger>
                    <TabsTrigger value="hizb" className="flex-1 min-w-[100px] h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('memorizedHizbs')}</TabsTrigger>
                    <TabsTrigger value="surah" className="flex-1 min-w-[100px] h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('memorizedSurahs')}</TabsTrigger>
                    <TabsTrigger value="hadith" className="flex-1 min-w-[100px] h-11 rounded-xl data-[state=active]:bg-accent-color data-[state=active]:text-white data-[state=active]:shadow-lg text-xs font-black uppercase tracking-widest transition-all">{t('hadith')}</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <TabsContent value="juzz" className="space-y-4 outline-none">
                        {memorizations.juzz.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {memorizations.juzz.map(j => (
                                    <motion.div key={j.number} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-5 group flex justify-between items-center transition-all hover-glow">
                                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => showJuzzDetails(j)}>
                                            <div className="w-12 h-12 rounded-xl bg-accent-color/10 flex items-center justify-center text-accent-color shadow-inner">
                                                <span className="text-lg font-black">{j.number}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-tight">{t('juzz')} {j.number}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusIndicator status={j.status || 'bon'} />
                                                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{levels[j.level]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveItem('juzz', j)} className="p-2 rounded-lg hover:bg-danger/10 text-text-main/10 hover:text-danger transition-all opacity-0 group-hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center glass-card border-none bg-bg-main/30">
                                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noMemorizedJuzz')}</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="hizb" className="space-y-4 outline-none">
                        {memorizations.hizbs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {memorizations.hizbs.map(h => (
                                    <motion.div key={h.number} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-5 group flex justify-between items-center transition-all hover-glow">
                                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => showHizbDetails(h)}>
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                                                <span className="text-lg font-black">{h.number}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-tight line-clamp-1">{t('hizb')} {h.number} — {h.details}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusIndicator status={h.status || 'bon'} />
                                                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{levels[h.level]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveItem('hizb', h)} className="p-2 rounded-lg hover:bg-danger/10 text-text-main/10 hover:text-danger transition-all opacity-0 group-hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center glass-card border-none bg-bg-main/30">
                                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noMemorizedHizbs')}</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="surah" className="space-y-4 outline-none">
                        {memorizations.surahParts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {memorizations.surahParts.map(s => (
                                    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-5 group flex justify-between items-center transition-all hover-glow">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner">
                                                <span className="text-sm font-black italic">S</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black uppercase tracking-tight">{s.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusIndicator status={s.status || 'bon'} />
                                                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{levels[s.level]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveItem('surahPart', s)} className="p-2 rounded-lg hover:bg-danger/10 text-text-main/10 hover:text-danger transition-all opacity-0 group-hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center glass-card border-none bg-bg-main/30">
                                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noMemorizedSurahs')}</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="hadith" className="space-y-4 outline-none">
                        {memorizedHadiths.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {memorizedHadiths.map(h => {
                                    const status = activeProfile.hadithProgress?.[h.id] || 'non_lu';
                                    return (
                                        <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-5 group flex justify-between items-center transition-all hover-glow cursor-pointer" onClick={() => setSelectedHadith(h)}>
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner">
                                                    <span className="text-sm font-black">{h.id}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold font-amiri rtl text-right truncate opacity-60 mb-1">{h.arabic}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <StatusIndicator status={status} />
                                                        <span className="text-[10px] font-bold text-accent-color uppercase tracking-widest">{hadithStatusText[status]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center glass-card border-none bg-bg-main/30">
                                <p className="text-xs font-black uppercase tracking-[0.3em] opacity-20">{t('noMemorizedHadiths')}</p>
                            </div>
                        )}
                    </TabsContent>
                </AnimatePresence>
            </Tabs>

            {/* Modals with Premium Styling */}
            <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)}>
                {modalContent && (
                    <div className="space-y-6">
                        <header className="border-b border-border-main pb-4">
                            <h3 className="text-2xl font-black text-gradient">{modalContent.title}</h3>
                        </header>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                            {modalContent.items.map((item, index) => (
                                <div key={item.name + index} className='flex justify-between items-center p-4 rounded-2xl bg-bg-secondary border border-border-main/50'>
                                    <div className="flex items-center gap-3">
                                        <StatusIndicator status={item.status || 'bon'} />
                                        <span className="text-sm font-bold">{item.name}</span>
                                    </div>
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${levelClasses[item.level]}`}>{levels[item.level]}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="accent" onClick={() => setModalContent(null)} className="w-full h-12">Fermer</Button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!selectedHadith} onClose={() => setSelectedHadith(null)}>
                {selectedHadith && (
                    <div className="space-y-8">
                        <header className="flex items-center justify-between border-b border-border-main pb-4">
                            <h3 className="text-2xl font-black text-gradient">{t('hadithNumber', { number: selectedHadith.id })}</h3>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Collection Arba'in</span>
                        </header>
                        <div className="space-y-6 text-left max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                            <div className="p-8 glass-card border-none bg-accent-color/5 shadow-inner">
                                <p className='font-amiri text-2xl rtl text-right leading-loose text-text-main/90'>{selectedHadith.arabic}</p>
                            </div>
                            <div className="p-6 rounded-2xl border border-dashed border-border-main text-sm md:text-base italic leading-relaxed text-text-secondary">
                                "{selectedHadith.translations[state.settings.lang as keyof typeof selectedHadith.translations] || selectedHadith.translations.en}"
                            </div>
                            <div className='pt-8 border-t border-border-main'>
                                <h4 className='text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6 text-center'>{t('updateStatus')}</h4>
                                <div className='grid grid-cols-2 gap-3'>
                                    <Button variant='secondary' className="h-12 text-xs font-black uppercase" onClick={() => handleHadithStatusChange(selectedHadith.id, 'lu')}>{t('statusLu')}</Button>
                                    <Button variant='secondary' className="h-12 text-xs font-black uppercase border-blue-500/30 text-blue-600" onClick={() => handleHadithStatusChange(selectedHadith.id, 'en_memorisation')}>{t('statusEnMemorisation')}</Button>
                                    <Button variant='secondary' className="h-12 text-xs font-black uppercase border-orange-500/30 text-orange-600" onClick={() => handleHadithStatusChange(selectedHadith.id, 'a_reprendre')}>{t('statusARependre')}</Button>
                                    <Button variant='accent' className="h-12 text-xs font-black uppercase" onClick={() => handleHadithStatusChange(selectedHadith.id, 'acquis')}>{t('statusAcquis')}</Button>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={() => setSelectedHadith(null)} className="w-full">Fermer</Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MemorizationView;