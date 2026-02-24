import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useStore } from '@/context/AppContext';

const LoginScreen: React.FC = () => {
    const { state, dispatch, t } = useStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (state.profile?.password === password) {
            setError('');
            dispatch({ type: 'SET_APP_SCREEN', payload: 'main' });
        } else {
            setError(t('wrongPassword'));
            setPassword('');
        }
    };
    
    const handleForgotPassword = () => {
        if(window.confirm(t('confirmReset'))) {
            dispatch({ type: 'RESET_APP' });
        }
    }

    return (
        <Modal isOpen={true} className="text-center">
            <h2 className="font-amiri text-4xl text-primary mb-4">{t('welcome')}</h2>
            <h3 className="text-xl mb-6">{t('enterPassword')}</h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                />
                {error && <p className="text-danger mt-2 text-sm">{error}</p>}

                <div className="flex flex-col gap-3 mt-6">
                    <Button type="submit" size="lg">{t('login')}</Button>
                    <button type="button" onClick={handleForgotPassword} className="text-sm text-primary/80 hover:text-primary mt-2">
                        {t('forgotPassword')}
                    </button>
                    <Button variant='ghost' size='sm' className='mt-4' onClick={() => dispatch({type: 'SET_APP_SCREEN', payload: 'welcome'})}>
                       ⬅️ Retour
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default LoginScreen;