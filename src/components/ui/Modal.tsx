import React, { useEffect } from 'react';
import { clsx } from 'clsx';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  closeOnClickOutside?: boolean; // New prop to control behavior
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className, closeOnClickOutside = true }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    if (closeOnClickOutside) {
        onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={handleOverlayClick}
      style={{ animationDuration: '0.3s' }}
    >
      <div
        className={clsx(
          'bg-card-bg text-text-main p-6 md:p-8 rounded-xl shadow-2xl w-[90%] max-w-md max-h-[95vh] flex flex-col',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;