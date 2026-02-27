import React from 'react';
import { clsx } from 'clsx';
import Button from './Button';
import Modal from './Modal';
import { useStore } from '@/context/AppContext';

interface NotificationCenterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenterPanel: React.FC<NotificationCenterPanelProps> = ({ isOpen, onClose }) => {
  const { state, dispatch, t } = useStore();

  const handleClear = () => {
    dispatch({ type: 'CLEAR_NOTIFICATION_HISTORY' });
  };

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch({ type: 'REMOVE_NOTIFICATION_FROM_HISTORY', payload: id });
  };

  const [selectedNotification, setSelectedNotification] = React.useState<any>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl w-full"
    >
      <div className="flex flex-col h-[70vh]">
        <div className="p-4 border-b border-border-main flex justify-between items-center bg-card-bg rounded-t-2xl">
          <h3 className="text-xl font-black tracking-tight">{t('notificationCenter')}</h3>
          <Button size="sm" variant="ghost" onClick={onClose} className="rounded-xl">{t('back')}</Button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-bg-main/30 backdrop-blur-sm">
          {state.notificationHistory.length > 0 ? (
            <ul className="space-y-4">
              {state.notificationHistory.map(notif => (
                <li
                  key={notif.id}
                  className={clsx(
                    "p-5 rounded-2xl bg-bg-secondary border border-border-main/50 relative group transition-all duration-300",
                    notif.content ? "cursor-pointer hover:border-accent-color hover:shadow-lg hover:shadow-accent-color/5" : ""
                  )}
                  onClick={() => { if (notif.content) setSelectedNotification(notif); }}
                >
                  <p className="font-bold text-lg mb-1">{notif.title}</p>
                  <p className="text-sm text-text-secondary">{typeof notif.message === 'string' ? notif.message : (notif.content ? t('clickToView') : '')}</p>
                  <button
                    onClick={(e) => handleRemove(notif.id!, e)}
                    className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-danger/10 hover:text-danger rounded-xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-sm font-black uppercase tracking-widest">{t('noNotifications')}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-main bg-card-bg rounded-b-2xl">
          <Button
            className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-danger/10"
            variant="danger"
            onClick={handleClear}
            disabled={state.notificationHistory.length === 0}
          >
            {t('clearHistory')}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        className="max-w-lg w-full z-[2100]"
      >
        <div className="p-6 bg-card-bg rounded-2xl">
          <h2 className="text-2xl font-black mb-6 tracking-tight border-b border-border-main pb-4">{selectedNotification?.title || t('notification')}</h2>
          <div className="text-text-main leading-relaxed">
            {selectedNotification?.content}
          </div>
          <div className="mt-8 pt-4">
            <Button className="w-full rounded-xl" onClick={() => setSelectedNotification(null)}>{t('close') || 'Fermer'}</Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default NotificationCenterPanel;