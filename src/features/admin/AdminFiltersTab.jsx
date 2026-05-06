import React from 'react';

const AdminFiltersTab = ({
  data,
  filters,
  setFilters,
  STATUS_TYPES,
  filteredAssignments,
  formatDatePt,
  formatAssignmentLabel,
  getUserDisplayName
}) => {
  return (
    <div className="space-y-6">
      <div className="panel-card space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-400">Busca detalhada</h3>
        <select
          className="soft-select"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        >
          <option value="">Irmão</option>
          {data.users
            .filter((u) => u.approved)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.surname}
              </option>
            ))}
        </select>
        <input
          type="date"
          className="soft-input"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />
        <select
          className="soft-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">Status</option>
          {STATUS_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFilters({ ...filters, hasFiltered: true })}
          className="soft-button-primary w-full justify-center"
        >
          Filtrar agora
        </button>
      </div>
      {filters.hasFiltered && (
        <div className="space-y-4">
          {filteredAssignments.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-navy-800 card-surface p-4 rounded-3xl shadow-sm border dark:border-slate-800 animate-slide-up"
            >
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                {formatDatePt(a.date)}
              </span>
              <p className="font-bold text-sm dark:text-white leading-tight mt-1">
                {formatAssignmentLabel(a.tipo_designacao)}
              </p>
              <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] text-slate-400 font-black uppercase">
                  {getUserDisplayName(data.users.find((u) => u.id === a.usuario_id))}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${a.status === 'confirmado' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredAssignments.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-10 font-bold uppercase">
              Nenhum resultado.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFiltersTab;
