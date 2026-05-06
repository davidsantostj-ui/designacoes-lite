import React from 'react';
import PageHeader from '../PageHeader';
import UserAvatar from '../UserAvatar';

const SearchView = ({
  searchFilters,
  setSearchFilters,
  data,
  searchResults,
  ASSIGNMENT_TYPES,
  STATUS_TYPES,
  onClose,
  formatDatePt,
  formatAssignmentLabel,
  getUserDisplayName,
  getFriendlyTime
}) => {
  return (
    <div className="page-shell space-y-4 animate-fade-in">
      <PageHeader
        eyebrow="Busca"
        title="Busca avançada"
        description="Filtre designações, usuários e avisos sem sair do app."
        onBack={onClose}
      />

      <div className="panel-card space-y-3">
        <input
          value={searchFilters.text}
          onChange={(event) => setSearchFilters({ ...searchFilters, text: event.target.value })}
          placeholder="Texto, nome, designação..."
          className="soft-input"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={searchFilters.dateFrom}
            onChange={(event) =>
              setSearchFilters({ ...searchFilters, dateFrom: event.target.value })
            }
            className="soft-input"
          />
          <input
            type="date"
            value={searchFilters.dateTo}
            onChange={(event) => setSearchFilters({ ...searchFilters, dateTo: event.target.value })}
            className="soft-input"
          />
        </div>

        <select
          value={searchFilters.user}
          onChange={(event) => setSearchFilters({ ...searchFilters, user: event.target.value })}
          className="soft-select"
        >
          <option value="">Usuário</option>
          {data.users
            .filter((entry) => entry.approved)
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} {entry.surname}
              </option>
            ))}
        </select>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={searchFilters.type}
            onChange={(event) => setSearchFilters({ ...searchFilters, type: event.target.value })}
            className="soft-select"
          >
            <option value="">Tipo</option>
            {ASSIGNMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={searchFilters.status}
            onChange={(event) =>
              setSearchFilters({ ...searchFilters, status: event.target.value })
            }
            className="soft-select"
          >
            <option value="">Status</option>
            {STATUS_TYPES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2 text-[9px] font-black uppercase tracking-widest sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-navy-900">
            <input
              type="checkbox"
              checked={searchFilters.includeAssignments}
              onChange={(event) =>
                setSearchFilters({
                  ...searchFilters,
                  includeAssignments: event.target.checked
                })
              }
            />
            Designações
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-navy-900">
            <input
              type="checkbox"
              checked={searchFilters.includeUsers}
              onChange={(event) =>
                setSearchFilters({ ...searchFilters, includeUsers: event.target.checked })
              }
            />
            Usuários
          </label>
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-2 dark:bg-navy-900">
            <input
              type="checkbox"
              checked={searchFilters.includeNotifications}
              onChange={(event) =>
                setSearchFilters({
                  ...searchFilters,
                  includeNotifications: event.target.checked
                })
              }
            />
            Avisos
          </label>
        </div>
      </div>

      {searchFilters.includeAssignments && (
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-black uppercase text-slate-400">Designações</h3>
          {searchResults.assignments.map((assignment) => (
            <div
              key={`s-${assignment.id}`}
              className="card-surface rounded-3xl border p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800"
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                {formatDatePt(assignment.date)}
              </p>
              <p className="text-sm font-bold dark:text-white">
                {formatAssignmentLabel(assignment.tipo_designacao)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-slate-400">
                  {getUserDisplayName(data.users.find((entry) => entry.id === assignment.usuario_id))}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-tighter ${
                    assignment.status === 'confirmado'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {assignment.status}
                </span>
              </div>
            </div>
          ))}
          {searchResults.assignments.length === 0 && (
            <p className="py-4 text-center text-xs font-bold uppercase text-slate-400">
              Nenhum resultado.
            </p>
          )}
        </div>
      )}

      {searchFilters.includeUsers && (
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-black uppercase text-slate-400">Usuários</h3>
          {searchResults.users.map((entry) => (
            <div
              key={`u-${entry.id}`}
              className="card-surface flex items-center gap-3 rounded-3xl border p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800"
            >
              <UserAvatar
                name={entry.name}
                surname={entry.surname}
                userId={entry.id}
                size="sm"
                lastActive={entry.last_active}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold dark:text-white">
                  {entry.name} {entry.surname}
                </p>
                <p className="text-[10px] text-slate-400">{entry.phone}</p>
              </div>
            </div>
          ))}
          {searchResults.users.length === 0 && (
            <p className="py-4 text-center text-xs font-bold uppercase text-slate-400">
              Nenhum resultado.
            </p>
          )}
        </div>
      )}

      {searchFilters.includeNotifications && (
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-black uppercase text-slate-400">Avisos</h3>
          {searchResults.notifications.map((notification) => (
            <div
              key={`n-${notification.id}`}
              className="card-surface rounded-3xl border p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800"
            >
              <p className="text-sm font-semibold dark:text-slate-100">{notification.text}</p>
              <span className="mt-2 block text-[8px] font-bold uppercase tracking-widest text-slate-400">
                {getFriendlyTime(notification.created_at)}
              </span>
            </div>
          ))}
          {searchResults.notifications.length === 0 && (
            <p className="py-4 text-center text-xs font-bold uppercase text-slate-400">
              Nenhum resultado.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchView;
