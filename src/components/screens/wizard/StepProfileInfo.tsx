import React from 'react';
import { WizardData } from '@/types';
import Input from '@/components/ui/Input';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepProfileInfo: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <>
            <Input 
                label={t('nameKunya')} 
                value={formData.name || ''} 
                onChange={e => updateData({ name: e.target.value })} 
                placeholder="Ex: Abou Soulayman" 
            />
            <div className="mt-4">
                <label className="block mb-2 font-semibold text-text-main text-left">{t('gender')}</label>
                <div className="flex gap-4">
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer text-center ${formData.gender === 'male' ? 'border-primary bg-primary/10' : 'border-border-main'}`}>
                        <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => updateData({ gender: 'male' })} className="hidden" />
                        <span>👳‍♂️ {t('male')}</span>
                    </label>
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer text-center ${formData.gender === 'female' ? 'border-primary bg-primary/10' : 'border-border-main'}`}>
                        <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => updateData({ gender: 'female' })} className="hidden" />
                        <span>🧕 {t('female')}</span>
                    </label>
                </div>
            </div>
        </>
    );
};

export default StepProfileInfo;