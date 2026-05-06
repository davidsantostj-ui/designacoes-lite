import React, { useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

const Toast = ({ msg, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-navy-800',
    warn: 'bg-orange-600'
  };

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl animate-slide-up flex items-center gap-3 ${colors[type]}`}
    >
      {type === 'success' && <Check size={14} />}
      {type === 'error' && <AlertCircle size={14} />}
      {type === 'warn' && <AlertCircle size={14} />}
      {msg}
    </div>
  );
};

export default Toast;
