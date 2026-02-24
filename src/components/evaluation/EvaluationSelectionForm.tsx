import React from 'react';
import MultiSelect from '@/components/ui/MultiSelect';
import { SimpleCheckbox } from '@/components/ui/Checkbox';
import { JUZ_DATA, HIZB_DATA, FULL_SURAH_LIST } from '@/constants/quranData';
import { useEvaluationPlan } from '@/hooks/useEvaluationPlan';
import SelectionModeCard from './SelectionModeCard';

type EvaluationSelectionFormProps = {
  state: ReturnType<typeof useEvaluationPlan>;
};

const EvaluationSelectionForm: React.FC<EvaluationSelectionFormProps> = ({ state }) => {
  const { selectionMode, selections, showAddons, actions } = state;

  const juzOptions = JUZ_DATA.map(j => ({ id: j.id, label: `${j.name} (${j.surah})` }));
  const hizbOptions = HIZB_DATA.map((h, i) => ({ id: i + 1, label: `Hizb ${i + 1} (${h.details})` }));
  const surahOptions = FULL_SURAH_LIST.map(s => ({ id: s.id, label: `${s.id}. ${s.name}` }));

  return (
    <div className="space-y-6">
      <div>
        <label className="font-semibold block mb-3 text-lg">Comment voulez-vous évaluer ?</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectionModeCard 
            icon="📗" 
            title="Par Juzz" 
            description="Évaluez votre mémorisation sur des Juzz complets."
            isActive={selectionMode === 'juzz'}
            onClick={() => actions.setSelectionMode('juzz')}
          />
          <SelectionModeCard 
            icon="📘" 
            title="Par Hizb" 
            description="Ciblez des sections plus courtes avec les Hizbs."
            isActive={selectionMode === 'hizb'}
            onClick={() => actions.setSelectionMode('hizb')}
          />
          <SelectionModeCard 
            icon="📖" 
            title="Par Sourate" 
            description="Choisissez des sourates spécifiques à réviser."
            isActive={selectionMode === 'surah'}
            onClick={() => actions.setSelectionMode('surah')}
          />
        </div>
      </div>

      {selectionMode === 'juzz' && <MultiSelect title="Sélectionner des Juzz" options={juzOptions} selectedIds={selections.juzz} onToggle={(id) => actions.toggleSelection('juzz', id)} />}
      {selectionMode === 'hizb' && <MultiSelect title="Sélectionner des Hizbs" options={hizbOptions} selectedIds={selections.hizb} onToggle={(id) => actions.toggleSelection('hizb', id)} />}
      {selectionMode === 'surah' && <MultiSelect title="Sélectionner des Sourates" options={surahOptions} selectedIds={selections.surah} onToggle={(id) => actions.toggleSelection('surah', id)} />}

      {(selectionMode === 'juzz' || selectionMode === 'hizb') && (
        <div className="space-y-4 p-4 border-t border-dashed">
            <p className="font-semibold">Souhaitez-vous rajouter d'autres éléments ?</p>
            <div className="flex flex-col gap-2">
                {selectionMode === 'juzz' && <SimpleCheckbox id="addon-hizb" label="Ajouter des Hizbs spécifiques" checked={showAddons.hizb} onChange={() => actions.toggleAddon('hizb')} />}
                <SimpleCheckbox id="addon-surah" label="Ajouter des Sourates spécifiques" checked={showAddons.surah} onChange={() => actions.toggleAddon('surah')} />
            </div>
        </div>
      )}

      {showAddons.hizb && <MultiSelect title="Sélectionner des Hizbs additionnels" options={hizbOptions} selectedIds={selections.hizb} onToggle={(id) => actions.toggleSelection('hizb', id)} />}
      {showAddons.surah && <MultiSelect title="Sélectionner des Sourates additionnelles" options={surahOptions} selectedIds={selections.surah} onToggle={(id) => actions.toggleSelection('surah', id)} />}
    </div>
  );
};

export default EvaluationSelectionForm;