import React from 'react';
import { WizardData, RevisionFrequency } from '@/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ToggleSwitch } from '@/components/ui/Checkbox';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    updateFreq: (freq: Partial<RevisionFrequency>) => void;
    t: (key: string, replacements?: any) => string;
}

const FreqBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200"
        style={{
            background: active
                ? 'linear-gradient(135deg, #059669, #10b981)'
                : 'rgba(255,255,255,0.07)',
            border: active ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: active ? '#fff' : 'rgba(255,255,255,0.6)',
            boxShadow: active ? '0 0 16px rgba(52,211,153,0.3)' : 'none',
        }}
    >
        {children}
    </button>
);

const StepRevisionPlan: React.FC<StepProps> = ({ formData, updateData, updateFreq, t }) => {
    const weekDays = JSON.parse(t('dayOfWeek') as string);

    return (
        <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('unitsPerDay')} type="number" min="1" value={formData.unitsPerDay || 1} onChange={e => updateData({ unitsPerDay: parseInt(e.target.value) || 1 })} variant="wizard" />
                <Input label={t('revisionDuration')} type="number" min="1" value={formData.revisionDuration || 30} onChange={e => updateData({ revisionDuration: parseInt(e.target.value) || 1 })} variant="wizard" />
            </div>
            <div>
                <label className="font-black text-xs uppercase tracking-widest block mb-3 text-white/90">
                    {t('revisionFrequency')}
                </label>
                <div className="flex gap-2 flex-wrap">
                    <FreqBtn active={formData.revisionFrequency?.type === 'daily'} onClick={() => updateFreq({ type: 'daily' })}>{t('freqDaily')}</FreqBtn>
                    <FreqBtn active={formData.revisionFrequency?.type === 'weekly'} onClick={() => updateFreq({ type: 'weekly', value: 0 })}>{t('freqWeekly')}</FreqBtn>
                    <FreqBtn active={formData.revisionFrequency?.type === 'custom'} onClick={() => updateFreq({ type: 'custom', value: 2 })}>{t('freqCustom')}</FreqBtn>
                </div>
            </div>
            {formData.revisionFrequency?.type === 'weekly' && (
                <Select value={formData.revisionFrequency.value as number} onChange={e => updateFreq({ value: parseInt(e.target.value) })} variant="wizard">
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
                    variant="wizard"
                />
            )}
            <div className="pt-4" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                <ToggleSwitch
                    label={t('prioritizeWeaknesses')}
                    checked={formData.prioritizeWeaknesses || false}
                    onChange={(e) => updateData({ prioritizeWeaknesses: e.target.checked })}
                    description={t('prioritizeWeaknessesDesc')}
                    className="bg-transparent border-none p-0"
                    variant="wizard"
                />
            </div>
        </div>
    );
};

export default StepRevisionPlan;
