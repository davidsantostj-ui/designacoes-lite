import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataStore';
import { AlertTriangle, CheckCircle2, Clock, ThumbsUp, X, Loader2, Calendar } from 'lucide-react';
import { buildIcsContent } from '../utils/icsUtils';

// Toast interno leve
function Toast({ msg, type, onClose }) {
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500' };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-slide-up ${colors[type] || colors.info}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
}

export default function Schedule() {
  const { currentUser, assignments, updateAssignmentStatus } = useData();
  const [loadingId, setLoadingId] = useState(null); // UX #5: loading state no botão
  const [confirmModal, setConfirmModal] = useState(null); // FEAT #2: modal de ausência
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // PERF: useMemo evita sort a cada render
  const myAssignments = useMemo(() =>
    assignments
      .filter(a => a.user_id === currentUser?.id)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [assignments, currentUser?.id]
  );

  const pending = myAssignments.filter(a => a.status === 'pending').length;
  const upcoming = myAssignments.filter(a => a.status !== 'rejected');

  // FEAT #2: Confirmar presença
  const handleConfirm = async (id) => {
    setLoadingId(id);
    await updateAssignmentStatus(id, 'confirmed');
    setLoadingId(null);
    showToast('Designação confirmada! ✅');
  };

  // FEAT #2: Informar ausência (sem alert/confirm — usa modal interno)
  const handleReportAbsence = async () => {
    if (!confirmModal) return;
    setLoadingId(confirmModal);
    await updateAssignmentStatus(confirmModal, 'rejected');
    setLoadingId(null);
    setConfirmModal(null);
    showToast('Ausência informada. O admin foi notificado.', 'warning');
  };

  // FEAT: Exportar designação para calendário (.ics)
  const handleExportIcs = (assign) => {
    try {
      const formattedDate = assign.date.split('-').reverse().join('/');
      const icsString = buildIcsContent({
        title: `Designação: ${assign.type}`,
        dateStr: assign.date,
        description: `Você foi designado para a tarefa de "${assign.type}" na reunião do dia ${formattedDate}.`
      });
      
      const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `designacao-${assign.date}-${assign.type.toLowerCase().replace(/\s+/g, '-')}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Calendário exportado! 📅');
    } catch (err) {
      console.error('Erro ao exportar calendário:', err);
      showToast('Erro ao exportar calendário', 'error');
    }
  };

  // Cor e texto do badge de status
  const statusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmada', cls: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30', icon: <CheckCircle2 size={12} strokeWidth={3}/> };
      case 'rejected':
        return { label: 'Devolvida', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30', icon: <AlertTriangle size={12} strokeWidth={3}/> };
      default:
        return { label: 'Pendente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30', icon: <Clock size={12} strokeWidth={3}/> };
    }
  };

  const barColor = (status) => {
    if (status === 'confirmed') return 'bg-gradient-to-b from-emerald-400 to-teal-500';
    if (status === 'rejected') return 'bg-gradient-to-b from-red-400 to-rose-600';
    return 'bg-gradient-to-b from-amber-400 to-orange-500';
  };

  return (
    <>
      <div className="space-y-6 pb-20">
        <section className="animate-slide-up">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Sua Agenda</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Visualize e gerencie seus compromissos.
          </p>
        </section>

        {/* Resumo rápido — UX nova */}
        {myAssignments.length > 0 && (
          <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '40ms' }}>
            <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-800 dark:text-white">{myAssignments.length}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Total</p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{pending}</p>
              <p className="text-[10px] uppercase font-bold text-amber-500 tracking-wider mt-0.5">Pendentes</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 p-3 text-center shadow-sm">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {myAssignments.filter(a => a.status === 'confirmed').length}
              </p>
              <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider mt-0.5">Confirmadas</p>
            </div>
          </div>
        )}

        {/* Lista de designações */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h3 className="text-xs font-black tracking-[0.2em] uppercase text-slate-400 mb-2 flex items-center gap-2 px-1">
            <Clock size={16} /> Próximas Tarefas
          </h3>

          {myAssignments.length === 0 ? (
            <div className="text-center p-10 rounded-[28px] border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-sm text-slate-400 font-bold">Sua agenda está livre no momento.</p>
              <p className="text-xs text-slate-400 mt-1">O administrador irá adicionar suas designações em breve.</p>
            </div>
          ) : (
            myAssignments.map(assign => {
              const badge = statusBadge(assign.status);
              const isLoading = loadingId === assign.id;
              const isPending = assign.status === 'pending';
              const isRejected = assign.status === 'rejected';

              return (
                <div
                  key={assign.id}
                  className={`relative overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/50 border shadow-sm p-5 transition-all ${
                    isRejected ? 'border-red-200 dark:border-red-900/30 opacity-75' :
                    isPending ? 'border-amber-200 dark:border-amber-900/30' :
                    'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Barra lateral de status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor(assign.status)}`} />

                  <div className="flex items-start justify-between pl-2">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                        isRejected ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                        isPending ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      }`}>
                        {assign.date.split('-').reverse().join('/')}
                      </span>
                      <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-2">{assign.type}</h4>
                    </div>

                    {/* Badge de status */}
                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${badge.cls}`}>
                      {badge.icon} {badge.label}
                    </span>
                  </div>

                  {/* FEAT #2: Botões de ação por status */}
                  {!isRejected && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 pl-2 flex gap-2">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleConfirm(assign.id)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[11px] font-black tracking-wide uppercase py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-500/25"
                          >
                            {isLoading ? <Loader2 size={14} className="animate-spin"/> : <ThumbsUp size={14}/>}
                            Confirmar
                          </button>
                          
                          <button
                            onClick={() => handleExportIcs(assign)}
                            className="w-12 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200/50 dark:border-indigo-500/30 rounded-xl transition-all active:scale-95"
                            title="Exportar para Calendário"
                          >
                            <Calendar size={14} strokeWidth={2.5}/>
                          </button>

                          <button
                            onClick={() => setConfirmModal(assign.id)}
                            disabled={isLoading}
                            className="w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95 disabled:opacity-60"
                            title="Informar Ausência"
                          >
                            {isLoading ? <Loader2 size={14} className="animate-spin"/> : <AlertTriangle size={14} strokeWidth={2.5}/>}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleExportIcs(assign)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-[11px] font-black tracking-wide uppercase py-3 rounded-xl transition-all active:scale-95"
                          >
                            <Calendar size={14} strokeWidth={2.5}/>
                            Adicionar à Agenda
                          </button>

                          <button
                            onClick={() => setConfirmModal(assign.id)}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-black tracking-wide uppercase py-3 rounded-xl transition-all active:scale-95 disabled:opacity-60 text-rose-500 hover:text-white hover:bg-rose-500 px-4 border border-rose-200 dark:border-rose-500/30"
                          >
                            {isLoading ? <Loader2 size={14} className="animate-spin"/> : <AlertTriangle size={14} strokeWidth={2.5}/>}
                            Informar Ausência
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal de confirmação de ausência — substitui window.confirm() */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-end justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-4">
              <AlertTriangle size={22} className="text-rose-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">Informar Ausência?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-5">
              Esta designação será devolvida ao administrador para reatribuição.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReportAbsence}
                disabled={loadingId === confirmModal}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/30 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loadingId === confirmModal ? <Loader2 size={16} className="animate-spin"/> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
