import React from 'react';
import { clsx } from 'clsx';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  className?: string;
}

// A standard, simple checkbox
export const SimpleCheckbox: React.FC<CheckboxProps> = ({ label, id, className, ...props }) => {
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <input
        type="checkbox"
        id={id}
        className="h-4 w-4 rounded border-border-main text-primary focus:ring-primary cursor-pointer"
        {...props}
      />
      <label htmlFor={id} className="text-text-main cursor-pointer">
        {label}
      </label>
    </div>
  );
};

// A modern toggle switch component
export const ToggleSwitch: React.FC<CheckboxProps> = ({ label, id, className, checked, ...props }) => {
    return (
        <label htmlFor={id} className={clsx('flex items-center justify-between cursor-pointer p-3 bg-bg-main rounded-lg border border-border-main', className)}>
            <span className="text-text-main font-semibold select-none">{label}</span>
            <div className="relative">
                <input type="checkbox" id={id} className="sr-only" checked={checked} {...props} />
                <div className={clsx(
                    'block w-14 h-8 rounded-full transition-colors',
                    checked ? 'bg-primary' : 'bg-gray-400 dark:bg-gray-600'
                )}></div>
                <div className={clsx(
                    'dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform',
                    checked ? 'translate-x-6' : ''
                )}></div>
            </div>
        </label>
    );
};