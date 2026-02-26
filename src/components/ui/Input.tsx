import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  wrapperClassName?: string;
  icon?: React.ReactNode;
  /** Pass 'wizard-input' to use white/emerald label style for dark green onboarding screens */
  variant?: 'default' | 'wizard';
}

const Input: React.FC<InputProps> = ({ label, id, className, wrapperClassName, icon, variant = 'default', type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isWizard = variant === 'wizard' || (wrapperClassName || '').includes('wizard-input');
  const isPassword = type === 'password';

  return (
    <div className={clsx('w-full group', wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            'block mb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ml-1',
            isWizard
              ? 'text-emerald-200/70 group-focus-within:text-emerald-300'
              : 'text-text-main/40 group-focus-within:text-accent-color'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className={clsx(
            'absolute left-4 transition-colors z-10',
            isWizard ? 'text-emerald-200/50 group-focus-within:text-emerald-300' : 'text-text-main/30 group-focus-within:text-accent-color'
          )}>
            {icon}
          </div>
        )}
        <input
          id={id}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={clsx(
            'w-full px-5 py-4 rounded-[1.25rem] font-medium backdrop-blur-sm transition-all duration-500',
            'focus:outline-none focus:ring-4',
            isWizard
              ? [
                'bg-white/10 border border-white/15 text-white placeholder:text-white/30',
                'focus:bg-white/15 focus:border-emerald-400/50 focus:ring-emerald-400/10',
              ]
              : [
                'border-2 border-border-main/50 bg-bg-secondary text-text-main',
                'focus:bg-bg-secondary focus:border-accent-color focus:ring-accent-color/10',
                'placeholder:text-text-main/30 placeholder:font-normal shadow-inner',
              ],
            icon && 'pl-12',
            isPassword && 'pr-12',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={clsx(
              'absolute right-4 transition-colors hover:scale-110 active:scale-95 z-10',
              isWizard ? 'text-emerald-200/50 hover:text-emerald-300' : 'text-text-main/30 hover:text-accent-color'
            )}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
