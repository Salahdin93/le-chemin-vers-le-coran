import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
                    className="w-full p-8 text-center glass-card border-none hover:bg-white/10 shadow-premium transition-all duration-500 group-hover:scale-[1.02]"
                >
                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                        {profile.gender === 'female' ? '🧕' : '🧔‍♂️'}
                    </div>
                    <h3 className="text-xl font-black text-white truncate mb-1">{profile.name}</h3>
                    {profile.password && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-[10px] text-amber-400 font-bold uppercase tracking-widest border border-amber-400/20">
                            🔒 {t('protected')}
                        </div>
                    )}
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
            <div className="min-h-screen dynamic-bg geometric-overlay flex flex-col items-center justify-center p-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 60%, #047857 100%)' }}>
                {/* Background glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-color/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <header className="relative text-center mb-12 z-10">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="relative inline-block mb-6"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                        <img src={logoSrc} alt="Logo" className="w-40 h-40 mx-auto object-contain relative drop-shadow-2xl" />
                    </motion.div>

                    <h1 className="text-4xl font-black mb-2 text-white tracking-tight">
                        {state.profiles.length > 0 ? t('whoIsThis') : t('welcome')}
                    </h1>
                    <p className="text-emerald-100/60 font-medium tracking-wide uppercase text-xs">
                        {state.profiles.length > 0 ? t('selectProfileToContinue') : t('createFirstProfile')}
                    </p>
                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-6" />
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

                    <div className="text-center mt-12 mb-8">
                        <Button
                            variant="accent"
                            size="lg"
                            className="w-full max-w-xs py-5 gap-3 shadow-2xl transform active:scale-95 transition-all"
                            onClick={handleOpenCreator}
                        >
                            <Plus size={20} className="stroke-[3px]" />
                            <span className="tracking-tight">{t('addProfile') || 'Ajouter un nouveau profil'}</span>
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