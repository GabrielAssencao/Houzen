import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { NotificationContext } from './notificationContext';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(({ type = 'info', title, message, duration = 5000 }) => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    setNotifications((current) => [...current, { id, type, title, message }]);
    if (duration > 0) window.setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="houzen-toast-region" aria-live="polite" aria-atomic="false">
        {notifications.map((item) => {
          const Icon = icons[item.type] || Info;
          return (
            <section key={item.id} className={`houzen-toast houzen-toast--${item.type}`} role={item.type === 'error' ? 'alert' : 'status'}>
              <Icon size={19} aria-hidden="true" />
              <div className="flex-grow-1">
                {item.title && <p className="houzen-toast__title">{item.title}</p>}
                {item.message && <p className="houzen-toast__message">{item.message}</p>}
              </div>
              <button type="button" onClick={() => dismiss(item.id)} className="houzen-icon-button" aria-label="Fechar aviso"><X size={17} /></button>
            </section>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}
