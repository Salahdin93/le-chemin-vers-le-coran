import React from 'react';
import { clsx } from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  className?: string;
  wrapperClassName?: string;
  children: React.ReactNode;
  variant?: 'default' | 'wizard';
}

const Select: React.FC<SelectProps> = ({ label, id, className, wrapperClassName, children, variant = 'default', ...props }) => {
  const isWizard = variant === 'wizard';
  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            'block mb-2 text-[10px] font-black uppercase tracking-[0.2em] ml-1',
            isWizard ? 'text-emerald-200/70' : 'font-semibold text-text-main'
          )}
        >
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'w-full px-4 py-3 rounded-xl border transition-colors duration-300 focus:outline-none focus:ring-2',
          isWizard
            ? 'bg-white/10 border-white/15 text-white focus:border-emerald-400/50 focus:ring-emerald-400/10 [&_option]:bg-gray-100 [&_option]:text-gray-900'
            : 'bg-bg-main text-text-main border-border-main focus:border-primary focus:ring-primary/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
