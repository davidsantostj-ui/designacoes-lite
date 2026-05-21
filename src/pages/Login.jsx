import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataStore';
import { ChevronLeft, Lock, Search, UserCheck } from 'lucide-react';

export default function Login() {
  const { users, login } = useData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Physical keydown handler for accessibility
  useEffect(() => {
    if (!selectedUser) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypad(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, pin]);

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
      
      // Auto-submit when it reaches 4 digits
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
      setPin(''); // Reset
    }
  };

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Color generator for profile avatars to look dynamic
  const getAvatarGradient = (name) => {
    const code = name.charCodeAt(0) % 5;
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-600',
      'from-violet-500 to-purple-700',
      'from-pink-500 to-rose-600',
      'from-amber-400 to-orange-600'
    ];
    return gradients[code];
  };

  // Screen 1: Choose User Profile
  if (!selectedUser) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
        
        {/* Modern animated backdrop elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-violet-400/10 to-teal-400/15 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              Quem é você?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold text-sm">
              Selecione seu perfil para acessar a programação.
            </p>
          </div>

          {/* Search bar inside glass container */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Digite seu nome para buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md text-slate-800 dark:text-slate-100 text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-500/35 transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Grid Container */}
          <div className="max-h-[50dvh] overflow-y-auto pr-1 grid grid-cols-2 gap-4 pb-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-2 text-center py-10 bg-white/40 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-slate-400 font-bold text-sm">Nenhum irmão encontrado.</p>
              </div>
            ) : (
              filteredUsers.map(user => (
                <button 
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="group relative flex flex-col items-center justify-center p-5 rounded-3xl bg-white/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 hover:border-blue-300 dark:hover:border-blue-900/50 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(user.name)} flex items-center justify-center shadow-lg group-hover:shadow-blue-500/10 text-white text-2xl font-black mb-3 border-2 border-white dark:border-slate-800 transform group-hover:scale-105 transition-transform duration-300`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200 text-center line-clamp-1">
                    {user.name.split(' ')[0]}
                  </span>
                  
                  {user.role === 'admin' ? (
                    <span className="text-[8px] font-black tracking-widest uppercase bg-amber-100/80 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full mt-1.5 border border-amber-200/40">
                      Admin
                    </span>
                  ) : (
                    <span className="text-[8px] font-black tracking-widest uppercase bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 px-2 py-0.5 rounded-full mt-1.5">
                      Publicador
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Pin Pad View (Tactile Premium Glassmorphism)
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-violet-400/10 to-teal-400/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xs relative z-10 animate-slide-up">
        {/* Back button */}
        <button 
          onClick={handleBack}
          className="absolute -top-16 -left-4 w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-full transition-all shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>

        {/* User Card Header */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getAvatarGradient(selectedUser.name)} flex items-center justify-center shadow-xl text-white text-3xl font-black mb-4 border-2 border-white dark:border-slate-800`}>
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedUser.name.split(' ')[0]}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1 flex items-center gap-1.5 tracking-wide">
            <Lock size={13} className="text-slate-400" /> DIGITE SEU PIN DE SEGURANÇA
          </p>
        </div>

        {/* Password dots container */}
        <div className={`flex justify-center gap-4 mb-8 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > index 
                  ? (error ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/30' : 'bg-blue-600 dark:bg-blue-500 scale-110 shadow-lg shadow-blue-500/30')
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Tactical Keypad */}
        <div className="grid grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num}
              onClick={() => handleKeypad(num.toString())}
              className="h-16 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-2xl font-black text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 shadow-sm active:scale-90 hover:scale-[1.03] transition-all duration-100 backdrop-blur-md"
            >
              {num}
            </button>
          ))}
          
          {/* Backspace Button */}
          <button 
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-100/50 dark:bg-slate-900/30 border border-transparent text-slate-400 dark:text-slate-500 flex items-center justify-center active:scale-90 hover:text-slate-700 dark:hover:text-slate-250 transition-all"
          >
            <ChevronLeft size={28} strokeWidth={3} />
          </button>

          {/* Key 0 */}
          <button 
            onClick={() => handleKeypad('0')}
            className="h-16 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-2xl font-black text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800 shadow-sm active:scale-90 hover:scale-[1.03] transition-all duration-100 backdrop-blur-md"
          >
            0
          </button>

          {/* Placeholder for symmetry */}
          <div className="h-16 rounded-2xl flex items-center justify-center text-slate-400">
            <UserCheck size={20} className="opacity-15" />
          </div>
        </div>
        
        {error && (
          <p className="text-center text-red-500 font-bold text-xs mt-6 uppercase tracking-wider animate-pulse">
            PIN Incorreto. Tente novamente.
          </p>
        )}
      </div>

      {/* Shake Keyframe CSS animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.35s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}
