import React from 'react';

const AdminStatusTab = ({ data }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-black uppercase text-slate-400 px-1">Resumo do Mês</h3>
      {data.users
        .filter((u) => u.approved)
        .map((u) => {
          const tasks = data.assignments.filter((a) => a.usuario_id === u.id);
          const pending = tasks.filter((t) => t.status === 'pendente').length;
          const confirmed = tasks.filter((t) => t.status === 'confirmado').length;
          const swap = tasks.filter((t) => t.status === 'troca').length;
          if (tasks.length === 0) return null;
          return (
            <div
              key={u.id}
              className="bg-white dark:bg-navy-800 card-surface p-4 rounded-3xl shadow-sm flex flex-col gap-3 border dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <p className="font-black text-xs dark:text-white uppercase tracking-wider">
                  {u.name} {u.surname}
                </p>
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {tasks.length} tarefa(s)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-slate-50 dark:bg-navy-950 p-2.5 rounded-2xl text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Aceitas</p>
                  <p className="text-base font-black text-emerald-600">{confirmed}</p>
                </div>
                <div className="bg-slate-50 dark:bg-navy-950 p-2.5 rounded-2xl text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Faltam</p>
                  <p className="text-base font-black text-amber-600">{pending}</p>
                </div>
                <div className="bg-slate-50 dark:bg-navy-950 p-2.5 rounded-2xl text-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Trocas</p>
                  <p className="text-base font-black text-orange-600">{swap}</p>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default AdminStatusTab;
