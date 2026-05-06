import React, { useMemo, useState } from 'react';
import { MailCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import UserAvatar from '../../components/UserAvatar';

const AdminApprovalsTab = ({
  data,
  handleUpdateApproval,
  handleApproveAll,
  handleApproveByDomain
}) => {
  const [domain, setDomain] = useState('');
  const pendingUsers = useMemo(
    () => (data?.users || []).filter((entry) => !entry.approved),
    [data?.users]
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <section className="panel-card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Novos cadastros
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Aprove em lote ou revise cada cadastro manualmente.
            </p>
          </div>

          <button
            type="button"
            onClick={handleApproveAll}
            disabled={pendingUsers.length === 0}
            className="soft-button-secondary justify-center disabled:opacity-50"
          >
            Aprovar todos
          </button>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-navy-900/60">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <MailCheck size={18} />
            </span>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Aprovação por domínio
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  Informe um domínio como <span className="font-black">empresa.com</span>.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="empresa.com"
                  className="soft-input"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <button
                  type="button"
                  onClick={() => handleApproveByDomain(domain)}
                  className="soft-button-primary justify-center"
                >
                  Aprovar domínio
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {pendingUsers.map((entry) => (
          <section
            key={entry.id}
            className="card-surface flex flex-col gap-4 rounded-[28px] border p-4 shadow-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar name={entry.name} surname={entry.surname} userId={entry.id} size="sm" />

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                  {[entry.name, entry.surname].filter(Boolean).join(' ') || 'Usuário sem nome'}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-300">
                  {entry.email || 'Sem e-mail'}
                </p>
                <p className="truncate text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  {entry.phone || 'Sem telefone'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handleUpdateApproval(entry.id, false)}
                className="touch-target rounded-2xl bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                aria-label={`Recusar cadastro de ${entry.name || 'usuário'}`}
                title="Recusar cadastro"
              >
                <ThumbsDown size={18} />
              </button>

              <button
                type="button"
                onClick={() => handleUpdateApproval(entry.id, true)}
                className="touch-target rounded-2xl bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                aria-label={`Aprovar cadastro de ${entry.name || 'usuário'}`}
                title="Aprovar cadastro"
              >
                <ThumbsUp size={18} />
              </button>
            </div>
          </section>
        ))}

        {pendingUsers.length === 0 && (
          <div className="panel-card py-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Tudo aprovado
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Nenhum cadastro aguardando revisão.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovalsTab;
