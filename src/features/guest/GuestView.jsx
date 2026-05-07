import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  Eye,
  Flag,
  Globe,
  LogOut,
  Mail,
  Megaphone,
  Mic2,
  Phone,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  UserPlus,
  Video,
  Bell,
  BellOff,
  Wrench
} from 'lucide-react';
import { useGuestData } from '../../hooks/useGuestData';
import SkeletonBlock from '../../components/SkeletonBlock';
import { getEventMeta, getEventColors } from '../../utils/specialEventsUtils';


const ICON_MAP = {
  book: BookOpen,
  video: Video,
  mic: Mic2,
  sparkles: Sparkles,
  send: Send,
  globe: Globe,
  clipboard: ClipboardList,
  megaphone: Megaphone
};



const SECTION_META = {
  abertura: { key: 'abertura', label: 'Abertura', order: 1, accentClass: 'bg-sky-500', textClass: 'text-sky-900 dark:text-sky-200' },
  tesouros: { key: 'tesouros', label: 'Tesouros da Palavra de Deus', order: 2, accentClass: 'bg-orange-500', textClass: 'text-orange-900 dark:text-orange-200' },
  ministerio: { key: 'ministerio', label: 'Faça Seu Melhor no Ministério', order: 3, accentClass: 'bg-emerald-500', textClass: 'text-emerald-900 dark:text-emerald-200' },
  vida_crista: { key: 'vida_crista', label: 'Nossa Vida Cristã', order: 4, accentClass: 'bg-amber-500', textClass: 'text-amber-900 dark:text-amber-200' },
  encerramento: { key: 'encerramento', label: 'Encerramento', order: 5, accentClass: 'bg-slate-500', textClass: 'text-slate-800 dark:text-slate-200' },
  programa: { key: 'programa', label: 'Programa', order: 6, accentClass: 'bg-violet-500', textClass: 'text-violet-900 dark:text-violet-200' }
};

