import React from 'react';
import { Database, Upload, Sparkles } from 'lucide-react';

const AdminBackupTab = ({
  handleExportBackup,
  handleImportBackup,
  handleFixMojibake,
  isFixingMojibake,
  handleCleanupAssignments,
  handleCleanupNotifications,
  isCleaningAssignments,
  isCleaningNotifications,
  handleWipeAssignments,
  isWipingAssignments,
  cleanupMonthLabel
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-black uppercase text-slate-400 px-1">Backup e Restauração</h3>
      <div className="panel-card space-y-4">
        <button
          onClick={handleExportBackup}
          className="soft-button-primary w-full justify-center"
        >
          <Database size={14} /> Fazer Backup Completo
        </button>
        <label className="soft-button-secondary w-full cursor-pointer justify-center">
          <Upload size={14} /> Importar Backup (JSON)
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImportBackup(e.target.files?.[0])}
          />
        </label>
        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
          Isso pode sobrescrever dados existentes.
        </p>
      </div>

      <div className="panel-card space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Correção de Acentuação
        </h4>
        <button
          onClick={handleFixMojibake}
          disabled={isFixingMojibake}
          className="soft-button-primary w-full justify-center disabled:opacity-60"
        >
          <Sparkles size={14} />
          {isFixingMojibake ? 'Corrigindo...' : 'Corrigir Mojibake'}
        </button>
        <p className="text-[10px] text-slate-400 font-bold">
          Ajusta textos com caracteres quebrados (ç, ã). Atua nos dados carregados no app.
        </p>
      </div>

      <div className="panel-card space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Limpeza de Histórico
        </h4>
        <p className="text-[10px] text-slate-500 font-bold">
          Remove do banco tudo que for anterior a {cleanupMonthLabel}.
        </p>
        <button
          onClick={handleCleanupAssignments}
          disabled={isCleaningAssignments}
          className="soft-button-primary w-full justify-center disabled:opacity-60"
        >
          {isCleaningAssignments ? 'Limpando designações...' : 'Apagar designações antigas'}
        </button>
        <button
          onClick={handleCleanupNotifications}
          disabled={isCleaningNotifications}
          className="soft-button-danger w-full justify-center disabled:opacity-60"
        >
          {isCleaningNotifications ? 'Limpando notificações...' : 'Apagar notificações antigas'}
        </button>
        <button
          onClick={handleWipeAssignments}
          disabled={isWipingAssignments}
          className="soft-button-danger w-full justify-center disabled:opacity-60"
        >
          {isWipingAssignments ? 'Apagando todas...' : 'Apagar todas as designações'}
        </button>
        <p className="text-[10px] text-slate-400 font-bold">
          Esta ação é definitiva.
        </p>
      </div>
    </div>
  );
};

export default AdminBackupTab;
