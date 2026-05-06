import React, { useCallback, useMemo, useState } from 'react';
import { Search, X, User, Users } from 'lucide-react';

const getRecentExternalNames = () => {
  try {
    const saved = localStorage.getItem('recentExternalNames');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const saveRecentExternalName = (name) => {
  try {
    const current = getRecentExternalNames();
    const updated = [name, ...current.filter(n => n !== name)].slice(0, 10);
    localStorage.setItem('recentExternalNames', JSON.stringify(updated));
  } catch {}
};

const ParticipantSelectModal = ({
  isOpen,
  onClose,
  onSelect,
  users = [],
  currentParticipantName,
  assignmentType,
  canUserTakeAssignment,
  getUserDisplayName,
  formatDatePt,
  assignmentDate
}) => {
  const [search, setSearch] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [recentExternalNames, setRecentExternalNames] = useState(() => getRecentExternalNames());

  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => u.approved);
    
    if (assignmentType) {
      result = result.filter((u) => canUserTakeAssignment(u, assignmentType));
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (u) => getUserDisplayName(u).toLowerCase().includes(searchLower)
      );
    }
    
    return result.sort((a, b) => getUserDisplayName(a).localeCompare(getUserDisplayName(b)));
  }, [users, search, assignmentType, canUserTakeAssignment, getUserDisplayName]);

  const handleSelectUser = (user) => {
    onSelect({
      usuario_id: user.id,
      participant_name: getUserDisplayName(user)
    });
    handleClose();
  };

  const handleSelectOther = () => {
    if (otherName.trim()) {
      saveRecentExternalName(otherName.trim());
      setRecentExternalNames(getRecentExternalNames());
      onSelect({
        usuario_id: '',
        participant_name: otherName.trim()
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setSearch('');
    setShowOtherInput(false);
    setOtherName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[280] bg-black/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] bg-white dark:bg-navy-900 card-surface rounded-3xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Trocar participante
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {assignmentDate && formatDatePt(assignmentDate)} • {assignmentType}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            Atual: <span className="text-slate-700 dark:text-slate-200">{currentParticipantName || 'Não definido'}</span>
          </p>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuário..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 max-h-[40vh]">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">
              Nenhum usuário encontrado
            </p>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const displayName = getUserDisplayName(user);
                const isCurrentUser = user.id === '';
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User size={18} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      {user.isAdmin && (
                        <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                          Administrador
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {!showOtherInput ? (
            <button
              type="button"
              onClick={() => setShowOtherInput(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Users size={18} />
              <span className="text-sm font-bold">Outro (pessoa fora do app)</span>
            </button>
          ) : (
            <div className="space-y-3">
              {recentExternalNames.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recentes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentExternalNames.map((name, idx) => (
                      <button
                        key={`${name}_${idx}`}
                        type="button"
                        onClick={() => setOtherName(name)}
                        className="rounded-full bg-slate-100 dark:bg-navy-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input
                type="text"
                value={otherName}
                onChange={(e) => setOtherName(e.target.value)}
                placeholder="Digite o nome da pessoa..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOtherInput(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSelectOther}
                  disabled={!otherName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantSelectModal;