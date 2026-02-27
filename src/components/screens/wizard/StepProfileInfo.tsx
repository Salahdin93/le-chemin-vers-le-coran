import React from 'react';
import { WizardData } from '@/types';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';

const SKIN_TONES = ['#FFE0BD', '#F1C27D', '#E0AC69', '#8D5524', '#3D2415'];

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
                    {t('gender')} & Avatar
                </label>
                <div className="flex gap-4 mb-6">
                    <label
                        className="flex-1 p-4 rounded-2xl cursor-pointer text-center font-bold transition-all duration-300 relative overflow-hidden flex flex-col items-center gap-3"
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
                        <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => updateData({ gender: 'male', avatar: { gender: 'male_beard', skinTone: formData.avatar?.skinTone || '#E0AC69' } })} className="hidden" />
                        <div className="w-16 h-16 bg-white/10 rounded-full p-2">
                            <Avatar config={{ gender: 'male_beard', skinTone: formData.avatar?.skinTone || '#E0AC69' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest">{t('male')}</span>
                    </label>
                    <label
                        className="flex-1 p-4 rounded-2xl cursor-pointer text-center font-bold transition-all duration-300 relative overflow-hidden flex flex-col items-center gap-3"
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
                        <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => updateData({ gender: 'female', avatar: { gender: 'female_hijab', skinTone: formData.avatar?.skinTone || '#E0AC69' } })} className="hidden" />
                        <div className="w-16 h-16 bg-white/10 rounded-full p-2">
                            <Avatar config={{ gender: 'female_hijab', skinTone: formData.avatar?.skinTone || '#E0AC69' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest">{t('female')}</span>
                    </label>
                </div>

                <div className="space-y-3">
                    <label className="block font-black text-xs uppercase tracking-widest text-left text-white/70">
                        Teint de peau
                    </label>
                    <div className="flex gap-3 justify-center md:justify-start">
                        {SKIN_TONES.map(tone => (
                            <button
                                key={tone}
                                type="button"
                                onClick={() => updateData({ avatar: { gender: formData.gender === 'female' ? 'female_hijab' : 'male_beard', skinTone: tone } })}
                                className={`w-10 h-10 rounded-full border-4 transition-all duration-300 hover:scale-110 ${formData.avatar?.skinTone === tone ? 'border-accent-color scale-110 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'border-transparent opacity-80'}`}
                                style={{ backgroundColor: tone }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default StepProfileInfo;
