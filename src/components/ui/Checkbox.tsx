import React from 'react';
import { clsx } from 'clsx';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  description?: string;
  className?: string;
  variant?: 'default' | 'wizard';
}

// A standard, simple checkbox
export const SimpleCheckbox: React.FC<CheckboxProps> = ({ label, description, id, className, variant = 'default', ...props }) => {
  const isWizard = variant === 'wizard';
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={id}
            className={clsx(
              "h-5 w-5 rounded border transition-all cursor-pointer",
              isWizard
                ? "bg-white/10 border-white/20 text-emerald-500 focus:ring-emerald-500/30"
                : "border-border-main text-primary focus:ring-primary"
            )}
            {...props}
          />
          <label htmlFor={id} className={clsx(
            "cursor-pointer font-black text-sm uppercase tracking-widest",
            isWizard ? "text-white/90" : "text-text-main"
          )}>
            {label}
          </label>
        </div>
        {description && (
          <p className={clsx(
            "text-xs mt-1 ml-8",
            isWizard ? "text-white/50" : "text-text-secondary"
          )}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// A modern toggle switch component
export const ToggleSwitch: React.FC<CheckboxProps> = ({ label, description, id, className, checked, variant = 'default', ...props }) => {
  const isWizard = variant === 'wizard';
  return (
    <div className={clsx(
      'p-4 rounded-2xl border transition-all duration-300',
      isWizard
        ? 'bg-white/5 border-white/10'
        : 'bg-bg-main border-border-main',
      className
    )}>
      <label htmlFor={id} className="flex items-center justify-between cursor-pointer">
        <div className="flex flex-col flex-1 mr-4 text-left">
          <span className={clsx(
            "font-black text-sm uppercase tracking-widest select-none",
            isWizard ? "text-white/90" : "text-text-main"
          )}>{label}</span>
          {description && (
            <span className={clsx(
              "text-xs mt-1",
              isWizard ? "text-white/50" : "text-text-secondary"
            )}>{description}</span>
          )}
        </div>
        <div className="relative">
          <input type="checkbox" id={id} className="sr-only" checked={checked} {...props} />
          <div className={clsx(
            'block w-14 h-8 rounded-full transition-all duration-300',
            checked
              ? (isWizard ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-primary')
              : 'bg-gray-400 dark:bg-gray-600 opacity-30'
          )}></div>
          <div className={clsx(
            'dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 shadow-md',
            checked ? 'translate-x-6' : ''
          )}></div>
        </div>
      </label>
    </div>
  );
};