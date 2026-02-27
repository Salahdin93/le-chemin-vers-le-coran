import { WizardData } from '@/types';
import { clsx } from 'clsx';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
}

const StepHadithSelection: React.FC<StepProps> = ({ formData, updateData, t }) => {
    const totalHadiths = 100; // Increased to 100 per data collection
    const selection = formData.hadithSelection || [];

    const toggleHadith = (num: number) => {
        const newSelection = selection.includes(num)
            ? selection.filter(id => id !== num)
            : [...selection, num].sort((a, b) => a - b);
        updateData({ hadithSelection: newSelection });
    };

    const handleSelectAll = () => {
        const all = Array.from({ length: totalHadiths }, (_, i) => i + 1);
        updateData({ hadithSelection: all });
    };

    const handleDeselectAll = () => {
        updateData({ hadithSelection: [] });
    };

    return (
        <div className="space-y-4 text-left">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/90">
                    {t('hadithSelectionTitle')}
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 hover:text-emerald-200 transition-colors"
                    >
                        {t('selectAll')}
                    </button>
                    <span className="text-white/20">|</span>
                    <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
                    >
                        {t('deselectAll')}
                    </button>
                </div>
            </div>

            <div className="space-y-6 max-h-[24rem] overflow-y-auto pr-2 custom-scrollbar">
                {[
                    { start: 0, key: 'themeFaith' },
                    { start: 20, key: 'themeBehavior' },
                    { start: 40, key: 'themeSpiritual' },
                    { start: 60, key: 'themeFamily' },
                    { start: 80, key: 'themeWisdom' }
                ].map(group => (
                    <div key={group.start} className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 flex items-center gap-2">
                            <span className="w-4 h-[1px] bg-white/10"></span>
                            {t(group.key)} ({group.start + 1}-{group.start + 20})
                        </h4>
                        <div className="grid grid-cols-5 gap-2 px-2">
                            {Array.from({ length: 20 }, (_, i) => group.start + i + 1).map(num => {
                                const selected = selection.includes(num);
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => toggleHadith(num)}
                                        className={clsx(
                                            'h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-200',
                                            selected
                                                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                                : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                                        )}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-[10px] text-center text-white/40 font-medium">
                {selection.length} {t('hadithLabel').toLowerCase()} {t('selected')}
            </p>
        </div>
    );
};

export default StepHadithSelection;
