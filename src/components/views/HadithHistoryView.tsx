import React, { useState } from 'react';
import { useStore, useActiveProfileSelector } from '../../context/AppContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { HADITH_COLLECTION } from '../../constants/hadithData';
import { Hadith, HadithMemorizationStatus } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const HadithHistoryView: React.FC = () => {
    const { t } = useStore();
    const activeProfile = useActiveProfileSelector();
    const [selectedHadith, setSelectedHadith] = useState<Hadith | null>(null);

    const history = activeProfile?.hadithHistory || [];
    const lang = useStore().state.settings.lang;

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t('hadithHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <EmptyState
                            icon="📂"
                            title={t('noHadithHistoryTitle')}
                            message={t('noHadithHistoryMessage')}
                        />
                    ) : (
                        <ul className="space-y-3">
                            {history.map((entry, index) => {
                                const hadith = HADITH_COLLECTION.find(h => h.id === entry.hadithId);
                                if (!hadith) return null;

                                return (
                                    <li 
                                        key={index} 
                                        className="p-3 bg-bg-main rounded-lg border-l-4 border-primary cursor-pointer hover:bg-border-main/20 transition-colors"
                                        onClick={() => setSelectedHadith(hadith)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{t('hadithNumber', { number: entry.hadithId })}: {t(entry.action)}</p>
                                            <span className="text-xs text-text-main/70">{new Date(entry.date).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-text-main/80 mt-1 font-amiri rtl text-right truncate">"{hadith.arabic}"</p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </CardContent>
            </Card>

            {selectedHadith && (
                <Modal isOpen={!!selectedHadith} onClose={() => setSelectedHadith(null)}>
                    <CardHeader>
                        <CardTitle>{t('hadithModalTitle', { number: selectedHadith.id })}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                        <p className="font-amiri text-2xl leading-loose rtl text-right">{selectedHadith.arabic}</p>
                        {lang !== 'ar' && (
                             <div className="p-4 bg-bg-main rounded-lg border border-border-main text-base italic">
                                <p>"{selectedHadith.translations[lang] || selectedHadith.translations.en}"</p>
                            </div>
                        )}
                        <Button onClick={() => setSelectedHadith(null)} className="w-full mt-4">{t('close')}</Button>
                    </CardContent>
                </Modal>
            )}
        </>
    );
};

export default HadithHistoryView;