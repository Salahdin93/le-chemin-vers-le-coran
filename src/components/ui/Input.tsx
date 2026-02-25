import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, id, className, wrapperClassName, icon, ...props }) => {
  return (
    <div className={clsx('w-full group', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="block mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-main/40 group-focus-within:text-accent-color transition-colors ml-1">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-text-main/30 group-focus-within:text-accent-color transition-colors">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={clsx(
            'w-full px-5 py-4 rounded-[1.25rem] border border-border-main bg-bg-secondary/50 text-text-main font-medium backdrop-blur-sm',
            'focus:bg-bg-secondary focus:border-accent-color/50 focus:ring-4 focus:ring-accent-color/5 focus:outline-none transition-all duration-500',
            'placeholder:text-text-main/20 placeholder:font-normal',
            icon && 'pl-12',
            className
          )}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;