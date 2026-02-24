import React from 'react';
import { WizardData } from '@/types';
import { SimpleCheckbox } from '@/components/ui/Checkbox';
import { LOGO_URL } from '@/constants/ui';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepTerms: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <>
            <div className='text-left text-sm max-h-40 overflow-y-auto p-3 border border-border-main rounded-lg bg-bg-main'>
                <img src={LOGO_URL} alt="Logo" className="block mx-auto w-24 mb-4" />
                <p>{t('termsTextP1')}</p>
                <p className="text-danger font-bold my-2">{t('termsTextP2')}</p>
                <p>{t('termsTextP3')}</p>
            </div>
            <SimpleCheckbox
                className="mt-4 justify-center"
                label={t('acceptTerms')}
                checked={!!formData.termsAccepted}
                onChange={e => updateData({ termsAccepted: e.target.checked })}
            />
        </>
    );
};

export default StepTerms;