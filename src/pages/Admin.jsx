import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataStore';
import { ShieldAlert, ShieldCheck, Shield, UserPlus, CalendarPlus, FileSpreadsheet, AlertTriangle, Users, MessageSquare, CheckCircle2, Trash2, LayoutDashboard, BookOpen, MapPin, Link as LinkIcon, Plus, Eye, EyeOff, ChevronRight, ArrowLeft, X } from 'lucide-react';
import { parseCsv, normalizeCsvDate } from '../utils/csvUtils';
import { buildAssignmentWhatsAppLink } from '../utils/textUtils';
import { supabase } from '../lib/supabase';

// Toast interno — sem usar alert()
function AdminToast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-amber-500' };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-2xl animate-slide-up ${colors[type] || colors.info}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14}/></button>
    </div>
  );
}

export default function Admin() {
  // O estado inicial agora é o MENU de opções do Admin
  const [activeTab, setActiveTab] = useState('MENU');
  
  const { 
    assignments, users, notices, tips, fieldService, quickLinks, currentUser,
    createAssignment, reassignTask, deleteAssignment, 
    createUser, deleteUser, updateUserRole,
    createNotice, deleteNotice,
    createTip, deleteTip, toggleTipActive,
    createFieldService, deleteFieldService,
    createQuickLink, deleteQuickLink
  } = useData();

  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [reassignModal, setReassignModal] = useState(null); // { assignId }
  const [reassignUserId, setReassignUserId] = useState('');

  // CSV Import States
  const [csvPreview, setCsvPreview] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const { rows } = parseCsv(text);
      if (!rows || rows.length === 0) {
        showToast('Nenhum dado encontrado no CSV.', 'error');
        return;
      }

      // Map rows to a normalized preview structure
      const parsedRows = rows.map((row, index) => {
        const rawName = row.nome || row.principal || row.name || row.user || row.publicador || '';
        const rawTask = row.tarefa || row.designação || row.designacao || row.type || row.role || '';
        const rawDate = row.data || row.date || '';

        const name = rawName.trim();
        const task = rawTask.trim();
        const date = normalizeCsvDate(rawDate);

        // Find user by name (case-insensitive)
        const foundUser = users.find(u => u.name.trim().toLowerCase() === name.toLowerCase());
        
        // Check if assignment already exists
        const exists = assignments.some(a => 
          a.user_id === foundUser?.id && 
          a.type.toLowerCase() === task.toLowerCase() && 
          a.date === date
        );

        return {
          id: `csv-${index}-${Date.now()}`,
          name,
          task,
          date,
          userId: foundUser ? foundUser.id : null,
          exists,
          isValid: name !== '' && task !== '' && date !== ''
        };
      });

      setCsvPreview(parsedRows);
      showToast(`${parsedRows.length} linhas processadas do CSV.`);
      e.target.value = ''; // Reset file input
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleQuickCreateUser = async (name) => {
    if (!name) return;
    try {
      const defaultPin = Math.floor(1000 + Math.random() * 9000).toString(); // Random 4-digit PIN
      const email = `user_${Date.now()}@app.com`;
      const newUserObj = {
        name,
        email,
        role: 'user',
        pin: defaultPin
      };

      const { data: newUser, error } = await supabase.from('users').insert([newUserObj]).select();
      
      if (error) {
        showToast(`Erro ao criar usuário: ${error.message}`, 'error');
        return;
      }

      if (newUser && newUser[0]) {
        const createdUser = newUser[0];
        setCsvPreview(prev => prev.map(item => {
          if (item.name.toLowerCase() === name.toLowerCase()) {
            return {
              ...item,
              userId: createdUser.id
            };
          }
          return item;
        }));

        showToast(`"${name}" cadastrado com PIN ${defaultPin}!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Falha ao cadastrar publicador.', 'error');
    }
  };

  const handleConfirmCsvImport = async () => {
    const rowsToImport = csvPreview.filter(row => row.isValid && row.userId && !row.exists);
    
    if (rowsToImport.length === 0) {
      showToast('Nenhuma designação válida para importar.', 'warning');
      return;
    }

    try {
      const dbRows = rowsToImport.map(row => ({
        user_id: row.userId,
        type: row.task,
        date: row.date,
        status: 'pending'
      }));

      const { data, error } = await supabase.from('assignments').insert(dbRows).select();
      
      if (error) {
        showToast(`Erro ao salvar no banco: ${error.message}`, 'error');
        return;
      }

      showToast(`${rowsToImport.length} designações importadas com sucesso!`);
      setCsvPreview(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao importar designações.', 'error');
    }
  };

  const rejectedAssignments = assignments.filter(a => a.status === 'rejected');

  const handleReassign = (assignId) => {
    setReassignUserId('');
    setReassignModal({ assignId });
  };

  const confirmReassign = () => {
    if (reassignUserId && users.find(u => u.id === reassignUserId)) {
      reassignTask(reassignModal.assignId, reassignUserId);
      showToast('Designação reatribuída com sucesso!');
    } else {
      showToast('Selecione um usuário válido.', 'error');
    }
    setReassignModal(null);
  };

  const handleNewAssignment = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    createAssignment({
      user_id: data.get('userId'),
      type: data.get('type'),
      date: data.get('date'),
    });
    showToast('Designação criada com sucesso!');
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

  const handleNewUser = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    createUser({
      name: data.get('name'),
      email: data.get('email') || `user_${Date.now()}@app.com`,
      role: data.get('role'),
      pin: data.get('pin')
    });
    showToast('Usuário cadastrado com sucesso!');
    e.target.reset();
    setShowNewUserForm(false);
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
      <>
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
        {toast && <AdminToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // Encontra qual é o item ativo para mostrar no header
  const currentItem = menuItems.find(m => m.id === activeTab);

  return (
    <>
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
                        {/* BUG #2 FIX */}
                        {assign.date.split('-').reverse().join('/')}
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

            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full rounded-[24px] bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-700 p-5 flex items-center justify-center gap-3 text-sm font-black text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-95 transition-all"
            >
              <FileSpreadsheet size={20} /> Importar em Lote (CSV)
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".csv" 
              onChange={handleCsvUpload} 
              className="hidden" 
            />

            {/* Seção: Designações Recentes */}
            <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2 text-slate-800 dark:text-slate-100 pl-1">
                <CalendarPlus size={18} className="text-blue-500"/> Designações Recentes
              </h3>
              
              {assignments.length === 0 ? (
                <div className="text-center p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-400 font-bold">Nenhuma designação criada ainda.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {[...assignments]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 15) // últimos 15
                    .map(assign => {
                      const user = users.find(u => u.id === assign.user_id);
                      const formattedDate = assign.date.split('-').reverse().join('/');
                      
                      const statusStyles = {
                        confirmed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
                        rejected: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20',
                        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20'
                      };
                      
                      const statusLabels = {
                        confirmed: 'Confirmado',
                        rejected: 'Recusado',
                        pending: 'Pendente'
                      };

                      const handleWhatsAppSend = () => {
                        if (!user) return;
                        const waLink = buildAssignmentWhatsAppLink(
                          user.phone || '',
                          user.name,
                          assign.type,
                          assign.date
                        );
                        window.open(waLink, '_blank');
                      };

                      return (
                        <div key={assign.id} className="flex flex-col gap-2 p-4 rounded-[20px] bg-white/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 transition-all hover:bg-white/60 dark:hover:bg-slate-900/60">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  {formattedDate}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${statusStyles[assign.status] || 'bg-slate-100'}`}>
                                  {statusLabels[assign.status] || assign.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1.5 truncate">
                                {assign.type}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Designado: <span className="font-bold text-slate-700 dark:text-slate-300">{user?.name || 'Desconhecido'}</span>
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4 shrink-0">
                              <button
                                onClick={handleWhatsAppSend}
                                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors shadow-sm border border-emerald-100 dark:border-emerald-500/20"
                                title="Enviar Notificação por WhatsApp"
                              >
                                <MessageSquare size={16} className="text-emerald-500" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Deseja realmente excluir esta designação?')) {
                                    deleteAssignment(assign.id);
                                  }
                                }}
                                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-colors border border-red-100 dark:border-red-500/20"
                                title="Excluir Designação"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Usuários */}
        {activeTab === 'USERS' && (
          <div className="space-y-3">
            {!showNewUserForm ? (
              <button 
                onClick={() => setShowNewUserForm(true)} 
                className="w-full rounded-[24px] bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-200 dark:border-blue-800 p-4 flex items-center justify-center gap-2 text-sm font-black text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <UserPlus size={18} /> Cadastrar Novo Usuário
              </button>
            ) : (
              <div className="rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black flex items-center gap-2"><UserPlus size={16} className="text-blue-500"/> Novo Usuário</h3>
                  <button onClick={() => setShowNewUserForm(false)} className="text-slate-400 hover:text-slate-600">Fechar</button>
                </div>
                <form onSubmit={handleNewUser} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome Completo</label>
                    <input name="name" type="text" placeholder="Ex: João Silva" required className="soft-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">PIN de Acesso (4 dígitos)</label>
                      <input name="pin" type="text" pattern="[0-9]*" maxLength="6" placeholder="Ex: 1234" required className="soft-input font-mono text-center tracking-widest" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Permissão</label>
                      <select name="role" required className="soft-select">
                        <option value="user">Publicador</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full soft-button-primary justify-center py-4">
                    Salvar Usuário
                  </button>
                </form>
              </div>
            )}

            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 rounded-[20px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${u.role === 'admin' ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {u.role === 'admin'
                      ? <ShieldCheck size={18} className="text-amber-500" />
                      : <Shield size={18} className="text-slate-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{u.name}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                      {u.role === 'admin' ? '👑 Administrador' : 'Publicador'} • PIN: {u.pin || '****'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Só mostra o botão de promoção se o usuário logado é admin e o card não é o próprio usuário */}
                  {currentUser?.role === 'admin' && u.id !== currentUser?.id && (
                    <button
                      onClick={() => {
                        const newRole = u.role === 'admin' ? 'user' : 'admin';
                        const msg = newRole === 'admin' ? `Promover "${u.name}" a Administrador?` : `Rebaixar "${u.name}" a Publicador?`;
                        if (window.confirm(msg)) {
                          updateUserRole(u.id, newRole);
                          showToast(newRole === 'admin' ? `${u.name} agora é Admin 👑` : `${u.name} agora é Publicador`, 'info');
                        }
                      }}
                      title={u.role === 'admin' ? 'Remover acesso Admin' : 'Promover a Admin'}
                      className={`p-2 rounded-xl transition-all active:scale-90 ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30'
                          : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400'
                      }`}
                    >
                      <ShieldCheck size={18} />
                    </button>
                  )}
                  <button onClick={() => deleteUser(u.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
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
                showToast('Aviso publicado!');
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

    {/* Toast — substitui alert() */}
    {toast && <AdminToast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

    {/* Modal de Reatribuição — substitui prompt() */}
    {reassignModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-end justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl animate-slide-up">
          <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">Reatribuir Designação</h3>
          <p className="text-xs text-slate-500 font-medium mb-4">Selecione o novo responsável:</p>
          <select
            value={reassignUserId}
            onChange={e => setReassignUserId(e.target.value)}
            className="soft-select w-full mb-4"
          >
            <option value="">Selecione um usuário...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <div className="flex gap-3">
            <button onClick={() => setReassignModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
            <button onClick={confirmReassign} className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-black hover:bg-rose-700 transition-colors shadow-md shadow-rose-500/30">Confirmar</button>
          </div>
        </div>
      </div>
    )}

    {/* Modal de Prévia de Importação CSV */}
    {csvPreview && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-2xl animate-scale-up max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Prévia da Importação</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Valide e resolva membros não cadastrados antes de salvar.</p>
            </div>
            <button onClick={() => setCsvPreview(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {csvPreview.map((row) => {
              const hasUser = !!row.userId;
              return (
                <div 
                  key={row.id} 
                  className={`flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-[20px] border transition-all ${
                    row.exists 
                      ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20 opacity-80' 
                      : !hasUser 
                        ? 'bg-red-50/50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20' 
                        : 'bg-slate-50/50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {row.name || <i className="text-slate-400">Nome vazio</i>}
                      </span>
                      {row.exists && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Duplicada
                        </span>
                      )}
                      {!hasUser && row.name && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> Não Cadastrado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>📅 {row.date ? row.date.split('-').reverse().join('/') : <span className="text-red-500">Sem data</span>}</span>
                      <span>💼 {row.task || <span className="text-red-500">Sem tarefa</span>}</span>
                    </div>
                  </div>

                  <div className="mt-2 md:mt-0 flex justify-end">
                    {!hasUser && row.name ? (
                      <button 
                        onClick={() => handleQuickCreateUser(row.name)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl transition-all active:scale-95 border border-blue-200 dark:border-blue-800/50"
                      >
                        <UserPlus size={13} /> Cadastrar
                      </button>
                    ) : (
                      <button 
                        onClick={() => setCsvPreview(prev => prev.filter(r => r.id !== row.id))}
                        className="text-[11px] font-extrabold uppercase text-slate-400 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="text-xs text-slate-500 text-center md:text-left font-medium">
              Apenas itens válidos, não duplicados e com membros cadastrados serão importados.
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setCsvPreview(null)} 
                className="flex-1 md:flex-none px-6 py-3 text-sm font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmCsvImport}
                disabled={csvPreview.filter(row => row.isValid && row.userId && !row.exists).length === 0}
                className="flex-1 md:flex-none px-6 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={16} /> Importar {csvPreview.filter(row => row.isValid && row.userId && !row.exists).length} itens
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
