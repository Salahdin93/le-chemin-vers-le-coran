import React from 'react'; 
import { WizardData } from '@/types';
import Button from '@/components/ui/Button';

interface StepProps {
    formData: Partial<WizardData>;
    updateData: (data: Partial<WizardData>) => void;
    t: (key: string) => string;
    wantsReading: boolean;
    setWantsReading: (val: boolean) => void;
    wantsRevision: boolean;
    setWantsRevision: (val: boolean) => void;
}

const StepInitialChoice: React.FC<StepProps> = ({
    formData,
    updateData,
    t,
    wantsReading,
    setWantsReading,
    wantsRevision,
    setWantsRevision,
}) => {
    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-left">Souhaites-tu planifier ta lecture dès maintenant ?</p>
                <div className="flex gap-4">
                    <Button
                        className="flex-1"
                        variant={wantsReading ? 'success' : 'ghost'}
                        onClick={() => {
                            setWantsReading(true);
                            updateData({ wantsReading: true }); // facultatif : pour garder trace dans formData
                        }}
                    >
                        Oui
                    </Button>
                    <Button
                        className="flex-1"
                        variant={!wantsReading ? 'danger' : 'ghost'}
                        onClick={() => {
                            setWantsReading(false);
                            updateData({ wantsReading: false });
                        }}
                    >
                        Non
                    </Button>
                </div>
            </div>
            <div>
                <p className="mb-2 text-left">Souhaites-tu planifier ta révision dès maintenant ?</p>
                <div className="flex gap-4">
                    <Button
                        className="flex-1"
                        variant={wantsRevision ? 'success' : 'ghost'}
                        onClick={() => {
                            setWantsRevision(true);
                            updateData({ wantsRevision: true });
                        }}
                    >
                        Oui
                    </Button>
                    <Button
                        className="flex-1"
                        variant={!wantsRevision ? 'danger' : 'ghost'}
                        onClick={() => {
                            setWantsRevision(false);
                            updateData({ wantsRevision: false });
                        }}
                    >
                        Non
                    </Button>
                </div>
                {wantsRevision && (
                    <p className="text-xs text-left opacity-70 mt-2">
                        Tu pourras modifier ce paramètre plus tard.
                    </p>
                )}
            </div>
        </div>
    );
};

export default StepInitialChoice;
