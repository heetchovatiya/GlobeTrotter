import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start p-4 rounded-xl shadow-lg border backdrop-blur transition-all duration-300 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-900'
              : toast.type === 'warning'
              ? 'bg-amber-50/95 border-amber-200 text-amber-900'
              : 'bg-slate-900/90 border-slate-700 text-white'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-brand-400" />}
          </div>
          <div className="ml-3 flex-1 text-sm font-medium leading-snug">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 -mr-1 -mt-1 p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="h-4 w-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
};

