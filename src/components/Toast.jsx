import React, { useEffect } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

const Toast = ({ msg, type = 'info', onClose }) => {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warn: 'bg-orange-600'
  };

  const icons = {
    success: <Check size={14} />,
    error: <AlertCircle size={14} />,
    warn: <AlertCircle size={14} />,
    info: <Info size={14} />
  };

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl text-white text-sm font-medium shadow-2xl ${colors[type]}`}
    >
      <div className="flex items-center gap-2">
        {icons[type]}
        <span>{msg || 'Mensagem'}</span>
      </div>
    </div>
  );
};

export default Toast;