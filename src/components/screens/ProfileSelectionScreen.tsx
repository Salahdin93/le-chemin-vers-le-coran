import React, { useState } from 'react';
import { useStore } from '@/context/AppContext';
import { Profile } from '@/types';
import Button from '@/components/ui/Button';
import { LOGO_URL } from '@/constants/ui';
import Card from '@/components/ui/Card';
import ProfileEditorModal from '@/components/modals/ProfileEditorModal';
import { Edit, Trash2, Plus } from 'lucide-react'; // Icônes pour un look plus propre

const ProfileCard = React.memo<{ profile: Profile; onSelect: () => void; onEdit: () => void; onDelete: () => void; t: any; }>(
    ({ profile, onSelect, onEdit, onDelete, t }) => {
        return (
            <div className="group relative transition-transform duration-300 ease-out hover:-translate-y-1">
                <button
                    onClick={onSelect}
                    className="w-full p-6 text-center bg-card-bg border-2 border-border-main rounded-xl shadow-md hover:border-accent hover:shadow-lg transition-all"
                >
                    <div className="text-5xl mb-4">{profile.gender === 'female' ? '🧕' : '🧔‍♂️'}</div>
                    <h3 className="text-xl font-bold truncate">{profile.name}</h3>
                    {profile.password && <span className="text-xs text-text-main/60">🔒 {t('protected')}</span>}
                </button>
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="p-2 bg-card-bg rounded-full text-text-main/70 hover:bg-border-main hover:text-accent transition-colors"
                        aria-label={`Modifier le profil ${profile.name}`}
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 bg-card-bg rounded-full text-text-main/70 hover:bg-danger/20 hover:text-danger transition-colors"
                        aria-label={`Supprimer le profil ${profile.name}`}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        );
    });

const ProfileSelectionScreen: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const [passwordPrompt, setPasswordPrompt] = useState<Profile | null>(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);

    const logoSrc = LOGO_URL; // Default to light logo on selection screen

    const handleProfileSelect = (profile: Profile) => {
        if (profile.password) {
            setPasswordPrompt(profile);
        } else {
            dispatch({ type: 'SET_ACTIVE_PROFILE', payload: profile.id });
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordPrompt && passwordInput === passwordPrompt.password) {
            dispatch({ type: 'SET_ACTIVE_PROFILE', payload: passwordPrompt.id });
        } else {
            alert(t('wrongPassword'));
            setPasswordInput('');
        }
    };

    const handleOpenCreator = () => {
        setProfileToEdit(null);
        setIsEditorOpen(true);
    };

    const handleOpenEditor = (profile: Profile) => {
        setProfileToEdit(profile);
        setIsEditorOpen(true);
    };

    const handleDeleteProfile = (profile: Profile) => {
        if (window.confirm(t('confirmProfileDeletion', { name: profile.name }))) {
            dispatch({ type: 'REMOVE_PROFILE', payload: profile.id });
        }
    };

    if (passwordPrompt) {
        return (
            <div className="fixed inset-0 bg-bg-main z-[100] flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-sm">
                    <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                        <h2 className="text-xl font-bold text-center">{t('profileOf', { name: passwordPrompt.name })}</h2>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder={t('enterPassword')}
                            className="w-full p-2 border border-border-main rounded-md bg-bg-main"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button variant="ghost" type="button" onClick={() => setPasswordPrompt(null)} className="flex-1">{t('back')}</Button>
                            <Button type="submit" className="flex-1">{t('enter')}</Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-4">
                <header className="text-center mb-8">
                    <img src={logoSrc} alt="Logo" className="w-48 h-48 mx-auto object-contain mb-4" />
                    <h1 className="text-3xl font-bold">{state.profiles.length > 0 ? t('whoIsThis') : t('welcome')}</h1>
                    <p className="text-text-main/70">{state.profiles.length > 0 ? t('selectProfileToContinue') : t('createFirstProfile')}</p>
                </header>

                <main className="w-full max-w-4xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                        {state.profiles.map(profile => (
                            <ProfileCard
                                key={profile.id}
                                profile={profile}
                                onSelect={() => handleProfileSelect(profile)}
                                onEdit={() => handleOpenEditor(profile)}
                                onDelete={() => handleDeleteProfile(profile)}
                                t={t}
                            />
                        ))}
                    </div>

                    <div className="text-center">
                        <Button onClick={handleOpenCreator} size="lg" className="gap-2">
                            <Plus size={20} /> {t('addProfile')}
                        </Button>
                    </div>
                </main>
            </div>
            <ProfileEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                profileToEdit={profileToEdit}
            />
        </>
    );
};

export default ProfileSelectionScreen;