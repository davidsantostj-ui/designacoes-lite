import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Globe,
  Link2,
  Mail,
  MapPin,
  Mic2,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Video
} from 'lucide-react';
import { supabase } from '../../services/supabase';

const MAX_ACTIVITIES = 10;

const ICON_OPTIONS = [
  { value: 'book', label: 'Livro', Icon: BookOpen },
  { value: 'video', label: 'Video', Icon: Video },
  { value: 'mic', label: 'Microfone', Icon: Mic2 },
  { value: 'sparkles', label: 'Estrela', Icon: Sparkles },
  { value: 'globe', label: 'Globo', Icon: Globe },
  { value: 'send', label: 'Enviar', Icon: Send }
];

const EMPTY_CONFIG = {
  activities: [],
  links: { report: '', meeting: '', preaching: '', jw: 'https://www.jw.org' },
  contactInfo: { phone: '', email: '', address: '' }
};

const AdminGuestTab = ({ addToast }) => {
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('guest_config')
        .select('*')
        .eq('id', 'main')
        .single();
      
      if (data && !error) {
        setConfig({
          activities: data.activities || [],
          links: { ...EMPTY_CONFIG.links, ...(data.links || {}) },
          contactInfo: { ...EMPTY_CONFIG.contactInfo, ...(data.contactInfo || {}) }
        });
      }
    } catch (err) {
      addToast('Erro ao carregar configuracao do convidado.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: 'main',
        ...config,
        activities: (config.activities || []).slice(0, MAX_ACTIVITIES),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('guest_config')
        .upsert(payload, { onConflict: 'id' });
      
      if (error) throw error;
      
      addToast('Configuracao do convidado salva!', 'success');
    } catch (err) {
      addToast('Erro ao salvar configuracao.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handlers de atividades ──
  const addActivity = () => {
    if (config.activities.length >= MAX_ACTIVITIES) return;
    setConfig((prev) => ({
      ...prev,
      activities: [...prev.activities, { title: '', description: '', link: '', icon: 'book' }]
    }));
  };

  const updateActivity = (idx, field, value) => {
    setConfig((prev) => ({
      ...prev,
      activities: prev.activities.map((act, i) => (i === idx ? { ...act, [field]: value } : act))
    }));
  };

  const removeActivity = (idx) => {
    setConfig((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== idx)
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-48 animate-pulse rounded-2xl bg-slate-200 dark:bg-navy-700" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-navy-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── HEADER + SALVAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Modo Convidado
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Configure links e sugestoes de atividades espirituais.
            <br />
            Reuniões, discursos, avisos e datas especiais sao carregados automaticamente do app.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadConfig} className="soft-button-secondary gap-2">
            <RefreshCw size={14} />
            Recarregar
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="soft-button-primary gap-2">
            <Save size={14} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* ── INFO ── */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
          ℹ️ Os dados de <strong>reuniões</strong>, <strong>discursos</strong>, <strong>avisos</strong> e <strong>datas especiais</strong> sao
          exibidos automaticamente na tela do convidado a partir dos cadastros ja existentes no app.
          Aqui voce configura apenas o que eh exclusivo da tela de convidado.
        </p>
      </div>

      {/* ── ATIVIDADES ESPIRITUAIS ── */}
      <section className="panel-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-600" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Sugestoes de Atividades Espirituais
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {config.activities.length}/{MAX_ACTIVITIES}
          </span>
        </div>

        <div className="space-y-3">
          {config.activities.map((activity, idx) => (
            <div
              key={`act-${idx}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-navy-900 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Titulo (ex: Leitura da Semana)"
                    value={activity.title}
                    onChange={(e) => updateActivity(idx, 'title', e.target.value)}
                    className="soft-input text-sm"
                  />
                  <textarea
                    placeholder="Descricao (ex: Exodo 12-14 — Preparacao para reuniao)"
                    value={activity.description}
                    onChange={(e) => updateActivity(idx, 'description', e.target.value)}
                    rows={2}
                    className="soft-input text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Link (opcional)"
                      value={activity.link}
                      onChange={(e) => updateActivity(idx, 'link', e.target.value)}
                      className="soft-input text-sm flex-1"
                    />
                    <select
                      value={activity.icon}
                      onChange={(e) => updateActivity(idx, 'icon', e.target.value)}
                      className="soft-input text-sm w-28"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeActivity(idx)}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addActivity}
          disabled={config.activities.length >= MAX_ACTIVITIES}
          className="soft-button-ghost gap-2 w-full justify-center"
        >
          <Plus size={14} />
          Adicionar atividade
        </button>
      </section>

      {/* ── LINKS RAPIDOS ── */}
      <section className="panel-card space-y-3">
        <div className="flex items-center gap-2">
          <Link2 size={16} className="text-blue-600" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            Links Rapidos
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'report', label: 'Enviar Relatorio', icon: Send },
            { key: 'meeting', label: 'Link Reuniao', icon: Video },
            { key: 'preaching', label: 'Link Pregacao', icon: Mic2 },
            { key: 'jw', label: 'JW Library', icon: Globe }
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <item.icon size={12} />
                {item.label}
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={config.links[item.key] || ''}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    links: { ...prev.links, [item.key]: e.target.value }
                  }))
                }
                className="soft-input text-sm"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── INFORMACOES DE CONTATO ── */}
      <section className="panel-card space-y-3">
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-cyan-600" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Informacoes de Contato</h3>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Exibido na tela do convidado na secao "Fale com a Congregacao".
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Phone size={12} /> Telefone
            </label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={config.contactInfo?.phone || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))}
              className="soft-input text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <Mail size={12} /> E-mail
            </label>
            <input
              type="email"
              placeholder="congregacao@exemplo.com"
              value={config.contactInfo?.email || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))}
              className="soft-input text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <MapPin size={12} /> Endereco do Salao
            </label>
            <input
              type="text"
              placeholder="Rua Exemplo, 123 — Cidade, UF"
              value={config.contactInfo?.address || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, address: e.target.value } }))}
              className="soft-input text-sm"
            />
          </div>
        </div>
      </section>

    </div>
  );
};

export default AdminGuestTab;
