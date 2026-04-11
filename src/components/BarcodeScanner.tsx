import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const scannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          // Vibrate on success
          if (navigator.vibrate) navigator.vibrate(100);
          onScan(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {} // ignore scan failures (normal during scanning)
      )
      .then(() => setStarting(false))
      .catch((err) => {
        setStarting(false);
        if (String(err).includes('NotAllowed') || String(err).includes('Permission')) {
          setError('Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen.');
        } else if (String(err).includes('NotFound')) {
          setError('Keine Kamera gefunden.');
        } else {
          setError(`Kamera-Fehler: ${String(err).slice(0, 100)}`);
        }
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-blue-400" />
          <span className="font-semibold text-zinc-100">Barcode scannen</span>
        </div>
        <button
          onClick={() => {
            scannerRef.current?.stop().catch(() => {});
            onClose();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-300"
        >
          <X size={20} />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div id="barcode-reader" className="w-full h-full" />

        {starting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
            <span className="text-zinc-400 text-sm">Kamera wird gestartet...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 px-8 gap-4">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={onClose}
              className="h-12 px-6 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
            >
              Schließen
            </button>
          </div>
        )}
      </div>

      {/* Hint */}
      <div className="shrink-0 px-4 py-4 bg-black/80 text-center">
        <p className="text-zinc-400 text-sm">Halte den Barcode in den Kamerabereich</p>
      </div>
    </div>
  );
}
