import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionText?: string;
  onActionClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, onActionClick }) => {
  return (
    <div className="text-center py-12 px-6 bg-bg-main rounded-lg border-2 border-dashed border-border-main">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-text-main mb-2">{title}</h3>
      <p className="text-text-secondary max-w-sm mx-auto">{message}</p>
      {actionText && onActionClick && (
        <Button onClick={onActionClick} className="mt-6">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;