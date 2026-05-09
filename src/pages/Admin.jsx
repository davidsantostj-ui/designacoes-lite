import React, { useState } from 'react';
import { useData } from '../context/DataStore';
import { ShieldAlert, UserPlus, CalendarPlus, FileSpreadsheet, AlertTriangle, Users, MessageSquare, CheckCircle2, Trash2, LayoutDashboard, BookOpen, MapPin, Link as LinkIcon, Plus, Eye, EyeOff, ChevronRight, ArrowLeft } from 'lucide-react';

export default function Admin() {
  // O estado inicial agora é o MENU de opções do Admin
  const [activeTab, setActiveTab] = useState('MENU');
  
  const { 
    assignments, users, notices, tips, fieldService, quickLinks,
    createAssignment, reassignTask, deleteAssignment, 
    createUser, deleteUser, 
    createNotice, deleteNotice,
    createTip, deleteTip, toggleTipActive,
    createFieldService, deleteFieldService,
    createQuickLink, deleteQuickLink
  } = useData();

  const rejectedAssignments = assignments.filter(a => a.status === 'rejected');

  const handleReassign = (assignId) => {
    const newUserId = prompt("Digite o ID do novo usuário (ex: u1, u2, u3, u4):");
    if (newUserId && users.find(u => u.id === newUserId)) {
      reassignTask(assignId, newUserId);
      alert("Designação reatribuída com sucesso!");
    } else {
      alert("Ação cancelada ou usuário não encontrado.");
    }
  };

  const handleNewAssignment = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    createAssignment({
      user_id: data.get('userId'),
      type: data.get('type'),
      date: data.get('date'),
    });
    alert("Designação criada com sucesso!");
    e.target.reset();
  };

  const handleNewTip = (e) => {
    e.preventDefault();
    createTip({
      title: e.target.title.value,
      content: e.target.content.value,
      active: false
    });
    e.target.reset();
  };

  const handleNewFieldService = (e) => {
    e.preventDefault();
    createFieldService({
      dayOfWeek: e.target.dayOfWeek.value,
      time: e.target.time.value,
      type: e.target.type.value,
      location_or_link: e.target.location_or_link.value,
      conductor: e.target.conductor.value
    });
    e.target.reset();
  };

  const handleNewQuickLink = (e) => {
    e.preventDefault();
    createQuickLink({
      label: e.target.label.value,
      url: e.target.url.value,
      icon: e.target.icon.value,
      color: e.target.color.value
    });
    e.target.reset();
  };

  const menuItems = [
    { id: 'REJECTED', label: 'Pendências', desc: 'Designações recusadas', icon: AlertTriangle, count: rejectedAssignments.length, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    { id: 'ASSIGN', label: 'Designar', desc: 'Criar novas designações', icon: CalendarPlus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { id: 'USERS', label: 'Usuários', desc: 'Gerenciar membros', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { id: 'NOTICES', label: 'Avisos', desc: 'Mural de anúncios', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { id: 'CONTENT', label: 'Conteúdo', desc: 'Dicas, Campo e Links', icon: LayoutDashboard, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' }
  ];

  // Renderiza o menu principal em formato de grid de cards
  if (activeTab === 'MENU') {
    return (
      <div className="space-y-6 pb-20 animate-fade-in">
        <section>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Administração</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Selecione uma área para gerenciar.</p>
        </section>

        <div className="grid grid-cols-1 gap-3">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex items-center justify-between p-4 rounded-[24px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">{item.label}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.count > 0 && (
                  <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {item.count}
                  </span>
                )}
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Encontra qual é o item ativo para mostrar no header
  const currentItem = menuItems.find(m => m.id === activeTab);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Header Interno com Botão Voltar */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveTab('MENU')}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
            {currentItem?.label}
          </h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {currentItem?.desc}
          </p>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
        
        {/* Tab: Rejeitadas */}
        {activeTab === 'REJECTED' && (
          <div className="space-y-4">
            {rejectedAssignments.length === 0 ? (
              <div className="text-center p-8 rounded-[24px] border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Nenhuma pendência!<br/>Todos os irmãos confirmaram as designações.</p>
              </div>
            ) : (
              rejectedAssignments.map(assign => (
                <div key={assign.id} className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/20 border border-rose-300 dark:border-rose-800/50 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-red-600 animate-pulse"></div>
                  <div className="flex items-start justify-between pl-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300 bg-rose-200 dark:bg-rose-900/50 px-3 py-1.5 rounded-lg">
                        {new Date(assign.date).toLocaleDateString('pt-BR')}
                      </span>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white mt-3">{assign.type}</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 font-medium bg-white/50 dark:bg-slate-900/50 py-1 px-3 rounded-lg inline-block border border-rose-100 dark:border-rose-900/30">
                        Devolvida por: <b className="text-rose-600 dark:text-rose-400">{users.find(u => u.id === assign.user_id)?.name}</b>
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-rose-200/50 dark:border-rose-900/30 flex gap-3 pl-3">
                    <button onClick={() => handleReassign(assign.id)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black tracking-widest uppercase py-3.5 rounded-xl shadow-md shadow-rose-500/30 transition-all active:scale-95">
                      Reatribuir Agora
                    </button>
                    <button onClick={() => deleteAssignment(assign.id)} className="w-14 flex items-center justify-center bg-white dark:bg-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 rounded-xl transition-all active:scale-95">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Designar */}
        {activeTab === 'ASSIGN' && (
          <div className="space-y-4">
            <div className="rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-black mb-4 flex items-center gap-2"><CalendarPlus size={16} className="text-blue-500"/> Nova Designação Manual</h3>
              <form onSubmit={handleNewAssignment} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data</label>
                  <input name="date" type="date" required className="soft-input" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Usuário</label>
                  <select name="userId" required className="soft-select">
                    <option value="">Selecione um usuário...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Tarefa</label>
                  <input name="type" type="text" placeholder="Ex: Leitura, Microfone, Áudio" required className="soft-input" />
                </div>
                <button type="submit" className="w-full soft-button-primary justify-center py-4">
                  Salvar Designação
                </button>
              </form>
            </div>

            <button onClick={() => alert("Funcionalidade de importação CSV em construção.")} className="w-full rounded-[24px] bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700 p-5 flex items-center justify-center gap-3 text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <FileSpreadsheet size={20} /> Importar em Lote (CSV)
            </button>
          </div>
        )}

        {/* Tab: Usuários */}
        {activeTab === 'USERS' && (
          <div className="space-y-3">
            <button onClick={() => alert("Modal de novo usuário")} className="w-full rounded-[24px] bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-200 dark:border-blue-800 p-4 flex items-center justify-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
              <UserPlus size={18} /> Cadastrar Novo Usuário
            </button>
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 rounded-[20px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">{u.name}</p>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">{u.role} • {u.id}</p>
                </div>
                {u.id !== 'u1' && (
                  <button onClick={() => deleteUser(u.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab: Avisos */}
        {activeTab === 'NOTICES' && (
          <div className="space-y-4">
             <div className="rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h3 className="text-sm font-black mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-amber-500"/> Novo Aviso</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                createNotice({ title: e.target.title.value, content: e.target.content.value });
                alert("Aviso publicado!");
                e.target.reset();
              }} className="space-y-4">
                <input name="title" type="text" placeholder="Título do aviso" required className="soft-input" />
                <textarea name="content" placeholder="Conteúdo da mensagem..." required className="soft-textarea" />
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-black tracking-widest uppercase py-4 rounded-xl transition-colors shadow-lg shadow-amber-500/30">
                  Publicar Aviso
                </button>
              </form>
            </div>
            
            <div className="space-y-3">
              {notices.map(n => (
                <div key={n.id} className="p-4 rounded-[20px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{n.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1 pr-4">{n.content}</p>
                  </div>
                  <button onClick={() => deleteNotice(n.id)} className="text-red-500 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Conteúdo */}
        {activeTab === 'CONTENT' && (
          <div className="space-y-8">
            
            {/* Seção: Dicas Espirituais */}
            <div className="space-y-4">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-slate-100 pl-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                <BookOpen size={18} className="text-indigo-500"/> Dicas Espirituais
              </h3>
              
              <div className="rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <form onSubmit={handleNewTip} className="space-y-3">
                  <input name="title" type="text" placeholder="Título da Dica" required className="soft-input" />
                  <textarea name="content" placeholder="Conteúdo da dica..." required className="soft-input min-h-[80px]" />
                  <button type="submit" className="soft-button-primary w-full justify-center">
                    <Plus size={16} /> Adicionar Dica
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                {tips.map(tip => (
                  <div key={tip.id} className="flex flex-col gap-2 p-4 rounded-[20px] bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{tip.title}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{tip.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button 
                          onClick={() => toggleTipActive(tip.id)} 
                          className={`p-2 rounded-xl transition-colors ${tip.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                        >
                          {tip.active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => deleteTip(tip.id)} className="p-2 rounded-xl text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção: Serviço de Campo */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-slate-100 pl-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                <MapPin size={18} className="text-emerald-500"/> Serviço de Campo
              </h3>
              
              <div className="rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <form onSubmit={handleNewFieldService} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select name="dayOfWeek" required className="soft-select">
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                      <option value="Segunda">Segunda</option>
                      <option value="Terça">Terça</option>
                      <option value="Quarta">Quarta</option>
                      <option value="Quinta">Quinta</option>
                      <option value="Sexta">Sexta</option>
                    </select>
                    <input name="time" type="time" required className="soft-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select name="type" required className="soft-select">
                      <option value="Presencial">Presencial</option>
                      <option value="Zoom">Zoom</option>
                    </select>
                    <input name="conductor" type="text" placeholder="Dirigente" required className="soft-input" />
                  </div>
                  <input name="location_or_link" type="text" placeholder="Endereço ou Link do Zoom" required className="soft-input" />
                  <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black tracking-widest uppercase py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2">
                    <Plus size={16} /> Adicionar Campo
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                {fieldService.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-4 rounded-[20px] bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100">{f.dayOfWeek} às {f.time}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">{f.type} • {f.conductor}</p>
                    </div>
                    <button onClick={() => deleteFieldService(f.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção: Links Rápidos */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-slate-100 pl-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                <LinkIcon size={18} className="text-indigo-500"/> Links Rápidos
              </h3>
              
              <div className="rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <form onSubmit={handleNewQuickLink} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input name="label" type="text" placeholder="Nome do Link" required className="soft-input" />
                    <select name="icon" required className="soft-select text-sm">
                      <option value="Globe">Ícone: Globo</option>
                      <option value="FileBarChart">Ícone: Relatório</option>
                      <option value="BookOpen">Ícone: Livro</option>
                      <option value="Video">Ícone: Vídeo</option>
                      <option value="Link">Ícone: Corrente</option>
                      <option value="Download">Ícone: Download</option>
                      <option value="MapPin">Ícone: Local</option>
                    </select>
                  </div>
                  <input name="url" type="url" placeholder="URL (https://...)" required className="soft-input" />
                  <select name="color" required className="soft-select">
                    <option value="bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">Azul</option>
                    <option value="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">Verde</option>
                    <option value="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">Amarelo</option>
                    <option value="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">Índigo</option>
                    <option value="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">Vermelho</option>
                    <option value="bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">Cinza</option>
                  </select>
                  <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black tracking-widest uppercase py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/30 flex justify-center items-center gap-2">
                    <Plus size={16} /> Criar Link
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map(link => (
                  <div key={link.id} className="relative p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100 line-clamp-1 pr-6">{link.label}</p>
                    <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{link.url}</p>
                    <button onClick={() => deleteQuickLink(link.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
