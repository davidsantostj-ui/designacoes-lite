const CSV_TEMPLATE = [
  'uid;nome;tarefa;data;status',
  ';Nome Sobrenome;Microfone 1;10/02/2026;Pendente',
  ';Nome Sobrenome;Microfone 2;10/02/2026;Pendente',
  ';Nome Sobrenome;Presidente Meio de Semana;12/02/2026;Pendente'
].join('\n');

const MECHANICAL_ASSIGNMENTS_CSV_TEMPLATE = [
  'uid;nome;tarefa;data;status',
  ';Nome Sobrenome;Microfone 1;10/02/2026;Pendente',
  ';Nome Sobrenome;Microfone 2;10/02/2026;Pendente',
  ';Nome Sobrenome;Indicador Entrada;10/02/2026;Pendente',
  ';Nome Sobrenome;Indicador Auditório;10/02/2026;Pendente',
  ';Nome Sobrenome;Sistema de Áudio;10/02/2026;Pendente',
  ';Nome Sobrenome;Sistema de Vídeo;10/02/2026;Pendente'
].join('\n');

const MEETINGS_CSV_TEMPLATE = [
  'Data;Seção;Ordem;Designação;Principal;Ajudante_Leitor',
  '25/03/2026;Abertura;1;Presidente;Daniel Silva;',
  '25/03/2026;Abertura;2;Oração Inicial;Ronaldo Silva;',
  '25/03/2026;Tesouros da Palavra de Deus;1;Tesouros da Palavra de Deus - Discurso;Adijai Silva;',
  '25/03/2026;Tesouros da Palavra de Deus;2;Encontre Joias;Ronaldo Silva;',
  '25/03/2026;Tesouros da Palavra de Deus;3;Leitura da Bíblia;Andre Santana;',
  '25/03/2026;Faça Seu Melhor no Ministério;1;Iniciando Conversas;Katia Maria;Sandra Silva',
  '25/03/2026;Faça Seu Melhor no Ministério;2;Cultivando o Interesse (4 min);Renata Adriana;Marina Gomes',
  '25/03/2026;Nossa Vida Cristã;1;Nossa Vida Cristã - Parte 1;David Santos;',
  '25/03/2026;Nossa Vida Cristã;3;Estudo Bíblico de Congregação;Ronaldo Adriano;Paulo Henrique',
  '25/03/2026;Encerramento;1;Oração Final;Nivaldo Souto;'
].join('\n');

const splitCsvLine = (line, delimiter) => {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
};

const getLineDelimiter = (line, fallbackDelimiter) => {
  const alternateDelimiter = fallbackDelimiter === ';' ? ',' : ';';
  const fallbackCells = splitCsvLine(line, fallbackDelimiter);
  if (fallbackCells.length > 1) return fallbackDelimiter;

  const alternateCells = splitCsvLine(line, alternateDelimiter);
  if (alternateCells.length > fallbackCells.length) return alternateDelimiter;

  return fallbackDelimiter;
};

const parseCsv = (text) => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };
  const first = lines[0];
  const delimiter = first.includes(';') && !first.includes(',') ? ';' : ',';
  const headers = splitCsvLine(first, delimiter).map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/^\uFEFF/, '')
  );
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, getLineDelimiter(line, delimiter));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] || '').trim();
    });
    return row;
  });
  return { headers, rows };
};

const normalizeCsvDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('/');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('/');
    return `${y}-${m}-${d}`;
  }
  return '';
};

export {
  CSV_TEMPLATE,
  MECHANICAL_ASSIGNMENTS_CSV_TEMPLATE,
  MEETINGS_CSV_TEMPLATE,
  splitCsvLine,
  parseCsv,
  normalizeCsvDate
};
