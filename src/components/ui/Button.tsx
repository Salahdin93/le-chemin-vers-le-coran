import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'link' | 'accent';
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
  const baseStyles = 'btn-premium relative font-cairo font-bold rounded-2xl transition-all duration-300 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center overflow-hidden';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-4 py-2 text-xs uppercase tracking-widest',
    md: 'px-6 py-3 text-sm font-bold',
    lg: 'px-8 py-4 text-base font-black uppercase tracking-tight',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0',
    accent: 'accent-gradient text-white shadow-xl shadow-accent-color/25 hover:shadow-accent-color/40 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-bg-secondary text-text-main border border-border-main hover:bg-bg-main shadow-sm hover:border-accent-color/30',
    success: 'bg-success text-white shadow-lg shadow-success/25 hover:shadow-success/40 hover:-translate-y-0.5',
    warning: 'bg-warning text-black shadow-lg shadow-warning/20 hover:-translate-y-0.5',
    danger: 'bg-danger text-white shadow-lg shadow-danger/20 hover:-translate-y-0.5',
    ghost: 'bg-transparent border border-border-main/50 text-text-main hover:bg-accent-color/5 hover:border-accent-color/30',
    link: 'bg-transparent text-accent-color underline-offset-4 hover:underline p-0 decoration-2 transition-all',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props as any}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
};

export default Button;