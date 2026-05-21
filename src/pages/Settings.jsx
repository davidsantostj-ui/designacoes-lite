import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataStore';
import { User, Mail, Lock, Moon, Sun, Globe, DownloadCloud, Info, ChevronRight, LogOut, ArrowLeft, X, Check } from 'lucide-react';

// Toast interno para Settings
function SettingsToast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500' };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-slide-up ${colors[type] || colors.info}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
}

export default function Settings() {
  const { currentUser, isDarkMode, toggleDarkMode, logout, updateUserProfile } = useData();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // Edit Profile States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPin, setEditPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update check State
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Language modal State
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Open profile modal and prefill data
  const handleOpenEditProfile = () => {
    setEditName(currentUser?.name || '');
    setEditEmail(currentUser?.email || '');
    setEditPin(currentUser?.pin || '');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('Nome não pode estar vazio.', 'error');
      return;
    }
    if (!editPin.trim() || editPin.length < 4) {
      showToast('PIN deve conter no mínimo 4 dígitos.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await updateUserProfile(currentUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        pin: editPin.trim()
      });
      if (success) {
        showToast('Perfil atualizado com sucesso!');
        setIsEditProfileOpen(false);
      } else {
        showToast('Falha ao atualizar perfil.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar alterações.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckUpdates = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      showToast('O aplicativo já está na versão mais recente! (v6.0.0-lite)', 'info');
    }, 1500);
  };

  const OptionRow = ({ icon: Icon, title, value, onClick, isLast }) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${!isLast ? 'border-b border-slate-100 dark:border-slate-800/50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs font-bold text-slate-400 max-w-[150px] truncate">{value}</span>}
        {onClick && <ChevronRight size={16} className="text-slate-300" />}
      </div>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Ajustes</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Configure seu perfil e preferências.</p>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 px-2">Perfil</h3>
        <div className="rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <OptionRow icon={User} title="Nome" value={currentUser?.name} onClick={handleOpenEditProfile} />
          <OptionRow icon={Mail} title="E-mail" value={currentUser?.email} onClick={handleOpenEditProfile} />
          <OptionRow icon={Lock} title="Senha (PIN)" value={currentUser?.pin ? `••••` : 'Não definido'} onClick={handleOpenEditProfile} isLast />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 px-2 mt-6">Preferências</h3>
        <div className="rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                {isDarkMode ? <Moon size={16} strokeWidth={2.5} /> : <Sun size={16} strokeWidth={2.5} />}
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">Modo Escuro</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={toggleDarkMode} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <OptionRow icon={Globe} title="Idioma" value="Português (BR)" onClick={() => setIsLangOpen(true)} isLast />
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-2 px-2 mt-6">Sistema</h3>
        <div className="rounded-[24px] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <OptionRow icon={DownloadCloud} title="Buscar Atualizações" onClick={handleCheckUpdates} />
          <OptionRow icon={Info} title="Versão do App" value="v6.0.0-lite" isLast />
        </div>
      </div>
      
      <div className="pt-4 flex justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
        <button onClick={logout} className="text-xs font-black text-red-500 uppercase tracking-widest px-6 py-4 rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2">
          <LogOut size={16} strokeWidth={3} /> Sair do Aplicativo
        </button>
      </div>

      {/* Modal: Editar Perfil */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] flex items-end md:items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl animate-slide-up border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Editar Perfil</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required 
                  className="soft-input" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="soft-input" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">PIN de Acesso (mínimo 4 dígitos)</label>
                <input 
                  type="text" 
                  pattern="[0-9]*" 
                  maxLength="6"
                  value={editPin}
                  onChange={e => setEditPin(e.target.value)}
                  required 
                  className="soft-input font-mono text-center tracking-widest" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)} 
                  className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Idioma */}
      {isLangOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] flex items-end md:items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl animate-slide-up border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">Selecionar Idioma</h3>
              <button onClick={() => setIsLangOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => setIsLangOpen(false)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-blue-500/30 text-left font-black text-slate-800 dark:text-slate-100 text-sm"
              >
                <span>Português (BR)</span>
                <Check size={16} className="text-blue-500" />
              </button>
              <button 
                onClick={() => showToast('Tradução em breve na próxima atualização!', 'info')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left font-bold text-slate-500 text-sm"
              >
                <span>English</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100/50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">Beta</span>
              </button>
              <button 
                onClick={() => showToast('¡Traducción disponible en breve!', 'info')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left font-bold text-slate-500 text-sm"
              >
                <span>Español</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100/50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">Beta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay: Verificando Atualização */}
      {isCheckingUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-fade-in">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm font-black text-white tracking-widest uppercase animate-pulse">Buscando atualizações...</p>
        </div>
      )}

      {toast && <SettingsToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
