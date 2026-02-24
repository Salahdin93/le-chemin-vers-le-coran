import { useState, useCallback } from 'react';

export type SelectionMode = 'juzz' | 'hizb' | 'surah';

export const useEvaluationPlan = () => {
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('juzz');
    const [selections, setSelections] = useState({
        juzz: [] as number[],
        hizb: [] as number[],
        surah: [] as number[]
    });
    const [showAddons, setShowAddons] = useState({
        hizb: false,
        surah: false
    });

    const toggleSelection = useCallback((mode: SelectionMode, id: number) => {
        setSelections(prev => {
            const list = prev[mode];
            const newList = list.includes(id)
                ? list.filter(item => item !== id)
                : [...list, id];
            return { ...prev, [mode]: newList };
        });
    }, []);

    const toggleAddon = useCallback((addon: 'hizb' | 'surah') => {
        setShowAddons(prev => ({ ...prev, [addon]: !prev[addon] }));
    }, []);

    return {
        selectionMode,
        selections,
        showAddons,
        actions: {
            setSelectionMode,
            toggleSelection,
            toggleAddon
        }
    };
};
