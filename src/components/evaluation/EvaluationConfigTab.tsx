import React from 'react';
import Button from '@/components/ui/Button';
import { RevisionMode } from '@/types';
import { HIZB_DATA, JUZ_DATA, MEMORIZATION_SURAH_OPTIONS } from '@/constants/quranData';
import { clsx } from 'clsx';
import Input from '../ui/Input';

interface EvaluationConfigTabProps {
  evaluationState: {
    plan: { itemsPerSession: number };
    setPlan: (plan: { itemsPerSession: number }) => void;
    selections: Record<RevisionMode, string[]>;
    toggleSelection: (id: string, mode: RevisionMode) => void;
  };
  onStartEvaluation: () => void;
  onStartFocusSession: () => void;
  hasWeakPoints: boolean;
}

const EvaluationConfigTab: React.FC<EvaluationConfigTabProps> = ({ evaluationState, onStartEvaluation, onStartFocusSession, hasWeakPoints }) => {
  const { plan, setPlan, selections, toggleSelection } = evaluationState;

  const renderGridSelection = (mode: RevisionMode) => {
    const items = mode === 'hizb' ? HIZB_DATA.map((h, i) => ({ id: (i + 1).toString(), name: `Hizb ${h.name}`, details: h.details }))
      : mode === 'juzz' ? JUZ_DATA.map(j => ({ id: j.id.toString(), name: `Juzz ${j.id}`, details: undefined as string | undefined }))
        : MEMORIZATION_SURAH_OPTIONS.map(s => ({ id: s.id, name: s.name, details: undefined as string | undefined }));
    return (
      <div tabIndex={0} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-border-main rounded-lg bg-bg-main focus:outline-none focus:ring-2 focus:ring-primary">
        {items.map(item => (
          <div key={item.id} onClick={() => toggleSelection(item.id, mode)}
            className={clsx('p-1.5 text-xs text-center border rounded-md cursor-pointer transition-colors',
              selections[mode].includes(item.id) ? 'bg-primary text-white border-primary' : 'border-border-main hover:bg-border-main')}>
            <p className='font-semibold'>{item.name}</p>
            {item.details && <p className='opacity-70 text-[10px]'>{item.details}</p>}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold mb-2">Configurer une session manuelle</h4>
          <div className="p-4 border border-border-main rounded-lg space-y-4">
            <Input
              label="Éléments par session"
              type="number"
              id="itemsPerSession"
              value={plan.itemsPerSession}
              onChange={(e) => setPlan({ ...plan, itemsPerSession: parseInt(e.target.value) || 5 })}
              min="1"
            />
            <div>
              <h5 className="font-semibold mb-2">Sélectionner des Hizbs</h5>
              {renderGridSelection('hizb')}
            </div>
            <div>
              <h5 className="font-semibold mb-2">Sélectionner des Juzz</h5>
              {renderGridSelection('juzz')}
            </div>
            <div>
              <h5 className="font-semibold mb-2">Sélectionner des Sourates</h5>
              {renderGridSelection('sourate')}
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-2">Lancer une session</h4>
          <div className="p-4 border border-border-main rounded-lg space-y-4 bg-bg-main">
            <div className="text-center">
              <p className="font-semibold text-lg">Prêt à commencer ?</p>
              <p className="text-sm text-text-secondary mt-1">Choisissez le type de session que vous souhaitez lancer.</p>
            </div>
            <Button onClick={onStartEvaluation} className="w-full" size="lg">
              🎲 Lancer une Session Aléatoire
            </Button>
            <Button
              onClick={onStartFocusSession}
              className="w-full !bg-amber-600 hover:!bg-amber-700"
              size="lg"
              disabled={!hasWeakPoints}
              title={!hasWeakPoints ? "Aucun point faible à réviser pour le moment" : ""}
            >
              🚀 Session Focus : Points Faibles
            </Button>
            {!hasWeakPoints && <p className="text-xs text-center text-text-secondary mt-2">Masha'Allah, aucun point faible n'a été identifié dans vos dernières évaluations !</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationConfigTab;