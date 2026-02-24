import React from 'react';
import { WizardData } from '@/types';
import Card, { CardContent } from '@/components/ui/Card';
import { BookOpen, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface StepProps {
    updateData: (data: Partial<WizardData>) => void;
    setWantsReading: (val: boolean) => void;
    setWantsRevision: (val: boolean) => void;
}

const StepInitialChoice: React.FC<StepProps> = ({ updateData, setWantsReading, setWantsRevision }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
                className={clsx("cursor-pointer border-2 transition-all hover:border-primary")}
                onClick={() => {
                    setWantsReading(true);
                    setWantsRevision(false);
                    updateData({ wantsReading: true, wantsRevision: false });
                }}
            >
                <CardContent className="flex flex-col items-center py-6">
                    <BookOpen size={48} className="text-primary mb-4" />
                    <h3 className="text-xl font-bold">Lire seulement</h3>
                    <p className="text-sm text-text-secondary text-center mt-2">Mise en place d'un plan de lecture (Khatma)</p>
                </CardContent>
            </Card>

            <Card
                className={clsx("cursor-pointer border-2 transition-all hover:border-primary")}
                onClick={() => {
                    setWantsReading(true);
                    setWantsRevision(true);
                    updateData({ wantsReading: true, wantsRevision: true });
                }}
            >
                <CardContent className="flex flex-col items-center py-6">
                    <div className="flex gap-2 mb-4">
                        <BookOpen size={48} className="text-primary" />
                        <RefreshCw size={48} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Lecture & Révision</h3>
                    <p className="text-sm text-text-secondary text-center mt-2">Combiner lecture et révision de votre mémorisation</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default StepInitialChoice;
