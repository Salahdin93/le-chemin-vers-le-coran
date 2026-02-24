import React from 'react';
import { clsx } from 'clsx';
import Button from './Button';
import { useStore } from '@/context/AppContext';

interface NotificationCenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenterPanel: React.FC<NotificationCenterPanelProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useStore();

  const handleClear = () => {
    dispatch({ type: 'CLEAR_NOTIFICATION_HISTORY' });
  };
  
  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION_FROM_HISTORY', payload: id });
  };

  return (
    <div className={clsx(
      "fixed inset-y-0 right-0 z-[101] w-full max-w-sm bg-card-bg shadow-lg transform transition-transform duration-300 ease-in-out border-l border-border-main",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="p-4 border-b border-border-main flex justify-between items-center">
        <h3 className="text-lg font-bold">Centre de notifications</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>Fermer</Button>
      </div>
      <div className="p-4 h-[calc(100vh-120px)] overflow-y-auto">
        {state.notificationHistory.length > 0 ? (
          <ul className="space-y-3">
            {state.notificationHistory.map(notif => (
              <li key={notif.id} className="p-3 rounded-lg bg-bg-main relative group">
                <p className="font-semibold">{notif.title}</p>
                <p className="text-sm opacity-80">{typeof notif.message === 'string' ? notif.message : "Contenu personnalisé"}</p>
                <button onClick={() => handleRemove(notif.id!)} className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center opacity-70 mt-8">Aucune notification pour le moment.</p>
        )}
      </div>
      <div className="p-4 border-t border-border-main">
        <Button className="w-full" variant="danger" onClick={handleClear} disabled={state.notificationHistory.length === 0}>
          Vider l'historique
        </Button>
      </div>
    </div>
  );
};

export default NotificationCenterPanel;