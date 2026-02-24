import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/AppContext';
import { Profile, Theme, AccentColor } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getInitialBadges } from '@/services/achievementLogic';

// Options pour les thèmes et couleurs
const themeOptions: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'aube', label: 'Aube' },
    { value: 'crepuscule', label: 'Crépuscule' },
    { value: 'oasis', label: 'Oasis' },
    { value: 'sepia', label: 'Sépia' },
    { value: 'nightblue', label: 'Bleu Nuit' },
];

const accentColorOptions: { value: AccentColor; label: string; className: string }[] = [
    { value: '#2E7D32', label: 'Vert Coran', className: 'bg-[#2E7D32]' },
    { value: '#F57C00', label: 'Orange Vif', className: 'bg-accent-orange' },
    { value: '#1976D2', label: 'Bleu Électrique', className: 'bg-accent-blue' },
    { value: '#00796B', label: 'Vert Émeraude', className: 'bg-accent-green' },
    { value: '#D32F2F', label: 'Rouge Rubis', className: 'bg-[#D32F2F]' },
    { value: '#8E24AA', label: 'Violet Profond', className: 'bg-[#8E24AA]' },
];

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: Profile | null;
}

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ isOpen, onClose, profileToEdit }) => {
  const { dispatch, t } = useStore();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('#2E7D32');

  const isEditing = !!profileToEdit;

  useEffect(() => {
    if (isEditing && profileToEdit) {
      setName(profileToEdit.name);
      setGender(profileToEdit.gender);
      setTheme(profileToEdit.theme);
      setAccentColor(profileToEdit.accentColor);
    } else {
      // Réinitialiser pour la création
      setName('');
      setGender('male');
      setTheme('light');
      setAccentColor('#2E7D32');
    }
  }, [profileToEdit, isEditing, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && profileToEdit) {
      dispatch({
        type: 'UPDATE_PROFILE',
        payload: { ...profileToEdit, name, gender, theme, accentColor },
      });
    } else {
      const newProfile: Profile = {
        id: `profile_${Date.now()}`,
        name: name.trim(),
        gender,
        theme,
        accentColor,
        goals: {},
        memorizations: { surahParts: [], hizbs: [], juzz: [] },
        difficulties: [],
        evaluationHistory: [],
        badges: getInitialBadges(),
      };
      dispatch({ type: 'ADD_PROFILE', payload: newProfile });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <h2 className="text-2xl font-bold text-center">{isEditing ? t('editProfile') : t('createProfile')}</h2>
        
        <Input
          label={t('profileName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Salahdin"
          required
        />
        
        <div>
            <label className="block mb-2 font-semibold text-text-main text-left">{t('gender')}</label>
            <div className="flex gap-4">
                <Button type="button" variant={gender === 'male' ? 'primary' : 'ghost'} onClick={() => setGender('male')} className="flex-1">🧔‍♂️ Homme</Button>
                <Button type="button" variant={gender === 'female' ? 'primary' : 'ghost'} onClick={() => setGender('female')} className="flex-1">🧕 Femme</Button>
            </div>
        </div>

        <div>
            <label className="block mb-2 font-semibold text-text-main text-left">{t('theme')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {themeOptions.map(option => (
                    <Button type="button" key={option.value} variant={theme === option.value ? 'primary' : 'ghost'} onClick={() => setTheme(option.value)} size="sm">
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>

        <div>
            <label className="block mb-2 font-semibold text-text-main text-left">{t('accentColor')}</label>
            <div className="flex flex-wrap gap-3 justify-center">
                {accentColorOptions.map(option => (
                    <button
                        type="button"
                        key={option.value}
                        title={option.label}
                        className={`w-10 h-10 rounded-full transition-transform transform hover:scale-110 ${option.className} ${accentColor === option.value ? 'ring-2 ring-offset-2 ring-offset-card-bg ring-primary' : ''}`}
                        onClick={() => setAccentColor(option.value)}
                    />
                ))}
            </div>
        </div>
        
        <div className="flex gap-4 mt-4">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full">{t('cancel')}</Button>
          <Button type="submit" className="w-full">{isEditing ? t('saveChanges') : t('create')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileEditorModal;