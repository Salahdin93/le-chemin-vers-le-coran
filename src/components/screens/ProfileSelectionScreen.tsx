import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/context/AppContext';
import { Profile } from '@/types';
import Button from '@/components/ui/Button';
import { LOGO_URL_DARK } from '@/constants/ui';
import Card from '@/components/ui/Card';
import ProfileEditorModal from '@/components/modals/ProfileEditorModal';
import { Edit, Trash2, Plus } from 'lucide-react'; // Icônes pour un look plus propre
import ConfirmModal from '../ui/ConfirmModal';
import Avatar from '@/components/ui/Avatar';

const ProfileCard = React.memo<{ profile: Profile; onSelect: () => void; onEdit: () => void; onDelete: () => void; t: any; }>(
    ({ profile, onSelect, onEdit, onDelete, t }) => {
        return (
            <div className="group relative transition-transform duration-300 ease-out hover:-translate-y-1">
                <button
                    onClick={onSelect}
                    className="w-full p-8 text-center glass-card border-none hover:bg-white/10 shadow-premium transition-all duration-500 group-hover:scale-[1.02]"
                >
                    <div className="mx-auto w-24 h-24 mb-6 transform group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                        <Avatar
                            config={profile.avatar || { gender: profile.gender === 'female' ? 'female_hijab' : 'male_beard', skinTone: '#E0AC69' }}
                        />
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
    const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

    const logoSrc = LOGO_URL_DARK; // Use dark logo for better visibility on dark green

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
        setProfileToDelete(profile);
    };

    const confirmDeleteProfile = () => {
        if (profileToDelete) {
            dispatch({ type: 'REMOVE_PROFILE', payload: profileToDelete.id });
            setProfileToDelete(null);
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
            <div className="min-h-screen dynamic-bg geometric-overlay flex flex-col items-center justify-center p-4 overflow-hidden" style={{ background: 'linear-gradient(160deg, #052e16 0%, #064e3b 35%, #065f46 60%, #047857 100%)', ...({ '--text-main': '#ffffff' } as React.CSSProperties) }}>
                {/* Background glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-color/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <header className="relative text-center mb-12 z-10">
                    <motion.div
                        initial={{ y: -20, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                        className="relative mb-8"
                    >
                        {/* Premium logo container similar to AuthScreen */}
                        <div
                            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center relative overflow-hidden group"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 12px 48px rgba(0,0,0,0.3), 0 0 40px rgba(52,211,153,0.3)',
                            }}
                        >
                            <img src={logoSrc} alt="Logo" className="w-16 h-16 object-contain relative z-10 drop-shadow-2xl" />
                            {/* Animated reflection */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
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
            <ConfirmModal
                isOpen={!!profileToDelete}
                onClose={() => setProfileToDelete(null)}
                onConfirm={confirmDeleteProfile}
                title={t('confirmProfileDeletionTitle') || 'Supprimer le profil'}
                message={t('confirmProfileDeletion', { name: profileToDelete?.name || '' })}
                variant="danger"
                confirmText={t('delete') || 'Supprimer'}
                cancelText={t('cancel') || 'Annuler'}
            />
        </>
    );
};

export default ProfileSelectionScreen;