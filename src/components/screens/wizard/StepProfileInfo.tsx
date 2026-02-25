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
                variant="wizard"
            />
            <div className="mt-6">
                <label
                    className="block mb-3 font-black text-sm uppercase tracking-widest text-left text-white/90"
                >
                    {t('gender')}
                </label>
                <div className="flex gap-4">
                    <label
                        className="flex-1 p-4 rounded-2xl cursor-pointer text-center font-bold text-sm transition-all duration-300 relative overflow-hidden"
                        style={{
                            background: formData.gender === 'male'
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                                : 'rgba(255,255,255,0.06)',
                            border: formData.gender === 'male'
                                ? '1px solid rgba(52,211,153,0.5)'
                                : '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            boxShadow: formData.gender === 'male' ? '0 0 20px rgba(52,211,153,0.2)' : 'none',
                        }}
                    >
                        <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => updateData({ gender: 'male' })} className="hidden" />
                        <span className="flex items-center justify-center gap-2">👳‍♂️ {t('male')}</span>
                    </label>
                    <label
                        className="flex-1 p-4 rounded-2xl cursor-pointer text-center font-bold text-sm transition-all duration-300 relative overflow-hidden"
                        style={{
                            background: formData.gender === 'female'
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(52,211,153,0.15))'
                                : 'rgba(255,255,255,0.06)',
                            border: formData.gender === 'female'
                                ? '1px solid rgba(52,211,153,0.5)'
                                : '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            boxShadow: formData.gender === 'female' ? '0 0 20px rgba(52,211,153,0.2)' : 'none',
                        }}
                    >
                        <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => updateData({ gender: 'female' })} className="hidden" />
                        <span className="flex items-center justify-center gap-2">🧕 {t('female')}</span>
                    </label>
                </div>
            </div>
        </>
    );
};

export default StepProfileInfo;
