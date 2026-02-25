import React from 'react';
import { WizardData, RevisionMode } from '@/types';
import { HIZB_DATA, JUZ_DATA, FULL_SURAH_LIST } from '@/constants/quranData';
import { clsx } from 'clsx';
import Input from '@/components/ui/Input';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    toggleSelection: (id: string, list: 'revisionSelection' | 'boosterSurahs') => void;
    t: (key: string) => string;
}

const StepRevisionSelection: React.FC<StepProps> = ({ formData, updateData, toggleSelection, t }) => {

    const getItemsForMode = (mode: RevisionMode) => {
        if (mode === 'hizb') {
            return HIZB_DATA.map((h, i) => ({ id: i.toString(), name: `${t('hizb')} ${h.name}`, details: h.details }));
        }
        if (mode === 'juzz') {
            return JUZ_DATA.map(j => ({ id: j.id.toString(), name: `${t('juzz')} ${j.id}`, details: undefined as string | undefined }));
        }
        return FULL_SURAH_LIST.map(s => ({ id: s.id.toString(), name: `${s.id}. ${s.name}`, details: undefined as string | undefined }));
    };

    const handleSelectAll = (listName: 'revisionSelection' | 'boosterSurahs') => {
        const mode = listName === 'revisionSelection' ? formData.revisionMode! : 'sourate';
        const allItemIds = getItemsForMode(mode).map(item => item.id);
        updateData({ [listName]: allItemIds });
    };

    const handleDeselectAll = (listName: 'revisionSelection' | 'boosterSurahs') => {
        updateData({ [listName]: [] });
    };

    const renderGridSelection = (mode: RevisionMode, listName: 'revisionSelection' | 'boosterSurahs') => {
        const items = getItemsForMode(mode);
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-white/10 rounded-xl bg-white/5 custom-scrollbar">
                {items.map(item => (
                    <div key={item.id} onClick={() => toggleSelection(item.id, listName)}
                        className={clsx('p-2 text-[11px] text-center border rounded-lg cursor-pointer transition-all duration-200',
                            formData[listName]?.includes(item.id)
                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                : 'border-white/5 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20')}>
                        <p className='font-black uppercase tracking-wider'>{item.name}</p>
                        {item.details && <p className='opacity-50 text-[9px] mt-0.5'>{item.details}</p>}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 text-left">
            <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/90 block mb-3">{t('revisionMode')}</label>
                <div className="flex gap-2 flex-wrap">
                    {(['hizb', 'juzz', 'sourate'] as RevisionMode[]).map(mode =>
                        <button
                            key={mode}
                            type="button"
                            className={clsx(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200",
                                formData.revisionMode === mode
                                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                    : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                            )}
                            onClick={() => updateData({ revisionMode: mode, revisionSelection: [] })}
                        >
                            {t(mode === 'sourate' ? 'revModeSurah' : `revMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-end gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                    {formData.revisionSelection?.length || 0} {t('selected')}
                </span>
                <div className="flex gap-3">
                    <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 hover:text-emerald-200" onClick={() => handleSelectAll('revisionSelection')}>
                        {t('selectAll')}
                    </button>
                    <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60" onClick={() => handleDeselectAll('revisionSelection')}>
                        {t('deselectAll')}
                    </button>
                </div>
            </div>

            {renderGridSelection(formData.revisionMode!, 'revisionSelection')}

            <div>
                <div className="flex justify-between items-end gap-2 mt-6 mb-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/90 ml-1">{t('boosterSurah')}</label>
                    <div className="flex gap-3">
                        <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 hover:text-emerald-200" onClick={() => handleSelectAll('boosterSurahs')}>
                            {t('selectAll')}
                        </button>
                        <button type="button" className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60" onClick={() => handleDeselectAll('boosterSurahs')}>
                            {t('deselectAll')}
                        </button>
                    </div>
                </div>
                {renderGridSelection('sourate', 'boosterSurahs')}
            </div>

            {formData.boosterSurahs && formData.boosterSurahs.length > 0 && (
                <Input
                    label={t('boosterSurahFreq')}
                    type="number" min="1"
                    value={formData.boosterSurahFreq}
                    onChange={e => updateData({ boosterSurahFreq: parseInt(e.target.value) || 1 })}
                    variant="wizard"
                />
            )}
        </div>
    );
};

export default StepRevisionSelection;