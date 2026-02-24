import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({ className, shape = 'rect', ...props }) => {
  return (
    <div
      className={clsx(
        'bg-border-main animate-pulse',
        shape === 'rect' && 'rounded-md',
        shape === 'circle' && 'rounded-full',
        className
      )}
      {...props}
    />
  );
};

export default Skeleton;