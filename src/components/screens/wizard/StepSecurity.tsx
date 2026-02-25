import React from 'react';
import { WizardData } from '@/types';
import Input from '@/components/ui/Input';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepSecurity: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <div className="space-y-4">
            <Input
                label={t('createPassword')}
                type="password"
                value={formData.password || ''}
                onChange={e => updateData({ password: e.target.value })}
                variant="wizard"
            />
            <Input
                label={t('confirmPassword')}
                type="password"
                value={formData.passwordConfirm || ''}
                onChange={e => updateData({ passwordConfirm: e.target.value })}
                variant="wizard"
            />
        </div>
    );
};

export default StepSecurity;