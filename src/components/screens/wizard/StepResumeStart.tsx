import React from 'react';
import { WizardData } from '@/types';
import Input from '@/components/ui/Input';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepResumeStart: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <div>
            <Input
                label={t('resumeDayPrompt')}
                type="number"
                min="1"
                value={formData.resumeDay || 1}
                onChange={e => updateData({ resumeDay: parseInt(e.target.value) || 1 })}
            />
        </div>
    );
};

export default StepResumeStart;