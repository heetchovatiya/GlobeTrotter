import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface TripQrCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export const TripQrCode: React.FC<TripQrCodeProps> = ({ url, size = 96, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setDataUrl(null);
      return;
    }
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [url, size]);

  if (!dataUrl) return null;

  return (
    <img
      src={dataUrl}
      alt="QR code for trip link"
      width={size}
      height={size}
      className={`rounded-lg border border-slate-200 bg-white p-1 ${className}`}
    />
  );
};
