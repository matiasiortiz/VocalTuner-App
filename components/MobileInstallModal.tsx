import React, { useState } from 'react';
import { STANDALONE_HTML } from '../standalonePayload';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  // URL compartida de la app o la URL actual
  const appUrl = window.location.origin.includes('run.app')
    ? window.location.origin
    : 'https://ais-pre-c276zhwwdyoywhkitmcqnp-308739712943.us-west2.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}&margin=8`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadStandalone = () => {
    if (!STANDALONE_HTML || !STANDALONE_HTML.includes('<!DOCTYPE html>')) return;
    const blob = new Blob([STANDALONE_HTML], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'VocalTuner-standalone.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-2xl">smartphone</span>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Probar en tu Celular o PC
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Usa el enlace directo o genera el archivo autónomo desde memoria
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Opción 1: Enlace directo (Recomendada) */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-background-dark/50 border border-gray-200 dark:border-gray-700/80">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-black">1</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Abrir directo en el navegador del móvil
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Escanea el código con la cámara de tu celular o copia el enlace. En tu teléfono pulsa <strong>&quot;Agregar a inicio&quot;</strong> en Safari o Chrome para usarla a pantalla completa como una app instalada.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 shrink-0">
                <img
                  src={qrCodeUrl}
                  alt="Código QR para abrir en celular"
                  className="w-28 h-28 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Enlace para tu teléfono:
                </span>
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="w-full text-xs font-mono bg-gray-100 dark:bg-background-dark border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 select-all"
                />
                <button
                  onClick={handleCopy}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    copied
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  <span>{copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Opción 2: Descarga Standalone Directa desde Memoria */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-background-dark/50 border border-gray-200 dark:border-gray-700/80">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black">2</span>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Descargar archivo VocalTuner-standalone.html
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Se genera directamente desde la aplicación sin depender de cookies del navegador. Puedes abrirlo con doble clic en tu computadora o en cualquier celular sin conexión.
            </p>

            <button
              type="button"
              onClick={handleDownloadStandalone}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">{downloaded ? 'check_circle' : 'download'}</span>
              <span>{downloaded ? '¡Archivo descargado correctamente!' : 'Descargar VocalTuner-standalone.html'}</span>
            </button>
          </div>

          {/* Tips de instalación en pantalla de inicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700/70">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white mb-1">
                <span className="material-symbols-outlined text-base text-primary">phone_iphone</span>
                <span>En iPhone (iOS)</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Abre en Safari, pulsa el botón <strong>Compartir</strong> (cuadrado con flecha) y selecciona <strong>&quot;Agregar a la pantalla de inicio&quot;</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700/70">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-white mb-1">
                <span className="material-symbols-outlined text-base text-primary">android</span>
                <span>En Android</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Abre en Chrome, toca los <strong>tres puntos (⋮)</strong> arriba a la derecha y pulsa <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a pantalla principal&quot;</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
