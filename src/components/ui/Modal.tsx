import { type ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const sizes: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw]',
};

export type ModalAccent = 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'none';

const accentBorders: Record<ModalAccent, string> = {
  indigo:  'border-indigo-500/40',
  cyan:    'border-cyan-500/40',
  emerald: 'border-emerald-500/40',
  amber:   'border-amber-500/40',
  rose:    'border-rose-500/40',
  purple:  'border-purple-500/40',
  none:    'border-slate-700/40',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: string;
  size?: ModalSize;
  accent?: ModalAccent;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  hideCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'lg',
  accent = 'indigo',
  icon,
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  hideCloseButton = false,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={`
              relative z-10 w-full ${sizes[size]}
              bg-gradient-to-br from-slate-800 to-slate-900
              border ${accentBorders[accent]}
              rounded-2xl shadow-2xl
              flex flex-col
              max-h-[92vh]
            `}
          >
            {/* Header */}
            {(title || !hideCloseButton) && (
              <div className={`
                flex items-center justify-between gap-4 px-6 py-4
                border-b border-slate-700/30
                ${accent !== 'none' ? `border-t-2 ${accentBorders[accent].replace('/40', '/60')}` : ''}
              `}>
                <div className="flex items-center gap-3 min-w-0">
                  {icon && <div className="flex-shrink-0">{icon}</div>}
                  <div className="min-w-0">
                    {title && (
                      <h2 className="text-base font-bold text-white truncate">{title}</h2>
                    )}
                    {subtitle && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
                    )}
                  </div>
                </div>
                {!hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                    aria-label="Cerrar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-700/30 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmVariant = variant === 'primary' ? 'primary' : variant === 'warning' ? 'warning' : 'danger';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
    </Modal>
  );
}
