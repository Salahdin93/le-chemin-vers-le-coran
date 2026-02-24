import React, { useEffect } from 'react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  closeOnClickOutside?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className, closeOnClickOutside = true }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onClick={closeOnClickOutside ? onClose : undefined}
    >
      <div
        className={clsx(
          'glass-card text-text-main p-6 md:p-7 w-[92%] max-w-md max-h-[94vh] flex flex-col animate-fadeSlideUp',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;