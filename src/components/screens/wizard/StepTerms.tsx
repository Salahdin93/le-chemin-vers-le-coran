import React from 'react';
import { WizardData } from '@/types';
import { SimpleCheckbox } from '@/components/ui/Checkbox';
import { LOGO_URL_DARK } from '@/constants/ui';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepTerms: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <>
            <div
                className='text-left text-sm max-h-48 overflow-y-auto p-4 rounded-2xl'
                style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: '1.7',
                }}
            >
                <img src={LOGO_URL_DARK} alt="Logo" className="block mx-auto w-16 mb-4 opacity-80" />
                <p>{t('termsTextP1')}</p>
                <p className="text-red-300 font-bold my-2">{t('termsTextP2')}</p>
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
