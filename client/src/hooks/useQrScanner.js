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

  const buildScannerErrorMessage = useCallback((error) => {
    if (!window.isSecureContext) {
      return 'Camera bloqueada em HTTP. Use HTTPS (start-with-tunnel.cmd).';
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return 'Este navegador nao suporta camera para leitura de QR.';
    }

    const errorName = error?.name || '';
    if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
      return 'Permissao da camera negada. Libere a camera no navegador.';
    }

    if (errorName === 'NotFoundError' || errorName === 'OverconstrainedError') {
      return 'Nenhuma camera compativel foi encontrada para o scanner.';
    }

    return 'Nao foi possivel abrir camera. Verifique permissao e HTTPS.';
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
        if (!window.isSecureContext) {
          setScannerError(buildScannerErrorMessage());
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setScannerError(buildScannerErrorMessage());
          return;
        }

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
        } catch (primaryStartError) {
          try {
            await scannerInstance.start(
              { facingMode: 'environment' },
              config,
              handleDecodedText,
              () => {},
            );
          } catch (fallbackStartError) {
            throw fallbackStartError || primaryStartError;
          }
        }
      } catch (error) {
        if (!disposed) {
          setScannerError(buildScannerErrorMessage(error));
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
  }, [buildScannerErrorMessage, containerId, isOpen, onDecode]);

  return {
    scannerError,
    scanInFlight,
    resetScannerState,
  };
}
