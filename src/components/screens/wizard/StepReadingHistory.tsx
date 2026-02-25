import React from 'react';
import { WizardData, ReadingStatus } from '@/types';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { generateReadingPlan } from '@/services/planLogic';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepReadingHistory: React.FC<StepProps> = ({ formData, updateData, t }) => {

    const handleHistoryChange = (day: number, status: ReadingStatus, pagesStr: string) => {
        const pages = parseInt(pagesStr) || 0;
        const tempPlan = generateReadingPlan({
            duration: formData.duration!, khatmas: formData.khatmas!,
            kahfOption: formData.kahfOption!, kahfPages: formData.kahfPages!
        } as any, new Date().toISOString());

        const planDay = tempPlan.find(p => p.day === day);

        updateData({
            resumeReadingHistory: {
                ...formData.resumeReadingHistory,
                [`day_${day}`]: { status, realPages: pages, adjustment: pages - (planDay?.pages || 0), kahf: false }
            }
        });
    };

    return (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {Array.from({ length: (formData.resumeDay || 1) - 1 }, (_, i) => i + 1).map(day => {
                const dayKey = `day_${day}`;
                const historyEntry = formData.resumeReadingHistory?.[dayKey];
                return (
                    <div key={day} className="p-3 rounded-xl bg-white/5 border border-white/5 mb-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-2">{t('day')} {day}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                aria-label={`Jour ${day} status`}
                                value={historyEntry?.status || 'done'}
                                onChange={e => handleHistoryChange(day, e.target.value as ReadingStatus, (document.getElementById(`pages-day-${day}`) as HTMLInputElement)?.value || '0')}
                                variant="wizard"
                            >
                                <option value="done">{t('goalAchieved')}</option>
                                <option value="partial">{t('partial')}</option>
                                <option value="not_read">{t('notRead')}</option>
                            </Select>
                            <Input
                                id={`pages-day-${day}`}
                                type="number"
                                placeholder="Pages"
                                value={historyEntry?.realPages ?? ''}
                                onChange={e => handleHistoryChange(day, historyEntry?.status || 'done', e.target.value)}
                                variant="wizard"
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StepReadingHistory;