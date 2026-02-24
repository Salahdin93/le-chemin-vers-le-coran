import React, { useState } from 'react';
import Card, { CardHeader } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { JUZ_DATA, HIZB_DATA, MEMORIZATION_SURAH_OPTIONS } from '@/constants/quranData';
import { MemorizationLevel, MemorizationStatus, MemorizedHizb, MemorizedJuzz, MemorizedSurahPart } from '@/types';
import { motion } from 'framer-motion';

type SelectionMode = 'juzz' | 'hizb' | 'surahPart';

const MemorizationSettingsView: React.FC = () => {
    const { dispatch, t } = useStore();
    const [mode, setMode] = useState<SelectionMode>('juzz');
    const [selectedLevel, setSelectedLevel] = useState<MemorizationLevel>('bon');

    const handleToggleAll = (isSelected: boolean) => {
        if (!window.confirm(isSelected ? t('confirmAllMemorized') : t('confirmAllNotMemorized'))) return;

        if (mode === 'surahPart') {
            MEMORIZATION_SURAH_OPTIONS.forEach(s => {
                const item: MemorizedSurahPart = { ...s, level: selectedLevel, status: selectedLevel === 'moyen' ? 'moyen' : selectedLevel };
                dispatch({ type: isSelected ? 'ADD_MEMORIZATION' : 'REMOVE_MEMORIZATION', payload: { type: 'surahPart', item } });
            });
        } else if (mode === 'hizb') {
            HIZB_DATA.forEach(h => {
                const hizbNum = Number(h.name);
                const surahPartsInHizb = MEMORIZATION_SURAH_OPTIONS.filter(opt => opt.hizbs.includes(hizbNum));
                const componentSurahParts: MemorizedSurahPart[] = surahPartsInHizb.map(p => ({ id: p.id, name: p.name, level: selectedLevel, status: selectedLevel === 'moyen' ? 'moyen' : selectedLevel, originalSurahId: p.originalSurahId }));
                const item: MemorizedHizb = { number: h.name, details: h.details, level: selectedLevel, status: selectedLevel === 'moyen' ? 'moyen' : selectedLevel, componentSurahParts };
                dispatch({ type: isSelected ? 'ADD_MEMORIZATION' : 'REMOVE_MEMORIZATION', payload: { type: 'hizb', item } });
            });
        } else if (mode === 'juzz') {
            JUZ_DATA.forEach(j => {
                const hizb1Num = ((j.id - 1) * 2 + 1).toString();
                const hizb2Num = ((j.id - 1) * 2 + 2).toString();
                const hizb1Details = HIZB_DATA.find(h => h.name === hizb1Num)?.details || '';
                const hizb2Details = HIZB_DATA.find(h => h.name === hizb2Num)?.details || '';
                const item: MemorizedJuzz = { number: j.id, level: selectedLevel, status: selectedLevel === 'moyen' ? 'moyen' : selectedLevel, componentHizbs: [{ number: hizb1Num, details: hizb1Details, level: selectedLevel, status: selectedLevel === 'moyen' ? 'moyen' : selectedLevel }, { number: hizb2Num, details: hizb2Details, level: selectedLevel, status: selectedLevel === 'moyen' ? 'moyen' : selectedLevel }] };
                dispatch({ type: isSelected ? 'ADD_MEMORIZATION' : 'REMOVE_MEMORIZATION', payload: { type: 'juzz', item } });
            });
        }
    };

    const renderSelectionList = () => {
        let items: any[] = [];
        if (mode === 'surahPart') items = MEMORIZATION_SURAH_OPTIONS;
        else if (mode === 'hizb') items = HIZB_DATA;
        else if (mode === 'juzz') items = JUZ_DATA;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, index) => {
                    const label = mode === 'surahPart' ? item.name : (mode === 'hizb' ? `${t('hizb')} ${item.name}` : `${t('juzz')} ${item.id}`);
                    const subLabel = mode === 'hizb' ? item.details : '';

                    return (
                        <div key={index} className="flex items-center justify-between p-3 bg-bg-secondary border border-border-main rounded-xl hover:border-primary/50 transition-colors">
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{label}</span>
                                {subLabel && <span className="text-xs opacity-60">{subLabel}</span>}
                            </div>
                            <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                                    let payload: any;
                                    const status: MemorizationStatus = selectedLevel === 'moyen' ? 'moyen' : selectedLevel;
                                    if (mode === 'surahPart') payload = { type: 'surahPart', item: { ...item, level: selectedLevel, status } };
                                    else if (mode === 'hizb') {
                                        const hizbNum = Number(item.name);
                                        const surahPartsInHizb = MEMORIZATION_SURAH_OPTIONS.filter(opt => opt.hizbs.includes(hizbNum));
                                        const componentSurahParts: MemorizedSurahPart[] = surahPartsInHizb.map(p => ({ id: p.id, name: p.name, level: selectedLevel, status, originalSurahId: p.originalSurahId }));
                                        payload = { type: 'hizb', item: { number: item.name, details: item.details, level: selectedLevel, status, componentSurahParts } };
                                    }
                                    else if (mode === 'juzz') {
                                        const hizb1Num = ((item.id - 1) * 2 + 1).toString();
                                        const hizb2Num = ((item.id - 1) * 2 + 2).toString();
                                        const hizb1Details = HIZB_DATA.find(h => h.name === hizb1Num)?.details || '';
                                        const hizb2Details = HIZB_DATA.find(h => h.name === hizb2Num)?.details || '';
                                        payload = { type: 'juzz', item: { number: item.id, level: selectedLevel, status, componentHizbs: [{ number: hizb1Num, details: hizb1Details, level: selectedLevel, status }, { number: hizb2Num, details: hizb2Details, level: selectedLevel, status }] } };
                                    }
                                    dispatch({ type: 'ADD_MEMORIZATION', payload });
                                }}>✅</Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                                    let payload: any;
                                    if (mode === 'surahPart') payload = { type: 'surahPart', item };
                                    else if (mode === 'hizb') payload = { type: 'hizb', item: { number: item.name } };
                                    else if (mode === 'juzz') payload = { type: 'juzz', item: { number: item.id } };
                                    dispatch({ type: 'REMOVE_MEMORIZATION', payload });
                                }}>❌</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
                <CardHeader icon="📝">{t('quickMemorizationSet')}</CardHeader>
                <div className="p-4 space-y-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {(['juzz', 'hizb', 'surahPart'] as SelectionMode[]).map(m => (
                                <Button key={m} variant={mode === m ? 'primary' : 'secondary'} size="sm" onClick={() => setMode(m)}>
                                    {t(m)}
                                </Button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-2 p-4 bg-bg-main rounded-2xl border border-dashed border-border-main">
                            <span className="text-sm font-bold">{t('masteryLevelForShortcuts')}</span>
                            <Select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value as MemorizationLevel)} className="max-w-xs">
                                <option value="excellent">{t('excellent')}</option>
                                <option value="bon">{t('bon')}</option>
                                <option value="moyen">{t('moyen')}</option>
                            </Select>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="success" onClick={() => handleToggleAll(true)}>{t('allMemorized')}</Button>
                                <Button size="sm" variant="danger" onClick={() => handleToggleAll(false)}>{t('allNotMemorized')}</Button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border-main">
                        {renderSelectionList()}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};

export default MemorizationSettingsView;