import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/AppStore.jsx';

/** Accessible dialog: focuses the first control, Esc / backdrop click closes, focus returns afterwards. */
export default function Modal({ open, title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const first = ref.current?.querySelector('input, select, textarea, .modal-body button, .modal-foot button');
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Golden rule: Prevent errors. Destructive actions ask first (unless the user turned
 * confirmations off in Settings — Keep users in control). Cancel is the focused default.
 */
export function useConfirm() {
  const { state } = useStore();
  const [cfg, setCfg] = useState(null);

  const ask = useCallback(
    (opts, onConfirm) => {
      if (!state.settings.confirmDeletes && !opts.force) {
        onConfirm();
        return;
      }
      setCfg({ ...opts, onConfirm });
    },
    [state.settings.confirmDeletes]
  );

  const close = () => setCfg(null);
  const element = (
    <Modal
      open={!!cfg}
      title={cfg?.title || ''}
      onClose={close}
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              cfg.onConfirm();
              close();
            }}
          >
            {cfg?.confirmLabel || 'Confirm'}
          </button>
        </>
      }
    >
      <p>{cfg?.message}</p>
    </Modal>
  );
  return [element, ask];
}