const SECTION_COLORS = {
  abertura: { bg: 'bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/30 dark:to-navy-900', border: 'border-sky-200 dark:border-sky-800', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300', accent: 'bg-sky-500' },
  tesouros: { bg: 'bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-navy-900', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300', accent: 'bg-orange-500' },
  ministerio: { bg: 'bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-navy-900', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', accent: 'bg-emerald-500' },
  vida_crista: { bg: 'bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-navy-900', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', accent: 'bg-amber-500' },
  encerramento: { bg: 'bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-navy-900', border: 'border-slate-200 dark:border-slate-700', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', accent: 'bg-slate-500' },
  programa: { bg: 'bg-gradient-to-r from-violet-50 to-white dark:from-violet-950/20 dark:to-navy-900', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', accent: 'bg-violet-500' },
  mecanicas: { bg: 'bg-gradient-to-r from-cyan-50 to-white dark:from-cyan-950/20 dark:to-navy-900', border: 'border-cyan-200 dark:border-cyan-800', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300', accent: 'bg-cyan-500' }
};

const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const isJewelsDesignation = (value) => normalizeText(value).includes('joias');

const isBibleStudyDesignation = (value) => normalizeText(value).includes('estudo biblico') || normalizeText(value).includes('estudo de congregacao');

const getCanonicalSectionKey = (entry) => {
  const designation = normalizeText(entry?.designation);
  if (isJewelsDesignation(designation)) return 'tesouros';
  const sectionKey = normalizeText(entry?.section_key);
  if (sectionKey && SECTION_META[sectionKey]) return sectionKey;
  const sectionLabel = normalizeText(entry?.section_label);
  if (sectionLabel.includes('abertura')) return 'abertura';
  if (sectionLabel.includes('tesouros')) return 'tesouros';
  if (sectionLabel.includes('ministerio')) return 'ministerio';
  if (sectionLabel.includes('vida crista')) return 'vida_crista';
  if (sectionLabel.includes('encerramento')) return 'encerramento';
  if (designation.includes('oracao final')) return 'encerramento';
  if (designation.includes('presidente') || designation.includes('oracao inicial')) return 'abertura';
  if (designation.includes('tesouros da palavra') || designation.includes('encontre joias') || designation.includes('leitura da biblia')) return 'tesouros';
  if (designation.includes('iniciando conversas') || designation.includes('cultivando o interesse') || designation.includes('faca revisitas') || designation.includes('explicando suas crencas')) return 'ministerio';
  if (designation.includes('vida crista') || isBibleStudyDesignation(designation)) return 'vida_crista';
  return 'programa';
};

const getCanonicalDesignation = (value, sectionKey) => {
  const raw = String(value || '').trim();
  const normalized = normalizeText(raw);
  if (normalized.includes('presidente')) return 'Presidente';
  if (normalized.includes('oracao inicial')) return 'Oracao Inicial';
  if (normalized.includes('oracao final')) return 'Oracao Final';
  if (isJewelsDesignation(normalized)) return 'Joias Espirituais';
  if (normalized.includes('tesouros da palavra') || normalized === 'tesouros' || (sectionKey === 'tesouros' && !isJewelsDesignation(normalized) && !normalized.includes('leitura da biblia'))) return 'Tesouros da Palavra - Discurso';
  if (normalized.includes('encontre joias')) return 'Encontre Joias';
  if (normalized.includes('leitura da biblia')) return 'Leitura da Biblia';
  if (normalized.includes('vida crista - parte 1') || normalized.includes('parte 1')) return 'Vida Crista - Parte 1';
  if (normalized.includes('vida crista - parte 2') || normalized.includes('parte 2')) return 'Vida Crista - Parte 2';
  if (isBibleStudyDesignation(normalized)) return 'Estudo Biblico de Congregacao';
  return raw || 'Designacao';
};

const getDesignationOrder = (entry, sectionKey) => {
  const designation = normalizeText(entry?.designation);
  if (sectionKey === 'tesouros' && isJewelsDesignation(designation)) return 2;
  const explicitOrder = Number(entry?.designation_order || 0);
  if (explicitOrder > 0) return explicitOrder;
  const importLine = Number(entry?.import_line || 999);
  if (sectionKey === 'abertura') {
    if (designation.includes('presidente')) return 1;
    if (designation.includes('oracao inicial')) return 2;
    return 20 + importLine;
  }
  if (sectionKey === 'tesouros') {
    if (isJewelsDesignation(designation) || designation.includes('encontre joias')) return 2;
    if (designation.includes('leitura da biblia')) return 3;
    return 1;
  }
  if (sectionKey === 'ministerio') return 100 + importLine;
  if (sectionKey === 'vida_crista') {
    if (designation.includes('parte 1')) return 1;
    if (designation.includes('parte 2')) return 2;
    if (isBibleStudyDesignation(designation)) return 90;
    return 10 + importLine;
  }
  if (sectionKey === 'encerramento') {
    if (designation.includes('oracao final')) return 1;
    return 20 + importLine;
  }
  return 1000 + importLine;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️ Bom dia, visitante!';
  if (hour < 18) return '🌤️ Boa tarde, visitante!';
  return '🌙 Boa noite, visitante!';
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

const formatDatePtGuest = (dateStr) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return `${weekday}, ${d}/${m}`;
  } catch {
    return dateStr;
  }
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
};

const getFriendlyTime = (ts) => {
  if (!ts) return '';
  try {
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthKey = (isoDate) => String(isoDate).slice(0, 7);

const parseIsoDate = (isoDate) => {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDayLabel = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return isoDate;
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase());
  const shortDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${weekday}, ${shortDate}`;
};

const isWeekendDay = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return false;
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0;
};

const isMidweekDay = (isoDate) => !isWeekendDay(isoDate);

const getWeekStartIso = (isoDate) => {
  const date = parseIsoDate(isoDate);
  if (!date) return '';
  const weekday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - weekday);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const buildGroupedMeetings = (meetingsData) => {
  const grouped = new Map();
  
  meetingsData.forEach((entry) => {
    if (!entry?.date || !entry?.designation || !entry?.participant_name) return;

    const rawSyncKey = entry.sync_key || [entry.date, normalizeText(entry.designation), Number(entry.import_line || 0)].join('|');

    const sectionKey = getCanonicalSectionKey(entry);
    const meta = SECTION_META[sectionKey] || SECTION_META.programa;
    const designation = getCanonicalDesignation(entry.designation, sectionKey);
    const syncKey = isBibleStudyDesignation(designation) || isBibleStudyDesignation(entry.designation) ? `${entry.date}|${sectionKey}|estudo-biblico` : rawSyncKey;
    const roleType = entry.role_type || 'principal';
    const roleOrder = Number(entry.role_order || (roleType === 'assistente_leitor' ? 2 : 1));

    const participant = {
      id: `${syncKey}:${roleType}:${normalizeText(entry.participant_name)}`,
      name: entry.participant_name,
      userId: entry.user_id || '',
      matchState: entry.match_state || '',
      roleType,
      roleOrder,
      importLine: Number(entry.import_line || 999)
    };

    const current = grouped.get(syncKey) || {
      id: syncKey,
      date: entry.date,
      monthKey: getMonthKey(entry.date),
      weekKey: getWeekStartIso(entry.date),
      sectionKey,
      sectionMeta: meta,
      designation,
      designationOrder: getDesignationOrder(entry, sectionKey),
      importLine: Number(entry.import_line || 999),
      participants: []
    };

    current.sectionKey = sectionKey;
    current.sectionMeta = meta;
    current.designation = designation;
    current.designationOrder = Math.min(current.designationOrder || 999, getDesignationOrder(entry, sectionKey));
    current.importLine = Math.min(current.importLine || 999, Number(entry.import_line || 999));
    current.participants.push(participant);
    grouped.set(syncKey, current);
  });

  return [...grouped.values()].map((group) => {
    const participants = [...group.participants].sort((a, b) => {
      const byRole = Number(a.roleOrder || 99) - Number(b.roleOrder || 99);
      if (byRole !== 0) return byRole;
      return Number(a.importLine || 999) - Number(b.importLine || 999);
    });

    const primary = participants.find((p) => p.roleType !== 'assistente_leitor') || participants[0] || null;
    const explicitSecondary = participants.find((p) => p.roleType === 'assistente_leitor') || null;
    const fallbackSecondary = !explicitSecondary && isBibleStudyDesignation(group.designation) && participants.length > 1 ? participants.find((p) => p.id !== primary?.id) : null;
    const secondary = explicitSecondary || fallbackSecondary;

    return {
      ...group,
      participants,
      primary,
      secondary,
      extras: participants.filter((p) => p.id !== primary?.id && p.id !== secondary?.id),
      isBibleStudy: isBibleStudyDesignation(group.designation)
    };
  }).sort((a, b) => {
    const byDate = String(a.date || '').localeCompare(String(b.date || ''));
    if (byDate !== 0) return byDate;
    const bySection = Number(a.sectionMeta?.order || 99) - Number(b.sectionMeta?.order || 99);
    if (bySection !== 0) return bySection;
    return Number(a.designationOrder || 999) - Number(b.designationOrder || 999);
  });
};


const groupByMonth = (items) => {
  const groups = {};
  items.forEach((item) => {
    if (!item.date) return;
    const monthKey = getMonthKey(item.date);
    if (!groups[monthKey]) groups[monthKey] = { key: monthKey, label: formatMonthLabel(monthKey), dates: {} };
    if (!groups[monthKey].dates[item.date]) groups[monthKey].dates[item.date] = [];
    groups[monthKey].dates[item.date].push(item);
  });
  Object.keys(groups).forEach((monthKey) => {
    Object.keys(groups[monthKey].dates).forEach((date) => {
      groups[monthKey].dates[date].sort((a, b) => {
        const bySec = Number(a.sectionMeta?.order || 99) - Number(b.sectionMeta?.order || 99);
        if (bySec !== 0) return bySec;
        return (a.designationOrder || 999) - (b.designationOrder || 999);
      });
    });
  });
  return groups;
};

const MeetingItemRow = ({ item }) => {
  const isBibleStudy = item.isBibleStudy;
  const isMinistry = item.sectionKey === 'ministerio';
  const hasHelper = isMinistry && item.secondary;
  const sectionColors = SECTION_COLORS[item.sectionKey] || SECTION_COLORS.programa;

  return (
    <div className={`flex items-start justify-between gap-2 rounded-2xl border ${sectionColors.bg} px-4 py-3 ${sectionColors.border}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${sectionColors.accent}`} />
          <p className={`text-[11px] font-black uppercase tracking-wider ${sectionColors.badge}`}>
            {item.designation}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        {isBibleStudy ? (
          <div className="space-y-1">
            {item.primary && (
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                <span className="text-[9px] font-black uppercase text-slate-400">Dirigente:</span> {item.primary.name}
              </p>
            )}
            {item.secondary && (
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-[9px] font-black uppercase text-amber-500">Leitor:</span> {item.secondary.name}
              </p>
            )}
          </div>
        ) : hasHelper ? (
          <div className="space-y-1">
            <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200">{item.primary.name}</p>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-[9px] font-black uppercase text-emerald-500">Ajudante:</span> {item.secondary.name}
            </p>
          </div>
        ) : item.primary ? (
          <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">{item.primary.name}</p>
        ) : null}
      </div>
    </div>
  );
};

const MechanicalItemRow = ({ item }) => {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-white px-3 py-2.5 dark:border-cyan-800/50 dark:from-cyan-950/20 dark:to-navy-900">
      <div className="min-w-0 flex-1 flex items-center gap-2">
        <Wrench size={14} className="text-cyan-500 shrink-0" />
        <p className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">{item.designation}</p>
      </div>
      <p className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">{item.participantName}</p>
    </div>
  );
};

const MeetingDayCard = ({ date, items, mechanicalItems, isExpanded, onToggle }) => {
  const type = isMidweekDay(date) ? 'midweek' : 'weekend';
  const label = type === 'midweek' ? 'Meio de Semana' : 'Fim de Semana';
  const days = getDaysUntil(date);
  const sections = {};
  items.forEach((item) => {
    const key = item.sectionMeta?.label || 'Programa';
    if (!sections[key]) sections[key] = [];
    sections[key].push(item);
  });

  const typeColors = type === 'midweek' 
    ? { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-900/20' }
    : { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20' };

  const hasMechanical = mechanicalItems && mechanicalItems.length > 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-lg backdrop-blur-sm dark:border-slate-700/50 dark:bg-navy-800/90">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-all duration-300 hover:bg-slate-50/80 dark:hover:bg-navy-700/50 ${isExpanded ? typeColors.light : ''}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md bg-gradient-to-r ${typeColors.bg}`}>
              <Calendar size={12} />
              {label}
            </span>
            {days !== null && days >= 0 && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${days === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : days === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {days === 0 ? '🔴 Hoje' : days === 1 ? '⏰ Amanhã' : `${days} dias`}
              </span>
            )}
            {hasMechanical && (
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300">
                🔧 {mechanicalItems.length}
              </span>
            )}
          </div>
          <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            {formatDayLabel(date)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {items.length} {items.length === 1 ? 'parte' : 'partes'} programadas
          </p>
        </div>
        <div className={`shrink-0 p-2 rounded-2xl transition-all duration-300 ${isExpanded ? `${typeColors.light} ${typeColors.text}` : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-slate-100/50 dark:border-slate-700/50 px-4 py-4 space-y-4 bg-gradient-to-b from-white to-slate-50/50 dark:from-navy-800/50 dark:to-navy-900/30">
          {Object.entries(sections).map(([sectionLabel, sectionItems]) => {
            const sectionMeta = Object.values(SECTION_META).find((s) => s.label === sectionLabel);
            const sectionColorsInner = SECTION_COLORS[sectionMeta?.key] || SECTION_COLORS.programa;
            return (
              <div key={sectionLabel}>
                <div className="flex items-center gap-2 mb-3">
                  {sectionMeta && <div className={`h-3 w-3 rounded-full ${sectionColorsInner.accent}`} />}
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 bg-slate-100/50 px-2 py-1 rounded-full dark:bg-slate-800/50">
                    {sectionLabel}
                  </p>
                </div>
                <div className="space-y-2">
                  {sectionItems.map((item, idx) => (
                    <MeetingItemRow key={`${item.id || idx}`} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
          {hasMechanical && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-cyan-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 px-2 py-1 rounded-full dark:bg-cyan-900/30">
                  Designações Mecânicas
                </p>
              </div>
              <div className="space-y-2">
                {mechanicalItems.map((item, idx) => (
                  <MechanicalItemRow key={`${item.id || idx}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SpecialEventCard = ({ event }) => {
  const meta = getEventMeta(event.typeId);
  const colors = getEventColors(meta.color);
  const days = getDaysUntil(event.date);

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${colors.bg} ${colors.border} p-4 shadow-md`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30`}>
              <Flag size={16} className={colors.text} />
            </div>
            <p className={`text-sm font-black uppercase ${colors.text}`}>{meta.label}</p>
          </div>
          {days !== null && days >= 0 && (
            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${days === 0 ? 'bg-red-500 text-white' : days === 1 ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
              {days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days}d`}
            </span>
          )}
        </div>
        {event.labelOverrides && (
          <p className={`mt-2 text-sm font-bold ${colors.text}`}>{event.labelOverrides}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Calendar size={12} className={colors.text} />
          <p className={`text-xs font-bold ${colors.text}`}>
            {formatDatePtGuest(event.date)}
          </p>
        </div>
      </div>
    </div>
  );
};

const GuestView = ({ onLogout, onRegister }) => {
  const { guestConfig, meetings, talks, announcements, specialEvents, isLoading, error, lastFetchedAt, refresh } = useGuestData();

  // contactInfo lido de guestConfig.contactInfo (eliminando a coleção congregation_info)
  const contactInfo = guestConfig?.contactInfo || null;

  const greeting = useMemo(() => getGreeting(), []);
  const links = guestConfig?.links || {};
  const activities = guestConfig?.activities || [];

  // Assignments são bloqueados por isApproved() nas Firestore Rules para usuários
  // anônimos — usamos apenas os dados já embutidos na coleção meetings (via import).
  const mergedMeetingsData = useMemo(() => meetings || [], [meetings]);

  // Designações mecânicas não estão disponíveis para convidados anônimos
  const mechanicalAssignments = useMemo(() => [], []);

  const groupedMeetings = useMemo(() => buildGroupedMeetings(mergedMeetingsData), [mergedMeetingsData]);
  const meetingsByMonth = useMemo(() => groupByMonth(groupedMeetings), [groupedMeetings]);

  const availableMonths = useMemo(() => Object.keys(meetingsByMonth).sort(), [meetingsByMonth]);
  const currentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  const [selectedMonth, setSelectedMonth] = useState('');
  useEffect(() => {
    if (availableMonths.includes(currentMonthKey)) {
      setSelectedMonth(currentMonthKey);
    } else if (availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, currentMonthKey]);

  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [expandedDays, setExpandedDays] = useState({});

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return localStorage.getItem('guest_notifications') === 'true';
    }
    return false;
  });

  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      localStorage.setItem('guest_notifications', 'true');
    }
  }, []);

  const disableNotifications = useCallback(() => {
    setNotificationsEnabled(false);
    localStorage.setItem('guest_notifications', 'false');
  }, []);

  const nextTalk = useMemo(() => {
    if (!talks.length) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().slice(0, 10);
    return talks.find((t) => t.date >= todayStr) || talks[0];
  }, [talks]);

  const upcomingEvents = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return specialEvents.filter((e) => e.date >= todayStr).slice(0, 10);
  }, [specialEvents]);

  const quickLinks = useMemo(() => [
    { id: 'report', label: 'Enviar Relatório', icon: Send, url: links.report, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { id: 'meeting', label: 'Link Reunião', icon: Video, url: links.meeting, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'preaching', label: 'Link Pregação', icon: Mic2, url: links.preaching, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { id: 'jw', label: 'JW Library', icon: Globe, url: links.jw || 'https://www.jw.org', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-900/20' }
  ], [links]);

  const handleShareTalk = useCallback((talk) => {
    if (!talk) return;
    const daysUntil = getDaysUntil(talk.date);
    const message = encodeURIComponent(
      `🗓️ *Convite para o Discurso Público*\n\n` +
      `📅 *Data:* ${formatDatePtGuest(talk.date)}\n\n` +
      `📖 *Tema:* ${talk.talkTheme || talk.theme || 'Tema a definir'}\n\n` +
      `🎤 *Orador:* ${talk.speakerName || talk.speaker || 'A definir'}${talk.speakerCongregation ? ` (${talk.speakerCongregation})` : ''}\n\n` +
      `${daysUntil !== null && daysUntil >= 0 ? `${daysUntil === 0 ? '🔴 É hoje!' : daysUntil === 1 ? '⏰ Amanhã!' : `⏰ Faltam ${daysUntil} dias`}\n` : ''}` +
      `\nParticipe! 💒`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refresh(true);
    } catch (err) {
      console.error('Refresh error:', err);
    }
  }, [refresh]);

  if (isLoading && !meetings.length) {
    return (
      <div className="h-full overflow-y-auto bg-transparent flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-4">
          <SkeletonBlock className="h-32 w-full rounded-3xl" />
          <SkeletonBlock className="h-48 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-28 rounded-3xl" />
            <SkeletonBlock className="h-28 rounded-3xl" />
            <SkeletonBlock className="h-28 rounded-3xl" />
            <SkeletonBlock className="h-28 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const hasContent = guestConfig || mergedMeetingsData.length > 0 || talks.length > 0 || announcements.length > 0 || specialEvents.length > 0;

  return (
    <div className="h-full overflow-y-auto bg-transparent text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-2xl space-y-4 p-4 pb-12 sm:p-6 sm:pb-12 animate-fade-in">
        
        {/* Header */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-6 text-white shadow-2xl">
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{greeting}</h1>
                <p className="text-indigo-200 text-xs font-medium mt-1">Bem-vindo ao app da congregação</p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30 hover:scale-105 active:scale-95 shadow-lg"
                title="Atualizar dados"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-md border border-white/10">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Eye size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Modo Convidado</p>
                <p className="text-xs font-medium text-white/90">Acesso somente para visualização</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRegister}
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[11px] font-black uppercase tracking-widest text-indigo-700 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
              >
                <UserPlus size={14} />
                Criar cadastro
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 rounded-2xl bg-white/20 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:-translate-y-0.5 active:scale-95 border border-white/10"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Atividades Espirituais */}
        {activities.length > 0 && (
          <section className="panel-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/30">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sugestões</p>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Atividades Espirituais</h2>
              </div>
            </div>
            <div className="space-y-2">
              {activities.map((activity, idx) => {
                const IconComp = ICON_MAP[activity.icon] || BookOpen;
                return (
                  <div
                    key={`act-${idx}`}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-navy-900/60 dark:hover:bg-navy-900"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/40">
                      <IconComp size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{activity.title}</p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-300">{activity.description}</p>
                      {activity.link && (
                        <a
                          href={activity.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-700 dark:text-violet-400"
                        >
                          <ExternalLink size={10} />
                          Abrir
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Links Rápidos */}
        <section className="panel-card space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Links rápidos</p>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => {
              const hasUrl = Boolean(link.url);
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => { if (hasUrl) window.open(link.url, '_blank', 'noopener'); }}
                  disabled={!hasUrl}
                  className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 shadow-sm transition-all ${
                    hasUrl
                      ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-95 border-slate-100 dark:border-slate-700'
                      : 'cursor-not-allowed opacity-40 border-slate-100 dark:border-slate-800'
                  } ${link.bg}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${link.gradient} text-white shadow-lg`}>
                    <link.icon size={22} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{link.label}</p>
                  {!hasUrl && <p className="text-[9px] font-bold text-slate-400">Não configurado</p>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Discurso Público */}
        {nextTalk && (
          <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-navy-800 dark:to-navy-900">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600" />
            <div className="pl-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {formatDatePtGuest(nextTalk.date)}
                  </span>
                  {getDaysUntil(nextTalk.date) !== null && getDaysUntil(nextTalk.date) >= 0 && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {getDaysUntil(nextTalk.date) === 0 ? '🔴 Hoje!' : getDaysUntil(nextTalk.date) === 1 ? '⏰ Amanhã' : `⏰ Em ${getDaysUntil(nextTalk.date)} dias`}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleShareTalk(nextTalk)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-md transition-all hover:bg-emerald-600 hover:scale-105 active:scale-95"
                >
                  <Share2 size={12} />
                  Convidar
                </button>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Próximo Discurso Público</p>
                <h3 className="mt-1 text-xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  {nextTalk.talkNumber ? `Nº ${nextTalk.talkNumber} — ` : ''}
                  {nextTalk.talkTheme || nextTalk.theme || 'Tema a definir'}
                </h3>
              </div>
              <div className="flex flex-col gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {(nextTalk.speakerName || nextTalk.speaker) && (
                  <span>🎤 Orador: {nextTalk.speakerName || nextTalk.speaker}{nextTalk.speakerCongregation ? ` (${nextTalk.speakerCongregation})` : ''}</span>
                )}
                {(nextTalk.chairmanName || nextTalk.chairman) && (
                  <span>🪪 Presidente: {nextTalk.chairmanName || nextTalk.chairman}</span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Contato */}
        {contactInfo && (
          <section className="panel-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Contato</p>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Fale com a Congregação</h2>
              </div>
            </div>
            <div className="space-y-2 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 dark:border-cyan-800/40 dark:bg-cyan-900/10">
              {contactInfo.phone && (
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                  <Phone size={14} />
                  {contactInfo.phone}
                </a>
              )}
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                  <Mail size={14} />
                  {contactInfo.email}
                </a>
              )}
              {contactInfo.address && (
                <p className="text-[12px] text-cyan-600 dark:text-cyan-300">{contactInfo.address}</p>
              )}
              {!contactInfo.phone && !contactInfo.email && !contactInfo.address && (
                <p className="text-[12px] text-slate-500">Informações de contato não disponíveis.</p>
              )}
            </div>
          </section>
        )}

        {/* Calendário */}
        {upcomingEvents.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-rose-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Calendário</h2>
              {typeof window !== 'undefined' && 'Notification' in window && (
                notificationsEnabled ? (
                  <button type="button" onClick={disableNotifications} className="ml-auto flex items-center gap-1 text-[10px] font-black text-emerald-600">
                    <Bell size={12} />
                    Ativado
                  </button>
                ) : (
                  <button type="button" onClick={requestNotifications} className="ml-auto flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-indigo-600">
                    <BellOff size={12} />
                    Ativar alertas
                  </button>
                )
              )}
            </div>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <SpecialEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Programação das Reuniões */}
        {availableMonths.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">Programação das Reuniões</h2>
            </div>
            {availableMonths.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {availableMonths.map((monthKey) => (
                  <button
                    key={monthKey}
                    type="button"
                    onClick={() => setSelectedMonth(monthKey)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
                      selectedMonth === monthKey
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {formatMonthLabel(monthKey)}
                  </button>
                ))}
              </div>
            )}
            {selectedMonth && meetingsByMonth[selectedMonth] && (
              <div className="space-y-3">
                {Object.entries(meetingsByMonth[selectedMonth].dates)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, items]) => {
                    const dayMechanicalItems = mechanicalAssignments.filter(m => m.date === date);
                    const weekKey = getWeekStartIso(date);
                    const isWeekExpanded = expandedWeeks[weekKey];
                    const isDayExpanded = expandedDays[date];
                    return (
                      <div key={date}>
                        {!isWeekExpanded ? (
                          <button
                            type="button"
                            onClick={() => setExpandedWeeks((prev) => ({ ...prev, [weekKey]: true }))}
                            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-navy-800"
                          >
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase text-emerald-600">{formatDatePtGuest(date)}</p>
                              <p className="mt-0.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                                {items.length} partes programadas
                                {dayMechanicalItems.length > 0 && ` + ${dayMechanicalItems.length} mecânicas`}
                              </p>
                            </div>
                            <ChevronDown size={18} className="text-slate-400" />
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setExpandedWeeks((prev) => ({ ...prev, [weekKey]: false }))}
                              className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-900/20"
                            >
                              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">Recolher</span>
                              <ChevronUp size={16} className="text-emerald-600" />
                            </button>
                            <MeetingDayCard 
                              date={date} 
                              items={items} 
                              mechanicalItems={dayMechanicalItems}
                              isExpanded={isDayExpanded !== false} 
                              onToggle={() => setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }))} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </section>
        )}

        {/* Avisos */}
        {announcements.length > 0 && (
          <section className="panel-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
                <Megaphone size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Congregação</p>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Avisos Importantes</h2>
              </div>
            </div>
            <div className="space-y-2">
              {announcements.map((ann) => (
                <div key={ann.id} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/10">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{ann.title || 'Aviso'}</p>
                    {ann.message && <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-300">{ann.message}</p>}
                    {ann.created_at && <p className="mt-1 text-[10px] text-slate-400">{getFriendlyTime(ann.created_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!hasContent && !error && (
          <section className="panel-card text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 dark:bg-navy-900">
              <ClipboardList size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Nenhum conteúdo disponível</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">O administrador ainda não cadastrou reuniões ou avisos.</p>
          </section>
        )}

        <footer className="mt-8 text-center py-4">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} {guestConfig?.congregation_name || 'Minhas Designações'}
          </p>
          {lastFetchedAt && (
            <p className="mt-1 text-[10px] text-slate-300 dark:text-slate-600">
              Dados de {lastFetchedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </footer>

      </div>
    </div>
  );
};

export default GuestView;