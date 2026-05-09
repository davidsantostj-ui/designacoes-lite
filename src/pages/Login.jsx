import React, { useState } from 'react';
import { useData } from '../context/DataStore';
import { ChevronLeft, Lock } from 'lucide-react';

export default function Login() {
  const { users, login } = useData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPin('');
    setError(false);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPin('');
    setError(false);
  };

  const handleKeypad = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      // Auto-submit quando tiver 4 dígitos
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const verifyPin = (enteredPin) => {
    if (selectedUser.pin === enteredPin) {
      login(selectedUser.id);
    } else {
      setError(true);
      setPin(''); // Reseta para tentar de novo
    }
  };

  // Tela 1: Escolher Usuário
  if (!selectedUser) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#0b1120] animate-fade-in">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Quem está acessando?</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm">Selecione seu perfil na lista abaixo.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {users.map(user => (
              <button 
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner text-white text-2xl font-black mb-3">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 text-center line-clamp-1">{user.name.split(' ')[0]}</span>
                {user.role === 'admin' && (
                  <span className="text-[9px] font-black tracking-widest uppercase bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full mt-1">
                    Admin
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tela 2: Teclado PIN
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#f8fafc] dark:bg-[#0b1120] animate-slide-up">
      <div className="w-full max-w-xs relative">
        <button 
          onClick={handleBack}
          className="absolute -top-16 -left-4 w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white text-3xl font-black mb-4">
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedUser.name.split(' ')[0]}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
            <Lock size={14} /> Digite seu PIN
          </p>
        </div>

        {/* Indicadores de Senha */}
        <div className={`flex justify-center gap-4 mb-10 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > index 
                  ? (error ? 'bg-red-500 scale-110' : 'bg-blue-600 dark:bg-blue-500 scale-110')
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num}
              onClick={() => handleKeypad(num.toString())}
              className="h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-2xl font-black text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <div className="col-start-2">
            <button 
              onClick={() => handleKeypad('0')}
              className="w-full h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-2xl font-black text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              0
            </button>
          </div>
          <div className="col-start-3 flex items-center justify-center">
            <button 
              onClick={handleDelete}
              className="h-16 w-16 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 active:scale-95 transition-all"
            >
              <ChevronLeft size={28} strokeWidth={3} />
            </button>
          </div>
        </div>
        
        {error && (
          <p className="text-center text-red-500 font-bold text-sm mt-6 animate-fade-in">PIN Incorreto. Tente novamente.</p>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}} />
    </div>
  );
}
