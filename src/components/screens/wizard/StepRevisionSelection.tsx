import React from 'react';
import { WizardData, RevisionMode } from '@/types';
import { HIZB_DATA, JUZ_DATA, FULL_SURAH_LIST } from '@/constants/quranData';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
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
            return JUZ_DATA.map(j => ({ id: j.id.toString(), name: `${t('juzz')} ${j.id}` }));
        }
        return FULL_SURAH_LIST.map(s => ({ id: s.id.toString(), name: `${s.id}. ${s.name}` }));
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-border-main rounded-lg bg-bg-main">
                {items.map(item => (
                    <div key={item.id} onClick={() => toggleSelection(item.id, listName)}
                        className={clsx('p-1.5 text-xs text-center border rounded-md cursor-pointer transition-colors',
                            formData[listName]?.includes(item.id) ? 'bg-primary text-white border-primary' : 'border-border-main hover:bg-border-main')}>
                        <p className='font-semibold'>{item.name}</p>
                        {item.details && <p className='opacity-70 text-[10px]'>{item.details}</p>}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-4 text-left">
            <div>
                <label className="font-semibold">{t('revisionMode')}</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                    {(['hizb', 'juzz', 'sourate'] as RevisionMode[]).map(mode =>
                        <Button key={mode} size="sm" variant={formData.revisionMode === mode ? 'primary' : 'secondary'} onClick={() => updateData({ revisionMode: mode, revisionSelection: [] })}>
                            {t(mode === 'sourate' ? 'revModeSurah' : `revMode${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
                <Button size="xs" variant="ghost" onClick={() => handleSelectAll('revisionSelection')}>
                    Tout Sélectionner
                </Button>
                <Button size="xs" variant="ghost" onClick={() => handleDeselectAll('revisionSelection')}>
                    Tout Désélectionner
                </Button>
            </div>

            {renderGridSelection(formData.revisionMode!, 'revisionSelection')}

            <div>
                <label className="font-semibold block mt-3">{t('boosterSurah')}</label>
                <div className="flex justify-end gap-2 mt-2">
                    <Button size="xs" variant="ghost" onClick={() => handleSelectAll('boosterSurahs')}>
                        Tout Sélectionner
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => handleDeselectAll('boosterSurahs')}>
                        Tout Désélectionner
                    </Button>
                </div>
                {renderGridSelection('sourate', 'boosterSurahs')}
            </div>
            
            {formData.boosterSurahs && formData.boosterSurahs.length > 0 && (
                <Input
                    label={t('boosterSurahFreq')}
                    type="number" min="1"
                    value={formData.boosterSurahFreq}
                    onChange={e => updateData({ boosterSurahFreq: parseInt(e.target.value) || 1 })}
                />
            )}
        </div>
    );
};

export default StepRevisionSelection;