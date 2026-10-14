import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { uid, modKey } from '../utils.js';

/*
 * Golden rules: Informative feedback (every action gets a message)
 * and Easy reversal (any toast can carry an Undo, also reachable with Ctrl/⌘+Z).
 */
const ToastContext = createContext(null);
const ICONS = { success: '✓', info: 'ℹ', warning: '!', error: '✕' };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const undoMap = useRef(new Map()); // toastId -> undo function (in insertion order)

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    undoMap.current.delete(id);
  }, []);

  const show = useCallback(
    (message, opts = {}) => {
      const id = uid();
      const toast = { id, message, type: opts.type || 'success', hasUndo: !!opts.undo, action: opts.action };
      setToasts((t) => [...t.slice(-2), toast]);
      if (opts.undo) undoMap.current.set(id, opts.undo);
      setTimeout(() => dismiss(id), opts.undo ? 7000 : 3500);
      return id;
    },
    [dismiss]
  );

  const runUndo = useCallback(
    (id) => {
      const fn = undoMap.current.get(id);
      if (!fn) return false;
      fn();
      dismiss(id);
      show('Undone — everything is back the way it was.', { type: 'info' });
      return true;
    },
    [dismiss, show]
  );

  /** Undo the most recent undoable action (keyboard shortcut). */
  const undoLast = useCallback(() => {
    const ids = [...undoMap.current.keys()];
    return ids.length ? runUndo(ids[ids.length - 1]) : false;
  }, [runUndo]);

  const value = useMemo(() => ({ show, undoLast }), [show, undoLast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
            <span className="toast-msg">{t.message}</span>
            {t.action && (
              <Link to={t.action.to} className="toast-link" onClick={() => dismiss(t.id)}>
                {t.action.label}
              </Link>
            )}
            {t.hasUndo && (
              <button className="toast-undo" onClick={() => runUndo(t.id)} title={`Undo (${modKey}+Z)`}>
                Undo
              </button>
            )}
            <button className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
