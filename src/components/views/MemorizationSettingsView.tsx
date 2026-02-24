import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useStore } from '@/context/AppContext';
import { JUZ_DATA, HIZB_DATA, FULL_SURAH_LIST } from '@/constants/quranData';
import MultiSelect from '@/components/ui/MultiSelect';
import Button from '@/components/ui/Button';
import { MemorizationStatus } from '@/types';

type SelectionMode = 'juzz' | 'hizb' | 'surah';

const MemorizationSettingsView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('surah');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    
    const options = {
        juzz: JUZ_DATA.map(j => ({ id: j.id, label: `${j.name} (${j.surah})`})),
        hizb: HIZB_DATA.map((h, i) => ({ id: i + 1, label: `Hizb ${i + 1} (${h.details})`})),
        surah: FULL_SURAH_LIST.map(s => ({ id: s.id, label: `${s.id}. ${s.name}`})),
    };

    const handleToggleSelection = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleApplyStatus = (status: MemorizationStatus) => {
        if (selectedIds.length === 0) {
            dispatch({type: 'SET_TOAST', payload: 'Veuillez sélectionner au moins un élément.'});
            return;
        }
        
        dispatch({ 
            type: 'UPDATE_MEMORIZATION_STATUS', 
            payload: { type: selectionMode, ids: selectedIds, status } 
        });
        
        dispatch({type: 'SET_TOAST', payload: `${selectedIds.length} élément(s) mis à jour avec le statut "${t(status)}"`});
        setSelectedIds([]);
    };

    const getStatusLabel = (status: MemorizationStatus) => {
        const labels = {
            excellent: t('excellent'),
            bon: t('bon'),
            moyen: t('moyen'),
            a_revoir: t('a_revoir'),
        };
        return labels[status] || status;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Paramétrage de la Mémorisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-text-secondary">
                    Gérez ici l'état de votre mémorisation. Sélectionnez un ou plusieurs éléments puis appliquez-leur un statut.
                </p>
                
                <div className="grid grid-cols-3 gap-2">
                    <Button variant={selectionMode === 'juzz' ? 'primary' : 'secondary'} onClick={() => { setSelectionMode('juzz'); setSelectedIds([]); }}>Juzz</Button>
                    <Button variant={selectionMode === 'hizb' ? 'primary' : 'secondary'} onClick={() => { setSelectionMode('hizb'); setSelectedIds([]); }}>Hizb</Button>
                    <Button variant={selectionMode === 'surah' ? 'primary' : 'secondary'} onClick={() => { setSelectionMode('surah'); setSelectedIds([]); }}>Sourate</Button>
                </div>

                <MultiSelect
                    title={`Sélectionner par ${selectionMode}`}
                    options={options[selectionMode]}
                    selectedIds={selectedIds}
                    onToggle={handleToggleSelection}
                />

                {selectedIds.length > 0 && (
                    <div className="p-4 border-t border-dashed space-y-3">
                        <h4 className="font-semibold text-center">Appliquer un statut à {selectedIds.length} élément(s) :</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Button variant="success" onClick={() => handleApplyStatus('excellent')}>{getStatusLabel('excellent')}</Button>
                            <Button variant="primary" onClick={() => handleApplyStatus('bon')}>{getStatusLabel('bon')}</Button>
                            <Button variant="warning" onClick={() => handleApplyStatus('moyen')}>{getStatusLabel('moyen')}</Button>
                            <Button variant="danger" onClick={() => handleApplyStatus('a_revoir')}>{getStatusLabel('a_revoir')}</Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MemorizationSettingsView;