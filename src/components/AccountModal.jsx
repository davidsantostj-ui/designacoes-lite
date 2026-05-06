import React from 'react';
import { BellRing, MonitorSmartphone, Volume2, X } from 'lucide-react';

const ToggleRow = ({ title, description, checked, onChange, disabled = false, icon: Icon }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 dark:bg-navy-800">
    <div className="flex min-w-0 items-start gap-3">
      {Icon ? (
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-navy-900 dark:text-slate-200">
          <Icon size={16} />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-white">{title}</p>
        <p className="text-[10px] font-semibold text-slate-400">{description}</p>
      </div>
    </div>

    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
      />
      <div className="h-6 w-10 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 dark:bg-slate-700" />
      <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
    </label>
  </div>
);

const AccountModal = ({
  open,
  user,
  displayName,
  onClose,
  onChangePassword,
  onChangeDisplayName,
  onUpdatePreferences,
  soundEnabled,
  toggleSoundNotifications,
  dndEnabled,
  setDndEnabled,
  dndFrom,
  setDndFrom,
  dndTo,
  setDndTo,
  notificationsSupported,
  notificationPermission,
  desktopNotificationsEnabled,
  toggleDesktopNotifications
}) => {
  if (!open || !user) return null;

  const notificationStatusLabel = !notificationsSupported
    ? 'Indisponível neste navegador'
    : notificationPermission === 'granted'
      ? 'Permissão liberada'
      : notificationPermission === 'denied'
        ? 'Permissão bloqueada'
        : 'Permissão pendente';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="card-surface max-h-[85vh] w-full max-w-md space-y-6 overflow-y-auto rounded-4xl bg-white p-6 shadow-xl animate-fade-in dark:bg-navy-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest">Conta</h3>
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-navy-800"
          >
            <X size={14} />
          </button>
        </div>

        <section className="rounded-3xl bg-slate-50 p-4 dark:bg-navy-950/40">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              Alterar senha
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Segurança da conta
            </p>
          </div>

          <form onSubmit={onChangePassword} className="mt-4 space-y-3">
            <input
              name="current"
              type="password"
              placeholder="Senha atual"
              className="w-full rounded-2xl bg-white p-4 text-center text-lg font-bold dark:bg-navy-800"
              required
            />
            <input
              name="n1"
              type="password"
              placeholder="Nova senha"
              className="w-full rounded-2xl bg-white p-4 text-center text-lg font-bold dark:bg-navy-800"
              required
            />
            <input
              name="n2"
              type="password"
              placeholder="Repetir senha"
              className="w-full rounded-2xl bg-white p-4 text-center text-lg font-bold dark:bg-navy-800"
              required
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 text-xs font-black uppercase text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-navy-900 py-3 text-xs font-black uppercase text-white"
              >
                Salvar
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 dark:bg-navy-950/40">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              Alterar nome
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Exibido no app
            </p>
          </div>

          <form onSubmit={onChangeDisplayName} className="mt-4 space-y-3">
            <input
              name="fullName"
              placeholder="Nome e sobrenome"
              defaultValue={displayName}
              className="w-full rounded-2xl bg-white p-4 text-center text-sm font-bold dark:bg-navy-800"
              required
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black uppercase text-white"
            >
              Salvar nome
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 dark:bg-navy-950/40">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              Preferências
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Som, notificações e horários
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <ToggleRow
              icon={Volume2}
              title="Aviso sonoro"
              description="Notificações internas do app"
              checked={soundEnabled}
              onChange={toggleSoundNotifications}
            />

            <ToggleRow
              icon={BellRing}
              title="Notificações do navegador"
              description={`${notificationStatusLabel}. Ative para receber avisos do sistema.`}
              checked={desktopNotificationsEnabled}
              onChange={toggleDesktopNotifications}
              disabled={!notificationsSupported || notificationPermission === 'denied'}
            />

            <div className="space-y-3 rounded-2xl bg-white p-4 dark:bg-navy-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-navy-900 dark:text-slate-200">
                    <MonitorSmartphone size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Não perturbe</p>
                    <p className="text-[10px] font-semibold text-slate-400">
                      Silencia sons por horário
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={dndEnabled}
                    onChange={() => setDndEnabled(!dndEnabled)}
                  />
                  <div className="h-6 w-10 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 dark:bg-slate-700" />
                  <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Das</p>
                  <input
                    type="time"
                    value={dndFrom}
                    onChange={(event) => setDndFrom(event.target.value)}
                    className="w-full rounded-xl bg-slate-50 p-2 text-xs font-bold dark:bg-navy-900"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Até</p>
                  <input
                    type="time"
                    value={dndTo}
                    onChange={(event) => setDndTo(event.target.value)}
                    className="w-full rounded-xl bg-slate-50 p-2 text-xs font-bold dark:bg-navy-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4 dark:bg-navy-950/40">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200">
              Conta e privacidade
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Idioma, disponibilidade e telefone
            </p>
          </div>

          <form onSubmit={onUpdatePreferences} className="mt-4 space-y-3">
            <div>
              <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Idioma</p>
              <select
                name="language"
                defaultValue={user.preferredLanguage || 'pt-BR'}
                className="w-full rounded-2xl border bg-white p-3 text-sm dark:border-slate-700 dark:bg-navy-800"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>

            <label className="flex items-center justify-between rounded-2xl bg-white p-4 dark:bg-navy-800">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Ocultar telefone</p>
                <p className="text-[9px] font-semibold text-slate-400">
                  Esconde seu número no app
                </p>
              </div>
              <input type="checkbox" name="hidePhone" defaultChecked={!!user.hidePhone} />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[9px] font-black uppercase text-slate-400">
                  Disponível das
                </p>
                <input
                  type="time"
                  name="availFrom"
                  defaultValue={user.availabilityFrom || '08:00'}
                  className="w-full rounded-xl bg-white p-2 text-xs font-bold dark:bg-navy-800"
                />
              </div>
              <div>
                <p className="mb-1 text-[9px] font-black uppercase text-slate-400">Até</p>
                <input
                  type="time"
                  name="availTo"
                  defaultValue={user.availabilityTo || '20:00'}
                  className="w-full rounded-xl bg-white p-2 text-xs font-bold dark:bg-navy-800"
                />
              </div>
            </div>

            <textarea
              name="availNote"
              defaultValue={user.availabilityNote || ''}
              placeholder="Observações de disponibilidade (opcional)"
              className="min-h-[80px] w-full rounded-2xl border bg-white p-3 text-sm dark:border-slate-700 dark:bg-navy-800"
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-navy-900 py-3 text-xs font-black uppercase text-white"
            >
              Salvar preferências
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AccountModal;
