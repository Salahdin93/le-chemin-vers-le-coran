import React from 'react';
import { WizardData, RevisionStatus } from '@/types';
import Select from '@/components/ui/Select';
import { generateRevisionPlan } from '@/services/planLogic';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepRevisionHistory: React.FC<StepProps> = ({ formData, updateData, t }) => {

    const tempPlan = React.useMemo(() => {
        if (!formData.revisionSelection || formData.revisionSelection.length === 0) return [];
        return generateRevisionPlan({
            selection: formData.revisionSelection,
            revisionMode: formData.revisionMode!,
            unitsPerDay: formData.unitsPerDay!,
            revisionDuration: formData.revisionDuration!,
            frequency: formData.revisionFrequency!,
            boosterSurahs: formData.boosterSurahs!,
            boosterSurahFreq: formData.boosterSurahFreq!,
        }, new Date().toISOString(), 1, t);
    }, [formData.revisionSelection, formData.revisionMode, formData.unitsPerDay, formData.revisionDuration, formData.revisionFrequency, formData.boosterSurahs, formData.boosterSurahFreq, t]);

    const handleHistoryChange = (dayIndex: number, status: RevisionStatus) => {
        const newHistory = [...(formData.resumeRevisionPlan || [])];
        const day = tempPlan?.[dayIndex];
        if (day) {
            const existingIndex = newHistory.findIndex(h => h.day === day.day);
            if(existingIndex > -1) {
                newHistory[existingIndex].status = status;
            } else {
                newHistory.push({...day, status, difficulties: []});
            }
        }
        updateData({ resumeRevisionPlan: newHistory.sort((a,b) => a.day - b.day) });
    };

    const pastRevisions = tempPlan.slice(0, formData.resumeRevisionIndex || 0);

    return (
         <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {pastRevisions.map((day, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <label className="text-sm">Jour {day.day}: {day.units.map(u=>u.text).join(' + ')}</label>
                    <Select
                        aria-label={`Jour ${day.day} status`}
                        value={formData.resumeRevisionPlan?.find(h => h.day === day.day)?.status || 'revised'}
                        onChange={e => handleHistoryChange(index, e.target.value as RevisionStatus)}
                    >
                        <option value="revised">{t('revised')}</option>
                        <option value="to-review">{t('toReview')}</option>
                        <option value="not_revised">{t('notAchieved')}</option>
                    </Select>
                </div>
            ))}
        </div>
    );
};

export default StepRevisionHistory;