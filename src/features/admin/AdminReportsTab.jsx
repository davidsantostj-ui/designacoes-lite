import React from 'react';

const AdminReportsTab = ({ assignmentReport, data, downloadCsv }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-xs font-black uppercase text-slate-400 px-1">Relatórios</h3>
      <div className="panel-card space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 mb-2">
            Designações por mês
          </p>
          {Object.keys(assignmentReport)
            .sort()
            .map((month) => (
              <div key={month} className="mb-3">
                <p className="text-xs font-bold text-slate-600">{month}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {Object.entries(assignmentReport[month]).map(([type, count]) => (
                    <div
                      key={`${month}-${type}`}
                      className="bg-slate-50 dark:bg-navy-900 p-2 rounded-xl text-[10px]"
                    >
                      <span className="font-bold">{type}</span> • {count}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          {Object.keys(assignmentReport).length === 0 && (
            <p className="text-[10px] text-slate-400">Sem dados.</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 pt-2">
          <button
            onClick={() => {
              const rows = [['id', 'data', 'usuario_id', 'tipo', 'status']].concat(
                data.assignments.map((a) => [
                  a.id,
                  a.date,
                  a.usuario_id,
                  a.tipo_designacao,
                  a.status
                ])
              );
              downloadCsv('designacoes.csv', rows);
            }}
            className="soft-button-primary w-full justify-center"
          >
            Exportar Designações (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsTab;
