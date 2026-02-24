import React from 'react';
import { WizardData, Theme } from '@/types';
import { THEMES, COLORS } from '@/constants/ui';
import { ToggleSwitch } from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepAppearance: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <div className="space-y-4 text-left">
            <ToggleSwitch
                label={t('enableNotifications')}
                checked={!!formData.enableNotifications}
                onChange={e => updateData({ enableNotifications: e.target.checked })}
            />
            <div>
                <label className='font-semibold block mb-2'>{t('theme')}</label>
                <Select value={formData.theme} onChange={e => updateData({ theme: e.target.value as Theme })}>
                    {THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.icon} {t(theme.id)}</option>)}
                </Select>
            </div>
            <div>
                <label className='font-semibold block mb-2'>{t('accentColor')}</label>
                <div className='grid grid-cols-8 gap-2'>
                    {COLORS.map(color => (
                        <button
                            type="button"
                            key={color}
                            style={{ backgroundColor: color }}
                            className={`w-8 h-8 rounded-full border-2 ${formData.accentColor === color ? 'border-text-main' : 'border-transparent'}`}
                            onClick={() => updateData({ accentColor: color })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StepAppearance;