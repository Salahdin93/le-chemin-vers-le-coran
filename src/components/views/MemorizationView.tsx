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
            <div className="mt-4 p-4 border-t border-dashed border-border-main space-y-3">
                <Select onChange={e => setSelectedItemId(e.target.value)} defaultValue={selectedItemId}><option value="" disabled>{t('select')}</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
                <Select onChange={e => setSelectedLevel(e.target.value as MemorizationLevel)} defaultValue={selectedLevel}><option value="bon">{levels.bon}</option><option value="excellent">{levels.excellent}</option><option value="moyen">{levels.moyen}</option></Select>
                <div className="flex gap-2"><Button onClick={handleAddItem} className="flex-1" disabled={!selectedItemId}>{t('add')}</Button><Button variant="ghost" className="flex-1" onClick={() => setFormType(null)}>Annuler</Button></div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>{t('memorizedTitle')}</CardHeader>
            <Tabs defaultValue="juzz" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="juzz">{t('memorizedJuzz')}</TabsTrigger>
                    <TabsTrigger value="hizb">{t('memorizedHizbs')}</TabsTrigger>
                    <TabsTrigger value="surah">{t('memorizedSurahs')}</TabsTrigger>
                    <TabsTrigger value="hadith">{t('hadith')}</TabsTrigger>
                </TabsList>

                <TabsContent value="juzz" className="p-6 space-y-2">
                    {memorizations.juzz.length > 0 ? memorizations.juzz.map(j => (
                        <div key={j.number} className='group flex justify-between items-center p-2 rounded-md border border-border-main'>
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => showJuzzDetails(j)}>
                                <StatusIndicator status={j.status || 'bon'} />
                                <span>{t('juzz')} {j.number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${levelClasses[j.level]}`}>{levels[j.level]}</span>
                                <button onClick={() => handleRemoveItem('juzz', j)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" aria-label={`Supprimer Juzz ${j.number}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                </button>
                            </div>
                        </div>
                    )) : <p className='text-sm opacity-70 p-2 text-center'>{t('noMemorizedJuzz')}</p>}
                </TabsContent>

                <TabsContent value="hizb" className="p-6 space-y-2">
                    {memorizations.hizbs.length > 0 ? memorizations.hizbs.map(h => (
                        <div key={h.number} className='group flex justify-between items-center p-2 rounded-md border border-border-main'>
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => showHizbDetails(h)}>
                                <StatusIndicator status={h.status || 'bon'} />
                                <span>{t('hizb')} {h.number} - {h.details}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${levelClasses[h.level]}`}>{levels[h.level]}</span>
                                <button onClick={() => handleRemoveItem('hizb', h)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" aria-label={`Supprimer Hizb ${h.number}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                </button>
                            </div>
                        </div>
                    )) : <p className='text-sm opacity-70 p-2 text-center'>{t('noMemorizedHizbs')}</p>}
                </TabsContent>

                <TabsContent value="surah" className="p-6 space-y-2">
                    {memorizations.surahParts.length > 0 ? memorizations.surahParts.map(s => (
                        <div key={s.id} className='group flex justify-between items-center p-2 rounded-md border border-border-main hover:bg-bg-main'>
                            <div className="flex items-center gap-3">
                                <StatusIndicator status={s.status || 'bon'} />
                                <span>{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${levelClasses[s.level]}`}>{levels[s.level]}</span>
                                <button onClick={() => handleRemoveItem('surahPart', s)} className="text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all" aria-label={`Supprimer ${s.name}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" /><path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" /></svg>
                                </button>
                            </div>
                        </div>
                    )) : <p className='text-sm opacity-70 p-2 text-center'>{t('noMemorizedSurahs')}</p>}
                </TabsContent>

                <TabsContent value="hadith" className="p-6 space-y-2">
                    {memorizedHadiths.length > 0 ? memorizedHadiths.map(h => {
                        const status = activeProfile.hadithProgress?.[h.id] || 'non_lu';
                        return (
                            <div key={h.id} className='flex justify-between items-center p-2 rounded-md border border-border-main hover:bg-bg-main cursor-pointer' onClick={() => setSelectedHadith(h)}>
                                <div className="flex items-center gap-3">
                                    <StatusIndicator status={status} />
                                    <span>{t('hadithNumber', { number: h.id })}: <span className='font-amiri rtl inline-block ml-2'>{h.arabic.substring(0, 40)}...</span></span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary`}>{hadithStatusText[status]}</span>
                            </div>
                        )
                    }) : <p className='text-sm opacity-70 p-2 text-center'>{t('noMemorizedHadiths')}</p>}
                </TabsContent>
            </Tabs>

            <div className="p-6 mt-6 border-t border-border-main">
                {formType ? renderForm() : (
                    <div className="flex flex-col md:flex-row gap-2">
                        <Button variant="secondary" className="flex-1" onClick={() => setFormType('surahPart')}>➕ {t('addMemorizedSurah')}</Button>
                        <Button variant="secondary" className="flex-1" onClick={() => setFormType('hizb')}>➕ {t('addMemorizedHizb')}</Button>
                        <Button variant="secondary" className="flex-1" onClick={() => setFormType('juzz')}>➕ {t('addMemorizedJuzz')}</Button>
                    </div>
                )}
            </div>

            <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)}>
                {modalContent && <>
                    <h3 className="text-xl font-bold mb-4">{modalContent.title}</h3>
                    <div className="space-y-2 text-left max-h-60 overflow-y-auto">
                        {modalContent.items.map((item, index) => (
                            <div key={item.name + index} className='flex justify-between items-center p-2 rounded bg-bg-main'>
                                <div className="flex items-center gap-3">
                                    <StatusIndicator status={item.status || 'bon'} />
                                    <span>{item.name}</span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${levelClasses[item.level]}`}>{levels[item.level]}</span>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => setModalContent(null)} className="mt-6 w-full">Fermer</Button>
                </>}
            </Modal>

            <Modal isOpen={!!selectedHadith} onClose={() => setSelectedHadith(null)}>
                {selectedHadith && <>
                    <h3 className="text-xl font-bold mb-4">{t('hadithNumber', { number: selectedHadith.id })}</h3>
                    <div className="space-y-4 text-left max-h-[60vh] overflow-y-auto p-1">
                        <p className='font-amiri text-lg rtl leading-relaxed'>{selectedHadith.arabic}</p>
                        <div className="p-3 bg-bg-main rounded-lg border border-border-main text-sm italic">
                            <p>"{selectedHadith.translations[state.settings.lang as keyof typeof selectedHadith.translations] || selectedHadith.translations.en}"</p>
                        </div>
                        <div className='pt-4 border-t border-dashed'>
                            <h4 className='font-semibold mb-2'>{t('updateStatus')}</h4>
                            <div className='grid grid-cols-2 gap-2'>
                                <Button variant='primary' onClick={() => handleHadithStatusChange(selectedHadith.id, 'lu')}>{t('statusLu')}</Button>
                                <Button variant='secondary' onClick={() => handleHadithStatusChange(selectedHadith.id, 'en_memorisation')}>{t('statusEnMemorisation')}</Button>
                                <Button variant='warning' onClick={() => handleHadithStatusChange(selectedHadith.id, 'a_reprendre')}>{t('statusARependre')}</Button>
                                <Button variant='success' onClick={() => handleHadithStatusChange(selectedHadith.id, 'acquis')}>{t('statusAcquis')}</Button>
                            </div>
                        </div>
                    </div>
                    <Button onClick={() => setSelectedHadith(null)} className="mt-6 w-full">Fermer</Button>
                </>}
            </Modal>
        </Card>
    );
};

export default MemorizationView;