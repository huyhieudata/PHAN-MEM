import { createContext, useCallback, useContext, useState } from 'react';

type ConfirmOpts = { title: string; message: string; confirmLabel?: string; danger?: boolean };
type Ask = (opts: ConfirmOpts) => Promise<boolean>;

const ToastContext = createContext<(message: string) => void>(() => {});
const ConfirmContext = createContext<Ask>(async () => false);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState('');
  const [confirm, setConfirm] = useState<(ConfirmOpts & { resolve: (value: boolean) => void }) | null>(null);

  const push = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(current => (current === message ? '' : current)), 2400);
  }, []);

  const ask = useCallback<Ask>(opts => new Promise(resolve => setConfirm({ ...opts, resolve })), []);

  function close(value: boolean) {
    confirm?.resolve(value);
    setConfirm(null);
  }

  return (
    <ToastContext.Provider value={push}>
      <ConfirmContext.Provider value={ask}>
        {children}
        {toast && <div className="toast" role="status">{toast}</div>}
        {confirm && (
          <div className="modal-back" onMouseDown={() => close(false)}>
            <div className="modal" role="dialog" aria-modal="true" aria-label={confirm.title} onMouseDown={e => e.stopPropagation()}>
              <header><b>{confirm.title}</b></header>
              <div className="body">
                <p>{confirm.message}</p>
                <div className="form-actions">
                  <button type="button" className="btn-ghost" onClick={() => close(false)}>Hủy</button>
                  <button type="button" className={confirm.danger ? 'btn-danger' : 'btn-primary'} onClick={() => close(true)}>
                    {confirm.confirmLabel ?? 'Xác nhận'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
