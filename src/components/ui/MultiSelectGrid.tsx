import React, { useMemo } from 'react';
import { useStore } from '../../context/AppContext';
import Button from './Button'; 

interface GridItem {
  id: string | number;
  name: string;
}

interface MultiSelectGridProps {
  items: GridItem[];
  selectedItems: (string | number)[];
  onChange: (selectedIds: (string | number)[]) => void;
  columns?: number;
}

export const MultiSelectGrid: React.FC<MultiSelectGridProps> = ({
  items,
  selectedItems,
  onChange,
  columns = 4,
}) => {
  const { t } = useStore();

  const handleToggleItem = (itemId: string | number) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter((id) => id !== itemId)
      : [...selectedItems, itemId];
    onChange(newSelection);
  };

  const handleSelectAll = () => {
    const allIds = items.map((item) => item.id);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const gridClass = useMemo(() => {
    const columnClasses: { [key: number]: string } = {
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    };
    return `grid ${columnClasses[columns] || 'grid-cols-4'} gap-2`;
  }, [columns]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2">
        <Button onClick={handleSelectAll} variant="secondary" size="sm">
          {t('selectAll')}
        </Button>
        <Button onClick={handleDeselectAll} variant="secondary" size="sm">
          {t('deselectAll')}
        </Button>
      </div>
      <div className={gridClass}>
        {items.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggleItem(item.id)}
              className={`p-2 rounded-md text-center transition-colors duration-200 ease-in-out border
                ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-card-foreground border-border hover:bg-muted'
                }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};