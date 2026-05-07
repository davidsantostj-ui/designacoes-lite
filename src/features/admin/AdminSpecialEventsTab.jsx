import React, { useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc } from 'firebase/firestore';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { db } from '../../services/firebase';
import { EVENT_TYPES, MEETING_CANCELLATION_RULES } from '../../utils/specialEventsUtils';

// Fix #2: substituídos alert() e window.confirm() por addToast e confirm do sistema
// Fix #10: .sort() movido para useMemo (não muta array original, não roda todo re-render)
// Fix #17: loadSections após save/delete para atualizar lista em tempo real
const AdminSpecialEventsTab = ({ data, formatDatePt, addToast, confirm, loadSections }) => {
  const [loading, setLoading] = useState(false);
  const events = data.specialEvents || [];

  const [form, setForm] = useState({
    date: '',
    typeId: EVENT_TYPES[0].id,
    cancellationRule: MEETING_CANCELLATION_RULES[0].id,
    labelOverrides: ''
  });

  // Fix #10: sort em useMemo — não muta o array original e só recalcula quando events muda
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events]
  );

  const resetForm = () =>
    setForm({
      date: '',
      typeId: EVENT_TYPES[0].id,
      cancellationRule: MEETING_CANCELLATION_RULES[0].id,
      labelOverrides: ''
    });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.date) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'specialEvents'), {
        date: form.date,
        typeId: form.typeId,
        cancellationRule: form.cancellationRule,
        labelOverrides: form.labelOverrides.trim(),
        createdAt: new Date().toISOString()
      });
      resetForm();
      // Fix #17: atualizar lista em tempo real sem precisar recarregar a página
      if (loadSections) await loadSections(['specialEvents'], { silent: true });
      // Fix #2: toast em vez de alert() nativo
      if (addToast) addToast('Evento especial adicionado!', 'success');
    } catch (err) {
      if (addToast) addToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Fix #2: ConfirmModal do sistema em vez de window.confirm()
    const confirmed = confirm
      ? await new Promise((resolve) => {
          confirm({
            title: 'Apagar evento especial',
            message: 'Tem certeza que quer apagar essa data? Esta ação não pode ser desfeita.',
            confirmText: 'Apagar',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
          });
        })
      : window.confirm('Tem certeza que quer apagar esse evento especial?');

    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'specialEvents', id));
      // Fix #17: atualizar lista em tempo real
      if (loadSections) await loadSections(['specialEvents'], { silent: true });
      if (addToast) addToast('Evento especial removido.', 'success');
    } catch (err) {
      if (addToast) addToast('Erro ao apagar: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="panel-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarDays size={18} className="text-slate-400" />
          <h3 className="text-sm font-black uppercase text-slate-700 dark:text-slate-200">
            Cadastrar Data Especial
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Data</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="soft-input w-full"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-500">Tipo de Evento</span>
            <select
              value={form.typeId}
              onChange={(e) => setForm({ ...form, typeId: e.target.value })}
              className="soft-select w-full"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-500">Ação para as Reuniões</span>
          <select
            value={form.cancellationRule}
            onChange={(e) => setForm({ ...form, cancellationRule: e.target.value })}
            className="soft-select w-full font-bold text-rose-600"
          >
            {MEETING_CANCELLATION_RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-slate-400">
            Define automaticamente se as reuniões dessa semana aparecerão na agenda do app.
          </p>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold text-slate-500">Informação (Opcional)</span>
          <input
            type="text"
            placeholder="Ex: Assembleia c/ Superintendente de Circuito no Local X"
            value={form.labelOverrides}
            onChange={(e) => setForm({ ...form, labelOverrides: e.target.value })}
            className="soft-input w-full"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="soft-button-primary w-full justify-center"
        >
          <Plus size={16} /> {loading ? 'Salvando…' : 'Adicionar Evento Especial'}
        </button>
      </form>

      <section className="panel-card space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-400">Eventos Cadastrados</h3>
        <div className="space-y-2">
          {sortedEvents.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400 text-center py-4 bg-slate-50 rounded-xl dark:bg-navy-900">
              Nenhuma data especial cadastrada.
            </p>
          ) : (
            sortedEvents.map((evt) => {
              const typeObj = EVENT_TYPES.find((t) => t.id === evt.typeId) || EVENT_TYPES[0];
              return (
                <div
                  key={evt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 bg-white dark:bg-navy-900 dark:border-slate-800"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {formatDatePt(evt.date)}
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                      {typeObj.label}
                    </p>
                    {evt.labelOverrides && (
                      <p className="text-xs text-slate-500 mt-0.5">{evt.labelOverrides}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(evt.id)}
                    disabled={loading}
                    className="soft-button-danger flex-none w-auto shrink-0 justify-center h-10 px-3"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSpecialEventsTab;
