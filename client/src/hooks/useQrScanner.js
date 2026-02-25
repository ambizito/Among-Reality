import { useCallback, useEffect, useRef, useState } from 'react';

export function useQrScanner({ isOpen, containerId = 'task-qr-reader', onDecode }) {
  const scannerRef = useRef(null);
  const scanLockRef = useRef(false);

  const [scannerError, setScannerError] = useState('');
  const [scanInFlight, setScanInFlight] = useState(false);

  const resetScannerState = useCallback(() => {
    setScannerError('');
    scanLockRef.current = false;
    setScanInFlight(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    let disposed = false;
    let scannerInstance = null;
    setScannerError('');

    const stopScanner = async () => {
      const scanner = scannerRef.current || scannerInstance;
      if (!scanner) return;
      try {
        await scanner.stop();
      } catch {
        // ignore
      }
      try {
        await scanner.clear();
      } catch {
        // ignore
      }
      if (scannerRef.current === scanner) scannerRef.current = null;
    };

    const handleDecodedText = async (decodedText) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      setScanInFlight(true);

      try {
        await onDecode(decodedText);
      } finally {
        if (!disposed) {
          setScanInFlight(false);
        }
        scanLockRef.current = false;
      }
    };

    const bootScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (disposed) return;

        scannerInstance = new Html5Qrcode(containerId);
        scannerRef.current = scannerInstance;

        const config = {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          rememberLastUsedCamera: true,
          aspectRatio: 1,
        };

        try {
          await scannerInstance.start(
            { facingMode: { exact: 'environment' } },
            config,
            handleDecodedText,
            () => {},
          );
        } catch {
          await scannerInstance.start(
            { facingMode: 'environment' },
            config,
            handleDecodedText,
            () => {},
          );
        }
      } catch {
        if (!disposed) {
          setScannerError('Nao foi possivel abrir camera. Use HTTPS e permita camera.');
        }
      }
    };

    bootScanner();

    return () => {
      disposed = true;
      scanLockRef.current = false;
      setScanInFlight(false);
      void stopScanner();
    };
  }, [containerId, isOpen, onDecode]);

  return {
    scannerError,
    scanInFlight,
    resetScannerState,
  };
}
