import React from 'react';
import { WizardData, Theme } from '@/types';
import { THEMES, COLORS } from '@/constants/ui';
import { ToggleSwitch } from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { Settings, Bell, BookOpen } from 'lucide-react';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepAppearance: React.FC<StepProps> = ({ formData, updateData, t }) => {
    return (
        <div className="space-y-6 text-left">
            <ToggleSwitch
                label={t('enableNotifications')}
                checked={!!formData.enableNotifications}
                onChange={e => updateData({ enableNotifications: e.target.checked })}
                variant="wizard"
            />
            <div>
                <label
                    className='text-[10px] font-black uppercase tracking-widest block mb-3 text-white/90'
                >
                    {t('theme')}
                </label>
                <Select value={formData.theme} onChange={e => updateData({ theme: e.target.value as Theme })} variant="wizard">
                    {THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.icon} {t(theme.id)}</option>)}
                </Select>
            </div>
            <div>
                <label
                    className='text-[10px] font-black uppercase tracking-widest block mb-3 text-white/90'
                >
                    {t('accentColor')}
                </label>
                <div className='grid grid-cols-8 gap-2'>
                    {COLORS.map(color => (
                        <button
                            type="button"
                            key={color}
                            style={{ backgroundColor: color }}
                            className={`w-8 h-8 rounded-full border-4 transition-all hover:scale-125 hover:rotate-12 ${formData.accentColor === color ? 'border-white ring-2 ring-white/50 shadow-lg' : 'border-transparent opacity-70'
                                }`}
                            onClick={() => updateData({ accentColor: color as any })}
                        />
                    ))}
                </div>
            </div>

            {/* Preview Box */}
            <div className="mt-8 pt-6 border-t border-white/10">
                <label className='text-[10px] font-black uppercase tracking-widest block mb-4 text-white/90'>
                    {t('preview') || 'Aperçu'}
                </label>

                <div
                    className={`w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${formData.theme === 'light' ? '' : formData.theme} geometric-overlay`}
                    style={{
                        ...({ '--accent-color': formData.accentColor } as React.CSSProperties),
                        backgroundColor: formData.theme === 'light' ? '#f0f4f8' : 'var(--bg-main)',
                        color: formData.theme === 'light' ? '#111827' : 'var(--text-main)',
                        position: 'relative'
                    }}
                >
                    <div className="p-4 bg-bg-secondary border-b border-border-main flex items-center justify-between"
                        style={{
                            backgroundColor: formData.theme === 'light' ? '#ffffff' : 'var(--bg-secondary)',
                            borderColor: formData.theme === 'light' ? '#d1d5db' : 'var(--border-main)'
                        }}
                    >
                        <div className="flex gap-2 items-center">
                            <div className="w-8 h-8 rounded-full bg-accent-color flex items-center justify-center text-white font-bold">A</div>
                            <span className="font-bold opacity-90 text-sm">{formData.name || 'Abu Junayd'}</span>
                        </div>
                        <div className="flex gap-2 text-accent-color">
                            <Bell size={18} />
                            <Settings size={18} />
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Fake Dashboard Card */}
                        <div className="rounded-xl p-4 shadow-sm"
                            style={{
                                backgroundColor: formData.theme === 'light' ? '#ffffff' : 'var(--card-bg)',
                                border: `1px solid ${formData.theme === 'light' ? '#e5e7eb' : 'var(--border-main)'}`,
                                boxShadow: `0 4px 12px ${formData.accentColor}20`
                            }}>
                            <div className="flex justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-accent-color" />
                                    <span className="font-semibold text-sm">{t('reading')}</span>
                                </div>
                                <span className="text-xs opacity-70">12 Jours</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden"
                                style={{ backgroundColor: formData.theme === 'light' ? '#f3f4f6' : 'var(--bg-main)' }}>
                                <div className="h-full bg-accent-color w-[60%] rounded-full shadow-[0_0_8px_var(--accent-color)]" />
                            </div>
                        </div>

                        {/* Fake Button */}
                        <button className="w-full py-3 rounded-lg font-bold text-sm bg-accent-color text-white shadow-lg transition-transform hover:scale-105"
                            style={{ boxShadow: `0 4px 14px 0 ${formData.accentColor}40` }}>
                            {t('start')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepAppearance;
