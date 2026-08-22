import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Printer, FileSpreadsheet, ChevronDown, ExternalLink } from 'lucide-react';
import { exportsApi } from '../../api/exports';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';

interface DownloadPlanButtonProps {
  tripId: number | string;
  variant?: 'primary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
}

export const DownloadPlanButton: React.FC<DownloadPlanButtonProps> = ({
  tripId,
  variant = 'outline',
  size = 'sm',
  className,
}) => {
  const { showToast } = useUIStore();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const minWidth = 240;
    const left = Math.min(Math.max(8, rect.right - minWidth), window.innerWidth - minWidth - 8);
    setMenuPos({
      top: rect.bottom + 6,
      left,
      minWidth,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const handlePrint = () => {
    window.open(`/trips/${tripId}/print`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleOpenPrintView = () => {
    window.open(`/trips/${tripId}/print`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleDownload = async (type: 'budget' | 'summary') => {
    setLoading(type);
    try {
      if (type === 'budget') await exportsApi.downloadBudgetCsv(tripId);
      else await exportsApi.downloadSummaryCsv(tripId);
      showToast('success', 'Download started.');
      setOpen(false);
    } catch {
      showToast('error', 'Could not download file.');
    } finally {
      setLoading(null);
    }
  };

  const menu =
    open && menuPos
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[100] cursor-default bg-transparent"
              aria-label="Close download menu"
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              className="fixed z-[101] rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 text-sm animate-fade-in"
              style={{
                top: menuPos.top,
                left: menuPos.left,
                minWidth: menuPos.minWidth,
              }}
            >
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Export trip plan
              </p>
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-800 whitespace-nowrap"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 shrink-0 text-brand-600" />
                <span className="font-medium">Print / Save as PDF</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-800 whitespace-nowrap"
                onClick={handleOpenPrintView}
              >
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="font-medium">Open print view</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                role="menuitem"
                disabled={loading === 'summary'}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-800 whitespace-nowrap disabled:opacity-50"
                onClick={() => handleDownload('summary')}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-medium">
                  {loading === 'summary' ? 'Downloading…' : 'Trip plan (CSV)'}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={loading === 'budget'}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-800 whitespace-nowrap disabled:opacity-50"
                onClick={() => handleDownload('budget')}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-amber-600" />
                <span className="font-medium">
                  {loading === 'budget' ? 'Downloading…' : 'Budget (CSV)'}
                </span>
              </button>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant={variant}
        size={size}
        className={className}
        leftIcon={<Download className="h-4 w-4" />}
        rightIcon={
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Download plan
      </Button>
      {menu}
    </>
  );
};
