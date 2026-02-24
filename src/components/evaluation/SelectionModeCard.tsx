import React from 'react';
import { clsx } from 'clsx';

interface SelectionModeCardProps {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

const SelectionModeCard: React.FC<SelectionModeCardProps> = ({ icon, title, description, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "text-left p-4 rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        isActive
          ? 'bg-primary/10 border-primary shadow-md'
          : 'bg-bg-main border-border-main hover:border-border-hover'
      )}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-bold text-lg text-text-main">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </button>
  );
};

export default SelectionModeCard;