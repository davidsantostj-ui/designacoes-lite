import { escapeHtml } from './textUtils';

const buildShell = ({ title, subtitle, contentHtml, helper = '' }) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --text: #0f172a;
        --muted: #64748b;
        --line: #dbe3f0;
        --surface: #ffffff;
        --panel: #f8fafc;
        --accent: #2563eb;
        --accent-soft: #eff6ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        font-family: Manrope, Arial, sans-serif;
        color: var(--text);
        background: #f4f7fb;
      }
      .sheet {
        max-width: 900px;
        margin: 0 auto;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 28px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 6px;
        font-size: 30px;
        line-height: 1.05;
      }
      .subtitle {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }
      .helper {
        margin-top: 10px;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .section {
        margin-top: 26px;
        border: 1px solid var(--line);
        border-radius: 22px;
        overflow: hidden;
      }
      .section-header {
        padding: 14px 18px;
        background: var(--panel);
        border-bottom: 1px solid var(--line);
      }
      .section-title {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .section-body {
        padding: 10px 18px 16px;
      }
      .row {
        display: grid;
        gap: 16px;
        grid-template-columns: 130px minmax(0, 1fr) 160px;
        padding: 14px 0;
        border-bottom: 1px solid var(--line);
      }
      .row:last-child { border-bottom: 0; }
      .date {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .title {
        font-size: 16px;
        font-weight: 800;
        line-height: 1.35;
      }
      .meta {
        font-size: 12px;
        color: var(--muted);
        line-height: 1.5;
      }
      .status {
        justify-self: end;
        align-self: start;
        display: inline-flex;
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--panel);
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .pill {
        display: inline-flex;
        margin-top: 8px;
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--panel);
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .two-col {
        display: grid;
        gap: 18px;
      }
      .group-title {
        margin: 0 0 12px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .empty {
        padding: 20px;
        border-radius: 18px;
        background: var(--panel);
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
        text-align: center;
      }
      @media print {
        body {
          padding: 0;
          background: white;
        }
        .sheet {
          max-width: none;
          border: 0;
          border-radius: 0;
          padding: 0;
          box-shadow: none;
        }
      }
      @media (max-width: 720px) {
        body { padding: 16px; }
        .sheet { padding: 18px; border-radius: 20px; }
        .row { grid-template-columns: 1fr; }
        .status { justify-self: start; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <span class="eyebrow">Exportação</span>
      <h1>${escapeHtml(title)}</h1>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      ${helper ? `<p class="helper">${escapeHtml(helper)}</p>` : ''}
      ${contentHtml}
    </main>
  </body>
</html>`;

const openPrintWindow = ({ title, subtitle, contentHtml, helper = '' }) => {
  if (typeof window === 'undefined') return false;
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildShell({ title, subtitle, contentHtml, helper }));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => {
    printWindow.print();
  }, 250);
  return true;
};

const printAssignmentsAgenda = ({
  ownerName,
  filtersLabel = '',
  assignments,
  formatDatePt,
  formatAssignmentLabel,
  getUserDisplayName
}) => {
  const rowsHtml =
    assignments.length === 0
      ? '<div class="empty">Nenhuma designação encontrada para os filtros atuais.</div>'
      : assignments
          .map((assignment) => {
            const assignedUser = getUserDisplayName?.(assignment.assignedUser) || ownerName || '';
            return `
              <div class="row">
                <div class="date">${escapeHtml(formatDatePt?.(assignment.date) || assignment.date)}</div>
                <div>
                  <div class="title">${escapeHtml(
                    formatAssignmentLabel?.(assignment.tipo_designacao) || assignment.tipo_designacao
                  )}</div>
                  <div class="meta">${escapeHtml(assignedUser)}</div>
                  ${
                    assignment.source === 'meeting_import'
                      ? '<span class="pill">Vinda da programação de reuniões</span>'
                      : ''
                  }
                </div>
                <div class="status">${escapeHtml(assignment.status || 'pendente')}</div>
              </div>
            `;
          })
          .join('');

  return openPrintWindow({
    title: 'Minha Agenda',
    subtitle: ownerName
      ? `Agenda pessoal de ${ownerName}. Use a impressão do navegador para salvar em PDF.`
      : 'Agenda pessoal pronta para impressão.',
    helper: filtersLabel,
    contentHtml: `
      <section class="section">
        <div class="section-header">
          <p class="section-title">Designações</p>
        </div>
        <div class="section-body">${rowsHtml}</div>
      </section>
    `
  });
};

const printMeetingsWeek = ({ weekLabel, days }) => {
  const sectionsHtml =
    days.length === 0
      ? '<div class="empty">Nenhuma reunião encontrada para a semana selecionada.</div>'
      : days
          .map(
            (day) => `
              <section class="section">
                <div class="section-header">
                  <p class="section-title">${escapeHtml(day.label)}</p>
                </div>
                <div class="section-body two-col">
                  ${day.sections
                    .map(
                      (section) => `
                        <div>
                          <p class="group-title">${escapeHtml(section.label)}</p>
                          ${
                            section.items.length === 0
                              ? '<div class="empty">Sem itens nesta seção.</div>'
                              : section.items
                                  .map(
                                    (item) => `
                                      <div class="row">
                                        <div class="date">${escapeHtml(item.dateLabel || '')}</div>
                                        <div>
                                          <div class="title">${escapeHtml(item.designation)}</div>
                                          <div class="meta">${escapeHtml(item.participantsLabel)}</div>
                                        </div>
                                        <div class="status">${escapeHtml(section.shortLabel || 'Programa')}</div>
                                      </div>
                                    `
                                  )
                                  .join('')
                          }
                        </div>
                      `
                    )
                    .join('')}
                </div>
              </section>
            `
          )
          .join('');

  return openPrintWindow({
    title: 'Programação da Reunião',
    subtitle: 'Programa semanal pronto para impressão ou PDF.',
    helper: weekLabel,
    contentHtml: sectionsHtml
  });
};

const printTalksMonth = ({ monthLabel, talks, formatDatePt }) => {
  const rowsHtml =
    talks.length === 0
      ? '<div class="empty">Nenhum discurso encontrado para o mês selecionado.</div>'
      : talks
          .map(
            (talk) => `
              <div class="row">
                <div class="date">${escapeHtml(formatDatePt?.(talk.date) || talk.date)}</div>
                <div>
                  <div class="title">${escapeHtml(talk.talkTheme || 'Discurso')}</div>
                  <div class="meta">
                    ${escapeHtml(talk.speakerName || 'Sem orador')}
                    ${talk.speakerCongregation ? ` • ${escapeHtml(talk.speakerCongregation)}` : ''}
                  </div>
                  <div class="meta">
                    Cântico ${escapeHtml(talk.songNumber || '-')} • ${escapeHtml(talk.songTheme || '-')}
                  </div>
                  <div class="meta">
                    Presidente: ${escapeHtml(talk.chairmanName || '-')} • Leitor A Sentinela: ${escapeHtml(
                      talk.readerName || '-'
                    )}
                  </div>
                </div>
                <div class="status">${escapeHtml(talk.chairmanStatus || 'programado')}</div>
              </div>
            `
          )
          .join('');

  return openPrintWindow({
    title: 'Programação de Discursos',
    subtitle: 'Planejamento do fim de semana pronto para impressão ou PDF.',
    helper: monthLabel,
    contentHtml: `
      <section class="section">
        <div class="section-header">
          <p class="section-title">Discursos do mês</p>
        </div>
        <div class="section-body">${rowsHtml}</div>
      </section>
    `
  });
};

export { openPrintWindow, printAssignmentsAgenda, printMeetingsWeek, printTalksMonth };
