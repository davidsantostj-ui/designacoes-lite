import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Copy,
  Download,
  Eye,
  Mail,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserCog
} from 'lucide-react';
import { ASSIGNMENT_TYPE_GROUPS } from '../../constants/appConstants';
import UserAvatar from '../../components/UserAvatar';

const compactActionClass =
  'flex min-h-[42px] items-center justify-center gap-2 rounded-[16px] px-3 py-2 text-center text-[0.68rem] font-black uppercase leading-tight tracking-[0.08em] whitespace-normal transition sm:text-[0.72rem]';

const groupDescription = {
  mechanical: 'Microfones, indicadores e áudio e vídeo.',
  spiritual: 'Presidência, orações, leituras e demais partes espirituais.'
};

const countEnabledCapabilities = (types, capabilities) =>
  types.filter((type) => capabilities[type] === true).length;

const buildCapabilitiesMap = (types, nextValue) =>
  types.reduce((accumulator, type) => {
    accumulator[type] = nextValue;
    return accumulator;
  }, {});

const AdminUsersTab = ({
  data,
  user,
  isAdminUid,
  handleImpersonate,
  selectedAdminUser,
  setSelectedAdminUser,
  handleToggleAdminRole,
  handleDeleteUser,
  handleUpdateUserName,
  ASSIGNMENT_TYPES,
  getUserAssignmentCapabilities,
  handleUpdateUserCapabilities,
  handleSendRecoveryEmail,
  handleTransferAssignments
}) => {
  const [search, setSearch] = useState('');
  const [transferTargetUid, setTransferTargetUid] = useState('');

  const approvedUsers = useMemo(() => {
    const normalizedSearch = String(search || '')
      .trim()
      .toLowerCase();
    return (data.users || [])
      .filter((entry) => entry.approved)
      .filter((entry) => {
        if (!normalizedSearch) return true;
        const name = `${entry.name || ''} ${entry.surname || ''}`.trim().toLowerCase();
        const email = String(entry.email || '').toLowerCase();
        return name.includes(normalizedSearch) || email.includes(normalizedSearch);
      });
  }, [data.users, search]);

  const headerStats = useMemo(
    () => [
      {
        label: 'Aprovados',
        value: (data.users || []).filter((entry) => entry.approved).length,
        tone: 'text-blue-700 bg-blue-50'
      },
      {
        label: 'Admins',
        value: (data.users || []).filter((entry) => entry.isAdmin || isAdminUid(entry.id)).length,
        tone: 'text-emerald-700 bg-emerald-50'
      }
    ],
    [data.users, isAdminUid]
  );

  const handleCopyUid = async (uid) => {
    try {
      await navigator.clipboard.writeText(uid);
    } catch (error) {
      const tmp = document.createElement('textarea');
      tmp.value = uid;
      tmp.setAttribute('readonly', 'true');
      tmp.style.position = 'absolute';
      tmp.style.left = '-9999px';
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
    }
  };

  const handleExportUids = () => {
    const header = 'nome,uid';
    const rows = approvedUsers.map((entry) => {
      const fullName = `${entry.name || ''} ${entry.surname || ''}`.trim();
      const safeName = `"${fullName.replace(/"/g, '""')}"`;
      return `${safeName},${entry.id}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'uids_usuarios.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const applyCapabilityPreset = (uid, currentCapabilities, types, nextValue) => {
    const nextCapabilities = ASSIGNMENT_TYPES.reduce((accumulator, type) => {
      accumulator[type] = types.includes(type) ? nextValue : currentCapabilities?.[type] === true;
      return accumulator;
    }, {});
    handleUpdateUserCapabilities(uid, nextCapabilities);
  };

  return (
    <div className="space-y-5">
      <section className="panel-card space-y-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Gestão de usuários
            </p>
            <h3 className="mt-1.5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Permissões e funções de designação
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-snug text-slate-500 dark:text-slate-300">
              Ajuste rapidamente quem pode receber cada tipo de designação.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportUids}
            className="soft-button-secondary w-full justify-center whitespace-nowrap px-4 py-2.5 sm:w-auto"
          >
            <Download size={16} />
            Exportar UIDs
          </button>
        </div>

        <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="soft-input"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            {headerStats.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl px-3 py-2 text-center sm:min-w-[88px] ${item.tone}`}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-75">
                  {item.label}
                </p>
                <p className="mt-0.5 text-base font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {approvedUsers.map((entry) => {
          const fullName = `${entry.name || ''} ${entry.surname || ''}`.trim();
          const isUserAdmin = entry.isAdmin || isAdminUid(entry.id);
          const capabilities = getUserAssignmentCapabilities
            ? getUserAssignmentCapabilities(entry)
            : {};
          const enabledCount = countEnabledCapabilities(ASSIGNMENT_TYPES, capabilities);
          const capabilityGroups = ASSIGNMENT_TYPE_GROUPS.map((group) => ({
            ...group,
            enabledCount: countEnabledCapabilities(group.types, capabilities)
          }));
          const isExpanded = selectedAdminUser === entry.id;

          return (
            <section key={entry.id} className="panel-card space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    name={entry.name}
                    surname={entry.surname}
                    userId={entry.id}
                    size="sm"
                    lastActive={entry.last_active}
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {fullName || 'Usuário sem nome'}
                      </p>
                      {isUserAdmin && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">
                          Admin
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500 dark:bg-navy-900 dark:text-slate-300">
                        {enabledCount}/{ASSIGNMENT_TYPES.length} funções
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-300">
                      {entry.email || 'Sem e-mail'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAdminUser(isExpanded ? null : entry.id)}
                  className={`${
                    isExpanded ? 'soft-button-primary' : 'soft-button-secondary'
                  } ${compactActionClass}`}
                >
                  <MoreHorizontal size={14} />
                  {isExpanded ? 'Fechar' : 'Gerenciar'}
                </button>
              </div>

              {isExpanded && (
                <div className="rounded-[24px] bg-slate-50 p-4 dark:bg-navy-900">
                  <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const form = event.currentTarget;
                        handleUpdateUserName(
                          entry.id,
                          form.elements.name.value,
                          form.elements.surname.value
                        );
                      }}
                      className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800"
                    >
                      <div className="flex items-center gap-2">
                        <UserCog size={16} className="text-slate-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Dados do usuário
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <input
                          name="name"
                          defaultValue={entry.name || ''}
                          placeholder="Nome"
                          className="soft-input"
                          required
                        />
                        <input
                          name="surname"
                          defaultValue={entry.surname || ''}
                          placeholder="Sobrenome"
                          className="soft-input"
                        />
                      </div>

                      <button
                        type="submit"
                        className={`soft-button-primary ${compactActionClass} mt-2.5 w-full`}
                      >
                        Salvar nome
                      </button>
                    </form>

                    <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-slate-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Ações da conta
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyUid(entry.id)}
                          className={`soft-button-ghost ${compactActionClass} w-full`}
                        >
                          <Copy size={13} />
                          Copiar UID
                        </button>

                        {entry.id !== user.id && !isAdminUid(entry.id) && (
                          <button
                            type="button"
                            onClick={() => handleImpersonate(entry)}
                            className={`soft-button-secondary ${compactActionClass} w-full`}
                          >
                            <Eye size={14} />
                            Visualizar usuário
                          </button>
                        )}

                        {!isAdminUid(entry.id) && (
                          <button
                            type="button"
                            onClick={() => handleToggleAdminRole(entry.id, !isUserAdmin)}
                            className={`${
                              isUserAdmin ? 'soft-button-secondary' : 'soft-button-primary'
                            } ${compactActionClass} w-full`}
                          >
                            <ShieldCheck size={14} />
                            {isUserAdmin ? 'Remover admin' : 'Tornar admin'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (handleSendRecoveryEmail) {
                              handleSendRecoveryEmail(entry.email);
                            }
                          }}
                          className={`soft-button-secondary ${compactActionClass} w-full`}
                        >
                          <Mail size={14} />
                          Enviar recup. senha
                        </button>

                        <button
                          type="button"
                          onClick={() => setTransferTargetUid(entry.id)}
                          className={`soft-button-secondary ${compactActionClass} w-full`}
                        >
                          <ArrowRightLeft size={14} />
                          Transferir designações
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(entry.id)}
                          className={`soft-button-danger ${compactActionClass} w-full`}
                        >
                          <Trash2 size={14} />
                          Remover usuário
                        </button>
                      </div>
                    </section>
                  </div>

                  <section className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-navy-800">
                    <div className="space-y-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Funções de designação
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                          Escolha o que esse publicador pode receber.
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateUserCapabilities(
                              entry.id,
                              buildCapabilitiesMap(ASSIGNMENT_TYPES, true)
                            )
                          }
                          className={`soft-button-secondary ${compactActionClass} w-full`}
                        >
                          Marcar todas
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateUserCapabilities(
                              entry.id,
                              buildCapabilitiesMap(ASSIGNMENT_TYPES, false)
                            )
                          }
                          className={`soft-button-secondary ${compactActionClass} w-full`}
                        >
                          Limpar tudo
                        </button>
                        {capabilityGroups.map((group) => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() =>
                              applyCapabilityPreset(entry.id, capabilities, group.types, true)
                            }
                            className={`soft-button ${compactActionClass} w-full`}
                          >
                            {group.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {capabilityGroups.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-[20px] border border-slate-200 bg-slate-50/90 p-3.5 dark:border-slate-700 dark:bg-navy-900"
                        >
                          <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                  {group.label}
                                </p>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                                  {group.enabledCount}/{group.types.length}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-300">
                                {groupDescription[group.id]}
                              </p>
                            </div>

                            <div className="grid w-full gap-2 sm:w-auto sm:min-w-[250px] sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() =>
                                  applyCapabilityPreset(entry.id, capabilities, group.types, true)
                                }
                                className="soft-button-ghost justify-center px-3 py-2 text-center text-[0.66rem] leading-tight tracking-[0.08em]"
                              >
                                Marcar grupo
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  applyCapabilityPreset(entry.id, capabilities, group.types, false)
                                }
                                className="soft-button-ghost justify-center px-3 py-2 text-center text-[0.66rem] leading-tight tracking-[0.08em]"
                              >
                                Limpar grupo
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {group.types.map((type) => {
                              const checked = capabilities[type] === true;
                              return (
                                <label
                                  key={`${entry.id}-${type}`}
                                  className={`flex min-h-[60px] cursor-pointer items-center justify-between gap-3 rounded-[18px] border px-3.5 py-3 transition ${
                                    checked
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-navy-800'
                                  }`}
                                >
                                  <span className="min-w-0">
                                    <span
                                      className={`block text-sm font-black leading-tight ${
                                        checked
                                          ? 'text-emerald-700'
                                          : 'text-slate-700 dark:text-slate-200'
                                      }`}
                                    >
                                      {type}
                                    </span>
                                    <span
                                      className={`mt-1 block text-[11px] ${
                                        checked
                                          ? 'text-emerald-600'
                                          : 'text-slate-400 dark:text-slate-500'
                                      }`}
                                    >
                                      {checked ? 'Habilitada' : 'Desabilitada'}
                                    </span>
                                  </span>

                                  <span className="relative inline-flex shrink-0">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      checked={checked}
                                      onChange={() =>
                                        handleUpdateUserCapabilities(entry.id, {
                                          ...capabilities,
                                          [type]: !checked
                                        })
                                      }
                                    />
                                    <span
                                      className={`block h-6 w-11 rounded-full transition ${
                                        checked
                                          ? 'bg-emerald-500'
                                          : 'bg-slate-300 dark:bg-slate-600'
                                      }`}
                                    />
                                    <span
                                      className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                        checked ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </section>
          );
        })}

        {approvedUsers.length === 0 && (
          <div className="panel-card text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
            Nenhum usuário aprovado encontrado.
          </div>
        )}
      </div>

      {transferTargetUid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-navy-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Transferir Designações
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Selecione o usuário que vai receber as designações do usuário selecionado:
            </p>
            <select
              className="soft-input mt-4 w-full"
              value=""
              onChange={(e) => {
                if (e.target.value && handleTransferAssignments) {
                  handleTransferAssignments(transferTargetUid, e.target.value);
                  setTransferTargetUid('');
                }
              }}
            >
              <option value="">Selecione...</option>
              {approvedUsers
                .filter((u) => u.id !== transferTargetUid)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {`${u.name || ''} ${u.surname || ''}`.trim() || 'Usuário sem nome'} (
                    {u.email || 'sem email'})
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => setTransferTargetUid('')}
              className={`soft-button-secondary ${compactActionClass} mt-4 w-full`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersTab;
