import React, { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

const ReloadPrompt = () => {
  const updateIntervalRef = useRef(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return;
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
      }
      updateIntervalRef.current = window.setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    }
  });

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-bounce-in">
      <div className="bg-navy-900 text-white rounded-3xl shadow-2xl p-4 sm:p-5 flex flex-col gap-3 w-[280px] border border-slate-700">
        <div className="flex items-start justify-between">
          <div className="flex gap-2 items-center text-emerald-400">
            <RefreshCw size={18} className="animate-spin-slow" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Nova versao</h3>
          </div>
          <button
            onClick={close}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-slate-300 font-semibold leading-tight">
          Uma nova versao do aplicativo esta disponivel.
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="mt-1 w-full bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-black uppercase tracking-widest text-[10px] py-3 rounded-2xl transition-colors"
        >
          Atualizar agora
        </button>
      </div>
    </div>
  );
};

export default ReloadPrompt;
