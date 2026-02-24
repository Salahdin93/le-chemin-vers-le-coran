import React from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: 'button' | 'label';
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  as = 'button',
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'font-cairo font-semibold rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:opacity-90 focus:ring-primary',
    secondary: 'bg-border-main text-text-main hover:bg-opacity-80 focus:ring-primary',
    success: 'bg-success text-white hover:opacity-90 focus:ring-success',
    warning: 'bg-warning text-black hover:opacity-90 focus:ring-warning',
    danger: 'bg-danger text-white hover:opacity-90 focus:ring-danger',
    ghost: 'bg-transparent border border-border-main text-text-main hover:bg-border-main',
  };

  const Component = as;

  return (
    <Component
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...(props as any)}
    >
      {children}
    </Component>
  );
};

export default Button;