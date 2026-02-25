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

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-4 rounded-2xl bg-white/5 border border-white/10 custom-scrollbar">
                {Array.from({ length: totalHadiths }, (_, i) => i + 1).map(num => {
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

            <p className="text-[10px] text-center text-white/40 font-medium">
                {selection.length} {t('hadithLabel').toLowerCase()} {t('selected')}
            </p>
        </div>
    );
};

export default StepHadithSelection;
