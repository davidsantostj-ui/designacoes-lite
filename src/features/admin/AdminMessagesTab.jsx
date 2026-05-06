import React from 'react';
import { Send } from 'lucide-react';

const AdminMessagesTab = ({ handleSendBroadcast }) => {
  return (
    <form
      className="panel-card space-y-4"
      onSubmit={handleSendBroadcast}
    >
      <h3 className="text-xs font-black uppercase text-slate-400">Comunicado oficial</h3>
      <textarea
        name="msg"
        placeholder="Texto que todos verão no histórico de notificações..."
        className="soft-textarea"
        required
      />
      <button
        type="submit"
        className="soft-button-primary w-full justify-center"
      >
        <Send size={16} /> Disparar agora
      </button>
    </form>
  );
};

export default AdminMessagesTab;
