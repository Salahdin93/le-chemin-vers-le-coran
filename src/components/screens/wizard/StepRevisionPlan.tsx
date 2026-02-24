import React from 'react';
import { WizardData, RevisionFrequency } from '@/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/Checkbox';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    updateFreq: (freq: Partial<RevisionFrequency>) => void;
    t: (key: string, replacements?: any) => string;
}

const StepRevisionPlan: React.FC<StepProps> = ({ formData, updateData, updateFreq, t }) => {
    const weekDays = JSON.parse(t('dayOfWeek') as string);

    return (
        <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('unitsPerDay')} type="number" min="1" value={formData.unitsPerDay || 1} onChange={e => updateData({ unitsPerDay: parseInt(e.target.value) || 1 })} />
                <Input label={t('revisionDuration')} type="number" min="1" value={formData.revisionDuration || 30} onChange={e => updateData({ revisionDuration: parseInt(e.target.value) || 1 })} />
            </div>
            <div>
                <label className="font-semibold block mb-2">{t('revisionFrequency')}</label>
                <div className="flex gap-2 flex-wrap">
                    <Button size='sm' variant={formData.revisionFrequency?.type === 'daily' ? 'primary' : 'secondary'} onClick={() => updateFreq({ type: 'daily' })}>{t('freqDaily')}</Button>
                    <Button size='sm' variant={formData.revisionFrequency?.type === 'weekly' ? 'primary' : 'secondary'} onClick={() => updateFreq({ type: 'weekly', value: 0 })}>{t('freqWeekly')}</Button>
                    <Button size='sm' variant={formData.revisionFrequency?.type === 'custom' ? 'primary' : 'secondary'} onClick={() => updateFreq({ type: 'custom', value: 2 })}>{t('freqCustom')}</Button>
                </div>
            </div>
            {formData.revisionFrequency?.type === 'weekly' && (
                <Select value={formData.revisionFrequency.value as number} onChange={e => updateFreq({ value: parseInt(e.target.value) })}>
                    {weekDays.map((day: string, i: number) => <option key={i} value={i}>{day}</option>)}
                </Select>
            )}
            {formData.revisionFrequency?.type === 'custom' && (
                <Input
                    type='number'
                    min={2}
                    value={(formData.revisionFrequency.value as number) > 1 ? (formData.revisionFrequency.value as number) : 2}
                    onChange={e => updateFreq({ value: parseInt(e.target.value) || 2 })}
                    placeholder={t('everyXDays', { count: 'X' })}
                />
            )}
            <div className="pt-4 border-t border-dashed">
                <ToggleSwitch
                    label="Prioriser les points faibles"
                    checked={formData.prioritizeWeaknesses || false}
                    onChange={(e) => updateData({ prioritizeWeaknesses: e.target.checked })}
                    description="Augmente la fréquence de révision pour les éléments marqués comme 'Moyen' ou 'À revoir'."
                />
            </div>
        </div>
    );
};

export default StepRevisionPlan;