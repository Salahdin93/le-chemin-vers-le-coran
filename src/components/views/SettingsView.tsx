import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useStore, useActiveProfileSelector, useSettingsSelector } from '@/context/AppContext';
import { THEMES, COLORS } from '@/constants/ui';
import Select from '@/components/ui/Select';
import { Language, Theme, AccentColor } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ToggleSwitch } from '@/components/ui/Checkbox';
import { generateProgressPDF, exportUserData, importUserData } from '@/services/export';
import { LOGO_URL } from '@/constants/ui';

const SettingsView: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const activeProfile = useActiveProfileSelector();
    const settings = useSettingsSelector();

    const [name, setName] = useState(activeProfile?.name || '');
    const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleNameChange = (newName: string) => {
        setName(newName);
        dispatch({ type: 'UPDATE_PROFILE', payload: { name: newName } });
        dispatch({ type: 'SET_TOAST', payload: t('saved') });
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPassword !== activeProfile?.password) {
            alert(t('wrongPassword')); return;
        }
        if (newPassword.length < 4 || newPassword !== confirmNewPassword) {
            alert(t('passwordMismatch')); return;
        }
        dispatch({ type: 'UPDATE_PROFILE', payload: { password: newPassword } });
        setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        setIsPasswordFormVisible(false);
        alert(t('saved'));
    };

    const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
        importUserData(event, () => window.location.reload());
    };

    const handleResetProgress = () => {
        if (window.confirm(t('confirmResetProgress'))) {
            dispatch({ type: 'RESET_PROGRESS' });
            dispatch({ type: 'SET_TOAST', payload: t('progressResetSuccess') });
        }
    };

    const handleNavigateToMemorizationSettings = () => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'memorization-settings-view' });
    };

    if (!activeProfile) return <p>{t('loading')}</p>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>👤 {t('personalInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input label={t('nameKunya')} id="nameKunyaInput" value={name} onChange={e => setName(e.target.value)} onBlur={e => handleNameChange(e.target.value)} />
                    <p className="mt-4"><strong>{t('gender')}:</strong> {t(activeProfile.gender)}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>🔑 {t('password')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isPasswordFormVisible ? (
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <Input label={t('currentPassword')} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoFocus />
                            <Input label={t('createPassword')} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            <Input label={t('confirmPassword')} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required />
                            <div className="flex gap-4">
                                <Button variant="ghost" type="button" onClick={() => setIsPasswordFormVisible(false)} className="flex-1">{t('cancel')}</Button>
                                <Button type="submit" className="flex-1">{t('saveData')}</Button>
                            </div>
                        </form>
                    ) : (
                        <Button onClick={() => setIsPasswordFormVisible(true)} className="w-full">{t('changePassword')}</Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>💖 {t('settingsMemorization')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-text-main/70">{t('memorizationSettingsDescription')}</p>
                    <Button onClick={handleNavigateToMemorizationSettings}>{t('accessSettings')}</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>🎯 {t('goalManagement')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Button variant="warning" onClick={() => { if (window.confirm(t('confirmChangeGoal'))) dispatch({ type: 'START_WIZARD', payload: { type: 'reading', mode: 'new' } }) }}>{t('changeReadingGoal')}</Button>
                        <Button variant="warning" onClick={() => { if (window.confirm(t('confirmChangeGoal'))) dispatch({ type: 'START_WIZARD', payload: { type: 'revision', mode: 'new' } }) }}>{t('changeRevisionGoal')}</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>🎨 {t('appearance')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-6'>
                        <ToggleSwitch label={t('enableNotifications')} checked={settings.enableNotifications} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { enableNotifications: e.target.checked } })} />
                        {settings.enableNotifications && (
                            <Input
                                label={t('notificationTimeLabel')}
                                type="time"
                                value={settings.notificationTime || ''}
                                onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { notificationTime: e.target.value } })}
                                className="w-full"
                            />
                        )}
                        <div>
                            <label className='font-semibold block mb-2' id="theme-label">{t('theme')}</label>
                            <Select aria-labelledby="theme-label" value={activeProfile.theme || 'light'} onChange={e => dispatch({ type: 'UPDATE_PROFILE', payload: { theme: e.target.value as Theme } })}>
                                {THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.icon} {t(theme.id)}</option>)}
                            </Select>
                        </div>
                        <div>
                            <label className='font-semibold block mb-2'>{t('accentColor')}</label>
                            <div className='grid grid-cols-8 gap-2'>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        style={{ backgroundColor: color }}
                                        className={`w-10 h-10 rounded-full border-2 ${activeProfile.accentColor === color ? 'border-text-main' : 'border-transparent'}`}
                                        onClick={() => dispatch({ type: 'UPDATE_PROFILE', payload: { accentColor: color as AccentColor } })}
                                        aria-label={t('chooseColor', { color: color })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>🌐 {t('language')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select aria-label={t('language')} value={settings.lang} onChange={e => dispatch({ type: 'UPDATE_SETTINGS', payload: { lang: e.target.value as Language } })}><option value="fr">🇫🇷 {t('french')}</option><option value="en">🇬🇧 {t('english')}</option><option value="ar">🇸🇦 {t('arabic')}</option></Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>🧾 {t('dataExport')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3">
                        <Button variant="secondary" onClick={() => dispatch({ type: 'TOGGLE_SHARE_MODAL', payload: true })}>{t('shareProgress')}</Button>
                        <div className="p-4 border border-border-main rounded-lg space-y-3 bg-bg-main">
                            <p className="font-semibold text-sm">{t('filterByDateRange')}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                    type="date"
                                    label={t('startDate')}
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                />
                                <Input
                                    type="date"
                                    label={t('endDate')}
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => generateProgressPDF(state, t, startDate, endDate)}
                            >
                                {t('exportPDF')}
                            </Button>
                        </div>
                        <Button variant="secondary" onClick={exportUserData}>{t('saveData')}</Button>
                        <Button as="label" variant="secondary" className="cursor-pointer">{t('restoreData')}<input type="file" accept=".json" className="hidden" onChange={handleRestoreData} /></Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>⚖️ {t('termsOfUse')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div tabIndex={0} className='text-left text-sm max-h-40 overflow-y-auto p-3 border border-border-main rounded-lg bg-bg-main focus:outline-none focus:ring-2 focus:ring-primary rtl:text-right'><img src={LOGO_URL} alt="Logo" className="block mx-auto w-24 mb-4" /><p>{t('termsTextP1')}</p><p className="text-danger font-bold my-2">{t('termsTextP2')}</p><p>{t('termsTextP3')}</p></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>⚙️ {t('actions')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col gap-3'>
                        <Button variant='warning' onClick={handleResetProgress}>{t('resetProgress')}</Button>
                        <Button variant='danger' onClick={() => { if (window.confirm(t('logoutConfirm'))) dispatch({ type: 'LOGOUT' }) }}>{t('logout')}</Button>
                        <Button variant='danger' onClick={() => { if (window.confirm(t('confirmReset'))) dispatch({ type: 'RESET_APP' }) }}>{t('resetApp')}</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsView;