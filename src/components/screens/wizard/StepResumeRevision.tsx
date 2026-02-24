import React, { useMemo } from 'react';
import { WizardData } from '@/types';
import Select from '@/components/ui/Select';
import { generateRevisionPlan } from '@/services/planLogic';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string, replacements?: any) => string;
}

const StepResumeRevision: React.FC<StepProps> = ({ formData, updateData, t }) => {
    
    const tempPlan = useMemo(() => {
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

    if ((formData.revisionSelection || []).length === 0) {
        return <p className="text-sm text-yellow-600">Veuillez d'abord sélectionner les unités à réviser à l'étape précédente.</p>
    }
    
    const unitsInPlan = tempPlan.flatMap((day, dayIndex) => 
        day.units.map((unit, unitIndex) => ({
            value: dayIndex.toString(), // We resume by day index
            label: `${t('day')} ${day.day}: ${unit.text} (${unit.surahs})`
        }))
    );

    return (
        <Select 
            label="Point de départ de la révision" 
            value={formData.resumeRevisionIndex} 
            onChange={e => updateData({ resumeRevisionIndex: parseInt(e.target.value) })}
        >
             <option value={0}>Commencer au début</option>
            {tempPlan.map((day, index) => 
                <option key={index} value={index}>
                    {t('day')} {day.day}: {day.units.map(u=>u.text).join(' + ')}
                </option>
            )}
        </Select>
    );
};

export default StepResumeRevision;