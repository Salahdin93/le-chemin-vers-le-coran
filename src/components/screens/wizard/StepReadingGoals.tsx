import React from 'react';
import { WizardData } from '@/types';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { SimpleCheckbox } from '@/components/ui/Checkbox';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepReadingGoals: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <div className="space-y-4">
            <Select
                label={t('duration')}
                value={formData.duration || 30}
                onChange={(e) => updateData({ duration: parseInt(e.target.value) })}
            >
                {[7, 10, 15, 20, 30, 40, 60, 90, 120].map(d => <option key={d} value={d}>{d} jours</option>)}
            </Select>
            <Input
                label={t('khatmas')}
                type="number"
                min="1"
                value={formData.khatmas || 1}
                onChange={(e) => updateData({ khatmas: parseInt(e.target.value) || 1 })}
            />
            <SimpleCheckbox
                label={t('kahfOption')}
                checked={!!formData.kahfOption}
                onChange={(e) => updateData({ kahfOption: e.target.checked })}
            />
            {formData.kahfOption && (
                <Input
                    label={t('kahfPages')}
                    type="number"
                    min="0"
                    value={formData.kahfPages || 0}
                    onChange={(e) => updateData({ kahfPages: parseInt(e.target.value) || 0 })}
                />
            )}
        </div>
    );
};

export default StepReadingGoals;