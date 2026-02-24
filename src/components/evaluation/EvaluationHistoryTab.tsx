import React from 'react';
import { useStore } from '@/context/AppContext';
import { EvaluationStatus } from '@/types';

const EvaluationHistoryTab: React.FC = () => {
  const { state, activeProfile } = useStore();

  const statusClasses: Record<EvaluationStatus, string> = {
    excellent: "bg-green-100 text-green-800",
    bon: "bg-blue-100 text-blue-800",
    moyen: "bg-yellow-100 text-yellow-800",
    a_revoir: "bg-red-100 text-red-800",
  };

  const evaluationHistory = activeProfile?.evaluationHistory || [];

  return (
    <div className="p-4 space-y-4">
      {evaluationHistory.length > 0 ? (
        evaluationHistory.map(record => (
          <div key={record.id} className="p-3 bg-bg-main rounded-lg border-l-4 border-primary">
            <p className="font-bold text-lg">{new Date(record.date).toLocaleString(state.settings.lang)}</p>
            <div className="mt-2 space-y-1">
              {record.items.map(item => (
                <div key={item.itemId} className="flex justify-between items-center text-sm">
                  <span>{item.itemName}</span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusClasses[item.result]}`}>
                    {item.result}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center opacity-70 py-8">Aucun historique d'évaluation pour le moment.</p>
      )}
    </div>
  );
};

export default EvaluationHistoryTab;