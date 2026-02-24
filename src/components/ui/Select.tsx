import React from 'react';
import { clsx } from 'clsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  className?: string;
  wrapperClassName?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, className, wrapperClassName, children, ...props }) => {
  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className="block mb-2 font-semibold text-text-main text-left">
          {label}
        </label>
      )}
      <select
        id={id}
        className={clsx(
          'w-full px-4 py-2.5 rounded-lg border border-border-main bg-bg-main text-text-main',
          'focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors duration-300',
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