const assert = require('assert');
const {
  getMeetingSyncMetaForAssignmentType,
  isMeetingSyncableAssignmentType,
  buildMeetingSyncKeyForAssignmentType,
  getMeetingAgendaAssignmentType,
  getMeetingSectionMetaFromValue,
  getMeetingDesignationOrder,
  buildImportedAssignmentKey,
  sortMeetingPreviewRows
} = require('../../../src/utils/meetingImportUtils.cjs');

describe('meetingImportUtils', () => {
  it('maps bible study helper to Leitor Estudo Bíblico', () => {
    const type = getMeetingAgendaAssignmentType({
      designation: 'Estudo Bíblico de Congregação',
      roleType: 'assistente_leitor'
    });

    assert.strictEqual(type, 'Leitor Estudo Bíblico');
  });

  it('maps single-speaker ministry parts up to 5 minutes to Discurso 5 Min.', () => {
    const type = getMeetingAgendaAssignmentType({
      designation: 'Cultivando o Interesse (5 min.)',
      roleType: 'principal',
      sectionKey: 'ministerio',
      hasAssistant: false
    });

    assert.strictEqual(type, 'Discurso 5 Min.');
  });

  it('does not map ministry parts with helper to Discurso 5 Min.', () => {
    const type = getMeetingAgendaAssignmentType({
      designation: 'Iniciando Conversas (4 min.)',
      roleType: 'principal',
      sectionKey: 'ministerio',
      hasAssistant: true
    });

    assert.strictEqual(type, 'Iniciando Conversas (4 min.)');
  });

  it('forces Joias Espirituais into Tesouros section', () => {
    const section = getMeetingSectionMetaFromValue('Programa', 'Joias Espirituais');

    assert.deepStrictEqual(section, {
      key: 'tesouros',
      label: 'Tesouros da Palavra de Deus',
      order: 2
    });
  });

  it('orders Joias before Leitura da Bíblia in Tesouros', () => {
    const joiasOrder = getMeetingDesignationOrder('Joias Espirituais', 'tesouros', 20);
    const leituraOrder = getMeetingDesignationOrder('Leitura da Bíblia', 'tesouros', 10);

    assert.strictEqual(joiasOrder, 2);
    assert.strictEqual(leituraOrder, 3);
    assert.ok(joiasOrder < leituraOrder);
  });

  it('normalizes imported assignment keys for duplicate checks', () => {
    const key = buildImportedAssignmentKey('user-1', '2026-03-25', 'Leitura da Bíblia');

    assert.strictEqual(key, 'user-1|2026-03-25|leitura da biblia');
  });

  it('sorts preview rows by date, section, order, line and role', () => {
    const rows = sortMeetingPreviewRows([
      {
        id: 'b',
        date: '2026-03-25',
        sectionOrder: 3,
        designationOrder: 101,
        line: 12,
        roleOrder: 2,
        participantName: 'Sandra Silva'
      },
      {
        id: 'a',
        date: '2026-03-25',
        sectionOrder: 2,
        designationOrder: 2,
        line: 9,
        roleOrder: 1,
        participantName: 'Ronaldo Silva'
      },
      {
        id: 'c',
        date: '2026-03-24',
        sectionOrder: 5,
        designationOrder: 1,
        line: 30,
        roleOrder: 1,
        participantName: 'Nivaldo Souto'
      }
    ]);

    assert.deepStrictEqual(
      rows.map((row) => row.id),
      ['c', 'a', 'b']
    );
  });

  it('builds sync metadata for midweek assignment types', () => {
    const meta = getMeetingSyncMetaForAssignmentType('Dirigente Estudo Bíblico');

    assert.deepStrictEqual(meta, {
      assignmentType: 'Dirigente Estudo Bíblico',
      designation: 'Estudo Bíblico de Congregação',
      sectionKey: 'vida_crista',
      sectionLabel: 'Nossa Vida Cristã',
      sectionOrder: 4,
      designationOrder: 90,
      roleType: 'principal',
      roleLabel: 'Dirigente Estudo Bíblico',
      roleOrder: 1
    });
  });

  it('marks only supported midweek assignment types as syncable', () => {
    assert.strictEqual(isMeetingSyncableAssignmentType('Presidente Meio de Semana'), true);
    assert.strictEqual(isMeetingSyncableAssignmentType('Microfone 1'), false);
  });

  it('reuses the same sync key for dirigente and leitor do estudo bíblico', () => {
    const dirigenteKey = buildMeetingSyncKeyForAssignmentType({
      date: '2026-03-25',
      type: 'Dirigente Estudo Bíblico'
    });
    const leitorKey = buildMeetingSyncKeyForAssignmentType({
      date: '2026-03-25',
      type: 'Leitor Estudo Bíblico'
    });

    assert.strictEqual(dirigenteKey, '2026-03-25|vida_crista|estudo-biblico');
    assert.strictEqual(leitorKey, dirigenteKey);
  });
});
