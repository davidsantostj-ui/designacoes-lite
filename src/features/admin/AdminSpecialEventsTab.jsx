import React, { useMemo, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { apiProvider } from '../../services/apiProvider';
import { EVENT_TYPES, MEETING_CANCELLATION_RULES } from '../../utils/specialEventsUtils';

const AdminSpecialEventsTab = ({ data, formatDatePt, addToast, confirm, loadSections }) => {
  const [loading, setLoading] = useState(false);
  const events = data.specialEvents || [];

  const [form, setForm] = useState({
    date: '',
    typeId: EVENT_TYPES[0].id,
    cancellationRule: MEETING_CANCELLATION_RULES[0].id,
    labelOverrides: ''
  });

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

  const handleSave = async () => {
    if (!form.date) return;
    setLoading(true);
    try {
      await apiProvider.createSpecialEvent(form);
      addToast('Evento criado com sucesso!', 'success');
      resetForm();
      if (loadSections) loadSections(['specialEvents']);
    } catch (e) {
      addToast('Erro ao criar evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({ title: 'Excluir', message: 'Tem certeza?' });
    if (!confirmed) return;
    setLoading(true);
    try {
      await apiProvider.deleteSpecialEvent(id);
      addToast('Evento excluído', 'success');
      if (loadSections) loadSections(['specialEvents']);
    } catch (e) {
      addToast('Erro ao excluir', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5" />
        Eventos Especiais
      </h2>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid gap-3">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="p-2 border rounded"
          />
          <select
            value={form.typeId}
            onChange={(e) => setForm({ ...form, typeId: e.target.value })}
            className="p-2 border rounded"
          >
            {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedEvents.map(event => (
          <div key={event.id} className="flex justify-between items-center p-3 bg-white border rounded">
            <div>
              <div className="font-medium">{formatDatePt(event.date)}</div>
              <div className="text-sm text-gray-600">{EVENT_TYPES.find(t => t.id === event.typeId)?.label}</div>
            </div>
            <button
              onClick={() => handleDelete(event.id)}
              className="text-red-600 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSpecialEventsTab;