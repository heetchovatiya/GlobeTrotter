import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Printer, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { exportsApi } from '../../api/exports';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../common/Button';

interface DownloadPlanButtonProps {
  tripId: number | string;
  variant?: 'primary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const DownloadPlanButton: React.FC<DownloadPlanButtonProps> = ({
  tripId,
  variant = 'outline',
  size = 'sm',
}) => {
  const { showToast } = useUIStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handlePrint = () => {
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

  return (
    <div className="relative">
      <Button
        type="button"
        variant={variant}
        size={size}
        leftIcon={<Download className="h-4 w-4" />}
        rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
        onClick={() => setOpen((v) => !v)}
      >
        Download plan
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-xl bg-white border border-slate-200 shadow-elevated py-1 text-sm">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-700"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 text-brand-600" />
              Print / Save as PDF
            </button>
            <Link
              to={`/trips/${tripId}/print`}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 text-slate-700"
              onClick={() => setOpen(false)}
            >
              <Printer className="h-4 w-4 text-slate-400" />
              Open print view
            </Link>
            <button
              type="button"
              disabled={loading === 'summary'}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-700 disabled:opacity-50"
              onClick={() => handleDownload('summary')}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Trip plan (CSV)
            </button>
            <button
              type="button"
              disabled={loading === 'budget'}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 text-slate-700 disabled:opacity-50"
              onClick={() => handleDownload('budget')}
            >
              <FileSpreadsheet className="h-4 w-4 text-amber-600" />
              Budget (CSV)
            </button>
          </div>
        </>
      )}
    </div>
  );
};
