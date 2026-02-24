import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export interface NotificationProps {
    id: string;
    title?: string;
    message?: string;
    content?: React.ReactNode;
    type: 'info' | 'warning' | 'success' | 'error' | 'danger';
    duration?: number;
    onDismiss: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ id, title, message, content, type, duration = 8000, onDismiss }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 500);
    };

    useEffect(() => {
        const timer = setTimeout(handleDismiss, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onDismiss]);

    const typeClasses = {
        info: 'border-blue-500',
        warning: 'border-yellow-500',
        success: 'border-green-500',
        danger: 'border-red-500',
        error: 'border-red-500',
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleDismiss}
            onKeyPress={(e) => e.key === 'Enter' && handleDismiss()}
            className={clsx(
                'bg-card-bg p-4 rounded-lg shadow-lg border-l-4 transition-all duration-500 ease-out max-w-sm cursor-pointer hover:shadow-xl',
                typeClasses[type],
                isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
            )}
        >
            {content ? (
                content
            ) : (
                <>
                    {title && <h4 className="font-bold text-text-main">{title}</h4>}
                    {message && <p className="text-sm text-text-secondary" dangerouslySetInnerHTML={{ __html: message }} />}
                </>
            )}
        </div>
    );
};

export default Notification;