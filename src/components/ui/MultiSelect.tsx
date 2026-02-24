import React, { useState, useMemo } from 'react';
import Input from './Input';
import { clsx } from 'clsx';

interface Option {
  id: number;
  label: string;
}

interface MultiSelectProps {
  title: string;
  options: Option[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ title, options, selectedIds, onToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => 
    options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    ), [options, searchTerm]);

  return (
    <div className="border border-border-main rounded-lg p-4 space-y-3 bg-bg-main">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="text-sm font-semibold text-primary">
          {selectedIds.length} / {options.length} sélectionné(s)
        </span>
      </div>
      <Input
        type="text"
        placeholder="Rechercher dans la liste..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      <div className="max-h-64 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {filteredOptions.map(option => {
          const isSelected = selectedIds.includes(option.id);
          const parts = option.label.match(/(.*?)\s\((.*)\)/);
          const primaryText = parts ? parts[1] : option.label;
          const secondaryText = parts ? parts[2] : null;

          return (
            <button
              key={option.id}
              onClick={() => onToggle(option.id)}
              className={clsx(
                'w-full text-left p-3 rounded-lg border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card-bg border-border-main hover:border-border-hover hover:bg-border-hover'
              )}
            >
              <div>
                <span className="font-bold text-text-main">{primaryText}</span>
                {secondaryText && <span className="block text-xs text-text-secondary mt-1">{secondaryText}</span>}
              </div>
            </button>
          );
        })}
        {filteredOptions.length === 0 && (
            <p className="text-center text-text-secondary py-4 col-span-full">Aucun résultat trouvé.</p>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;