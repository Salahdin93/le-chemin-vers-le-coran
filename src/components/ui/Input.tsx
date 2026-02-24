import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  wrapperClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, wrapperClassName, ...props }) => {
  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="block mb-2 font-semibold text-text-main text-left">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'w-full px-4 py-2.5 rounded-lg border border-border-main bg-bg-main text-text-main',
          'focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors duration-300',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default Input;