import React from 'react';
import { clsx } from 'clsx';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('premium-card group', className)}
    {...props}
  />
));
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  CardHeaderProps
>(({ className, icon, children, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('flex items-center gap-3 p-5', className)}
    {...props}
  >
    {icon && <span className="text-2xl">{icon}</span>}
    <div className="flex flex-col space-y-1.5 flex-1">
      {children}
    </div>
  </div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx('text-base font-semibold leading-none tracking-tight text-text-main', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={clsx('p-5 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export default Card;