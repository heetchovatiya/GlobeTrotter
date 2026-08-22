import React, { useState } from 'react';
import { Button } from '../common/Button';
import { useUIStore } from '../../store/uiStore';
import { Download, Upload } from 'lucide-react';

interface BulkUploadPanelProps {
  title: string;
  template: object;
  onUpload: (data: unknown) => Promise<{ created: number; updated: number; skipped: number; errors: string[] }>;
  onSuccess: () => void;
}

export const BulkUploadPanel: React.FC<BulkUploadPanelProps> = ({
  title,
  template,
  onUpload,
  onSuccess,
}) => {
  const { showToast } = useUIStore();
  const [jsonText, setJsonText] = useState('');
  const [uploading, setUploading] = useState(false);

  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadTemplate = () => {
    setJsonText(JSON.stringify(template, null, 2));
  };

  const handleUpload = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      showToast('error', 'Invalid JSON. Check syntax and try again.');
      return;
    }
    setUploading(true);
    try {
      const result = await onUpload(parsed);
      showToast(
        'success',
        `Bulk upload: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped.`
      );
      if (result.errors.length > 0) {
        console.warn('Bulk upload errors:', result.errors);
      }
      setJsonText('');
      onSuccess();
    } catch {
      showToast('error', 'Bulk upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</h4>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={downloadTemplate}>
            Download template
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={loadTemplate}>
            Load sample
          </Button>
        </div>
      </div>
      <textarea
        rows={6}
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder="Paste JSON array here or load the sample template…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 focus:border-brand-500 focus:outline-none"
      />
      <Button
        type="button"
        size="sm"
        variant="primary"
        leftIcon={<Upload className="h-3.5 w-3.5" />}
        isLoading={uploading}
        disabled={!jsonText.trim()}
        onClick={handleUpload}
      >
        Upload JSON
      </Button>
    </div>
  );
};
