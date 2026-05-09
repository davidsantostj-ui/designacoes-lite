import React, { useState } from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { apiProvider } from '../../services/apiProvider';

const AdminGuestTab = ({ data, addToast }) => {
  const [loading, setLoading] = useState(false);
  const guests = data.users?.filter(u => !u.approved) || [];

  const handleApprove = async (userId) => {
    setLoading(true);
    try {
      await apiProvider.updateUser(userId, { approved: true });
      addToast('Usuário aprovado!', 'success');
    } catch (e) {
      addToast('Erro ao aprovar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Usuários Pendentes
      </h2>
      
      <div className="space-y-2">
        {guests.length === 0 ? (
          <p className="text-gray-500">Nenhum usuário pendente</p>
        ) : (
          guests.map(guest => (
            <div key={guest.id} className="flex justify-between items-center p-3 bg-white border rounded">
              <div>
                <div className="font-medium">{guest.name}</div>
                <div className="text-sm text-gray-600">{guest.email}</div>
              </div>
              <button
                onClick={() => handleApprove(guest.id)}
                disabled={loading}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Aprovar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminGuestTab;