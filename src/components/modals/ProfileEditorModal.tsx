import { useState, useEffect } from 'react';
import { useStore } from '@/context/AppContext';
import { Profile, Theme, AccentColor } from '@/types';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { getInitialBadges } from '@/services/achievementLogic';
import { THEMES } from '@/constants/ui';
import { generateUUID } from '@/utils/uuid';

const SKIN_TONES = ['#FFE0BD', '#F1C27D', '#E0AC69', '#8D5524', '#3D2415'];



const accentColorOptions: { value: AccentColor; label: string; color: string }[] = [
  { value: '#10b981', label: 'Vert Coran', color: '#10b981' },
  { value: '#f59e0b', label: 'Orange Vif', color: '#f59e0b' },
  { value: '#3b82f6', label: 'Bleu Électrique', color: '#3b82f6' },
  { value: '#14b8a6', label: 'Vert Émeraude', color: '#14b8a6' },
  { value: '#ef4444', label: 'Rouge Rubis', color: '#ef4444' },
  { value: '#a855f7', label: 'Violet Profond', color: '#a855f7' },
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
  const [skinTone, setSkinTone] = useState<string>('#E0AC69');
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('#2E7D32');

  const isEditing = !!profileToEdit;

  useEffect(() => {
    if (isEditing && profileToEdit) {
      setName(profileToEdit.name);
      setGender(profileToEdit.gender);
      setSkinTone(profileToEdit.avatar?.skinTone || '#E0AC69');
      setTheme(profileToEdit.theme);
      setAccentColor(profileToEdit.accentColor);
    } else {
      // Réinitialiser pour la création
      setName('');
      setGender('male');
      setSkinTone('#E0AC69');
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
        payload: {
          ...profileToEdit,
          name,
          gender,
          avatar: { gender: gender === 'female' ? 'female_hijab' : 'male_beard', skinTone },
          theme,
          accentColor
        },
      });
    } else {
      const newProfile: Profile = {
        id: generateUUID(),
        name: name.trim(),
        gender,
        avatar: { gender: gender === 'female' ? 'female_hijab' : 'male_beard', skinTone },
        theme,
        accentColor,
        goals: {},
        memorizations: { surahParts: [], hizbs: [], juzz: [] },
        hadithProgress: {},
        hadithHistory: [],
        difficulties: [],
        evaluationPlans: [],
        evaluationHistory: [],
        badges: getInitialBadges(),
      };
      dispatch({ type: 'ADD_PROFILE', payload: newProfile });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto px-1 py-2 custom-scrollbar">
        <h2 className="text-2xl font-bold text-center">{isEditing ? t('editProfile') : t('createProfile')}</h2>

        <Input
          label={t('profileName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Salahdin"
          required
        />

        <div>
          <label className="block mb-2 font-semibold text-text-main text-left">{t('gender')} & Avatar</label>
          <div className="flex gap-4 mb-4">
            <Button type="button" variant={gender === 'male' ? 'primary' : 'ghost'} onClick={() => setGender('male')} className="flex-1 min-h-[100px] flex-col gap-2">
              <div className="w-12 h-12"><Avatar config={{ gender: 'male_beard', skinTone }} /></div>
              <span>Homme</span>
            </Button>
            <Button type="button" variant={gender === 'female' ? 'primary' : 'ghost'} onClick={() => setGender('female')} className="flex-1 min-h-[100px] flex-col gap-2">
              <div className="w-12 h-12"><Avatar config={{ gender: 'female_hijab', skinTone }} /></div>
              <span>Femme</span>
            </Button>
          </div>

          <label className="block mb-2 font-semibold text-text-main text-sm text-left opacity-70">Teint de peau</label>
          <div className="flex gap-3 justify-start">
            {SKIN_TONES.map(tone => (
              <button
                key={tone}
                type="button"
                onClick={() => setSkinTone(tone)}
                className={`w-8 h-8 rounded-full border-4 transition-all duration-300 hover:scale-110 ${skinTone === tone ? 'border-accent-color scale-110' : 'border-transparent opacity-80'}`}
                style={{ backgroundColor: tone }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-text-main text-left">{t('theme')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEMES.map(option => (
              <Button type="button" key={option.id} variant={theme === option.id ? 'primary' : 'ghost'} onClick={() => setTheme(option.id as Theme)} size="sm">
                {option.icon} {option.name}
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
                style={{ backgroundColor: option.color }}
                className={`w-10 h-10 rounded-full transition-transform transform hover:scale-110 ${accentColor === option.value ? 'ring-2 ring-offset-2 ring-offset-card-bg ring-primary' : ''}`}
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