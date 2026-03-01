
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

// Définition des props pour notre composant
interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  label: string;
  // Optionnel : pour pré-remplir le champ ou spécifier le type
  initialValue?: string;
  inputType?: 'text' | 'number';
  confirmText?: string;
  cancelText?: string;
  min?: number;
  max?: number;
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  label,
  initialValue = '',
  inputType = 'number',
  confirmText = 'Valider',
  cancelText = 'Annuler',
  min,
  max,
}) => {
  // État interne pour gérer la valeur du champ de saisie
  const [inputValue, setInputValue] = useState(initialValue);

  // Réinitialiser la valeur du champ à chaque fois que la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  // Gère la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page
    if (inputValue.trim() === '' && inputType === 'number') {
        // Optionnel : empêcher la soumission si le champ numérique est vide
        // Ou le considérer comme 0
        onSubmit('0');
    } else {
        onSubmit(inputValue);
    }
    onClose(); // Ferme la modale après la soumission
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-2">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="input-modal-field" className="block text-sm font-medium text-text-main/80">
              {label}
            </label>
            <input
              id="input-modal-field"
              type={inputType}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
              min={inputType === 'number' ? (min !== undefined ? min : 0) : undefined}
              max={inputType === 'number' ? max : undefined}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button type="submit" variant="primary">
              {confirmText}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default InputModal;