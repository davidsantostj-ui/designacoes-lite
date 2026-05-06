import React from 'react';
import { CalendarPlus, Eye } from 'lucide-react';
import Toast from './Toast';

const AuthScreen = ({
  toasts = [],
  onCloseToast,
  loginState,
  setLoginState,
  isLoading,
  onLogin,
  onResetPassword,
  onRegister,
  onGuestLogin
}) => {
  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 animate-fade-in relative overflow-hidden text-slate-900 dark:text-slate-100">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          msg={t.msg}
          type={t.type}
          onClose={() => onCloseToast && onCloseToast(t.id)}
        />
      ))}
      <div className="panel-card relative z-10 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-sky-400 text-white shadow-xl">
            <CalendarPlus size={30} />
          </div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Minhas Designações
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2">
            Acesso Seguro
          </p>
        </div>

        {loginState === 'SIGNIN' && (
          <form className="space-y-4" onSubmit={onLogin}>
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              className="soft-input"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              className="soft-input text-center tracking-[0.2em] text-lg"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="soft-button-primary w-full justify-center"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setLoginState('RESET')}
              className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"
            >
              Recuperar senha
            </button>
            <button
              type="button"
              onClick={() => setLoginState('REGISTER')}
              className="w-full py-2 text-[10px] font-black text-navy-600 dark:text-blue-400 uppercase tracking-widest"
            >
              Novo cadastro
            </button>

            {onGuestLogin && (
              <>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white dark:bg-navy-800 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      ou
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGuestLogin}
                  disabled={isLoading}
                  className="soft-button-ghost w-full justify-center gap-2"
                >
                  <Eye size={15} />
                  Entrar como convidado
                </button>
              </>
            )}
          </form>
        )}

        {loginState === 'RESET' && (
          <form className="space-y-4" onSubmit={onResetPassword}>
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              className="soft-input"
              required
            />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Enviaremos um link para redefinir sua senha.
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="soft-button-primary w-full justify-center"
            >
              Enviar link
            </button>
            <button
              type="button"
              onClick={() => setLoginState('SIGNIN')}
              className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"
            >
              Voltar
            </button>
          </form>
        )}

        {loginState === 'REGISTER' && (
          <form className="space-y-3" onSubmit={onRegister}>
            <div className="flex gap-2">
              <input
                name="name"
                placeholder="Nome"
                className="soft-input flex-1"
                required
              />
              <input
                name="surname"
                placeholder="Sobrenome"
                className="soft-input flex-1"
                required
              />
            </div>
            <input
              name="phone"
              placeholder="WhatsApp"
              className="soft-input"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              className="soft-input"
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              className="soft-input text-center tracking-[0.2em]"
              required
            />
            <input
              name="password2"
              type="password"
              placeholder="Repetir senha"
              className="soft-input text-center tracking-[0.2em]"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="soft-button-primary w-full justify-center"
            >
              Solicitar Acesso
            </button>
            <button
              type="button"
              onClick={() => setLoginState('SIGNIN')}
              className="w-full py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"
            >
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
