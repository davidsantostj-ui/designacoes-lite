import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { 
  Shield, User, Clock, Calendar, FileText, LogOut, Briefcase, 
  CheckCircle, AlertCircle, Menu, Users, Home, Loader2, Bell, X, 
  CalendarCheck, Plus, Trash2, Send, MapPin, Map, Settings, 
  Bus, BookOpen, AlertTriangle, Video, ExternalLink, Link2, 
  KeyRound, Search, Mail, Megaphone, ChevronRight, ChevronLeft, DollarSign, MessageCircle, Phone
} from "lucide-react";

// --- GLOBAL STYLES & ANIMATIONS ---
const GLOBAL_STYLES = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background-color: #F0F2F5;
    overscroll-behavior-y: none; /* Prevent pull-to-refresh on mobile */
  }

  #root {
    height: 100%;
  }

  .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  .animate-slide-up { animation: slideUp 0.3s ease-out; }
  .animate-toast { animation: slideDown 0.3s ease-out; }
  
  input:focus, select:focus, textarea:focus {
    border-color: #1A237E !important;
    box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
  }

  /* Custom Scrollbar for inner content */
  .scroll-content::-webkit-scrollbar {
    width: 4px;
  }
  .scroll-content::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.2);
    border-radius: 4px;
  }
`;

// --- TYPES & MODELS ---

type UserRole = 'elder' | 'ministerialServant' | 'pioneer' | 'publisher';
type ExtraPrivilegeType = 'pioneer_regular' | 'pioneer_auxiliary' | 'field_overseer';

interface ExtraPrivilege {
  type: ExtraPrivilegeType;
  status: 'pending' | 'approved';
}

interface UserModel {
  uid: string;
  name: string;
  email?: string;
  phone: string; // Novo campo obrigatório
  role: UserRole;
  extraPrivileges: ExtraPrivilege[];
  status: 'approved' | 'pending';
  emergencyStatus?: 1 | 2 | 3;
  accessCode?: string;
}

interface ReportModel {
  month: string;
  hours: number;
  bibleStudies: number;
  remarks: string; 
}

interface AssignmentModel {
  id: string;
  date: string;
  partName: string; 
  assignee: string; 
  status: 'pending' | 'accepted' | 'declined';
  declineReason?: string;
}

interface NotificationModel {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

interface AgendaItem {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'study' | 'return_visit' | 'cart' | 'other';
}

interface EventModel {
  id: string;
  title: string;
  date: string;
  departureTime: string;
  price: number;
  seats: number;
  reservedUserIds: string[];
}

interface FieldServiceMeeting {
  id: string;
  dayDescription: string; // ex: "Sábado - 25/10"
  time: string;
  location: string;
  territories: string; // Lista de territórios em texto
}

// --- THEME ---

const COLORS = {
  primary: "#1A237E",
  primaryDark: "#000051",
  primaryLight: "#E8EAF6", 
  secondary: "#F3F4F6", 
  accent: "#00897B", 
  success: "#059669", 
  warning: "#D97706", 
  danger: "#DC2626", 
  text: "#111827", 
  textLight: "#6B7280", 
  white: "#FFFFFF",
  cardShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  inputBorder: "#D1D5DB"
};

// Container responsivo para Mobile/Desktop
const CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: "500px", // Limite para Desktop
  height: "100%",
  margin: "0 auto",
  backgroundColor: "#F9FAFB",
  position: "relative",
  boxShadow: "0 0 40px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden" // Impede scroll na janela principal
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", 
  padding: "14px", 
  borderRadius: "12px", 
  border: `1px solid ${COLORS.inputBorder}`, 
  backgroundColor: "#FFFFFF", 
  color: COLORS.text, 
  fontSize: "16px",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s"
};

const BUTTON_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  fontWeight: "600",
  fontSize: "16px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "opacity 0.2s"
};

const ROLE_LABELS: Record<UserRole, string> = {
  elder: "Ancião",
  ministerialServant: "Servo Ministerial",
  pioneer: "Pioneiro Regular",
  publisher: "Publicador"
};

const EXTRA_PRIVILEGE_LABELS: Record<ExtraPrivilegeType, string> = {
  pioneer_regular: "Pioneiro Regular",
  pioneer_auxiliary: "Pioneiro Auxiliar",
  field_overseer: "Dirigente de Campo"
};

const ACTIVITY_TYPES = {
  study: "Estudo Bíblico",
  return_visit: "Revisita",
  cart: "Carrinho",
  other: "Outro"
};

// --- SERVICES & STORE ---

const ToastEvent = new EventTarget();
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  const event = new CustomEvent('toast', { detail: { message, type } });
  ToastEvent.dispatchEvent(event);
};

const formatPhone = (value: string) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, "");
  if (clean.length > 11) return value.slice(0, 15); // limit length
  let formatted = clean;
  if (clean.length >= 2) formatted = `(${clean.slice(0,2)}) ${clean.slice(2)}`;
  if (clean.length >= 7) formatted = `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
  return formatted;
};

// Config Service for Zoom Link
const ConfigService = {
  STORAGE_KEY: 'elojw_config',
  getZoomLink: () => localStorage.getItem('elojw_zoom_link') || 'https://zoom.us',
  setZoomLink: (link: string) => {
    localStorage.setItem('elojw_zoom_link', link);
    showToast("Link do Zoom atualizado!", "success");
  }
  ,
  // Emergency/help contact
  getHelpPhone: () => localStorage.getItem('elojw_help_phone') || '',
  setHelpPhone: (phone: string) => {
    localStorage.setItem('elojw_help_phone', phone);
  }
};

// Help/telemetry service
const HelpService = {
  STORAGE_KEY: 'elojw_help_logs',
  addLog: (entry: { phone: string; message: string; ts?: number }) => {
    try {
      const list = JSON.parse(localStorage.getItem(HelpService.STORAGE_KEY) || '[]');
      list.push({ ...entry, ts: entry.ts || Date.now() });
      localStorage.setItem(HelpService.STORAGE_KEY, JSON.stringify(list));
    } catch { /* noop */ }
  },
  getAll: (): Array<{ phone: string; message: string; ts: number }> => {
    try { return JSON.parse(localStorage.getItem(HelpService.STORAGE_KEY) || '[]'); } catch { return []; }
  }
};

const TerritoryService = {
  STORAGE_KEY: 'elojw_territory_meetings',
  getAll: (): FieldServiceMeeting[] => {
    try {
      return JSON.parse(localStorage.getItem(TerritoryService.STORAGE_KEY) || "[]");
    } catch { return []; }
  },
  add: (meeting: FieldServiceMeeting) => {
    const list = TerritoryService.getAll();
    list.push(meeting);
    localStorage.setItem(TerritoryService.STORAGE_KEY, JSON.stringify(list));
  },
  delete: (id: string) => {
    const list = TerritoryService.getAll().filter(i => i.id !== id);
    localStorage.setItem(TerritoryService.STORAGE_KEY, JSON.stringify(list));
  }
};

const EventService = {
  STORAGE_KEY: 'elojw_events',
  getAll: (): EventModel[] => {
    try {
      return JSON.parse(localStorage.getItem(EventService.STORAGE_KEY) || "[]");
    } catch { return []; }
  },
  add: (event: EventModel) => {
    const events = EventService.getAll();
    events.push(event);
    localStorage.setItem(EventService.STORAGE_KEY, JSON.stringify(events));
  },
  reserve: (eventId: string, userId: string, userName: string) => {
    const events = EventService.getAll();
    const updatedEvents = events.map(e => {
      if (e.id === eventId) {
        if (!e.reservedUserIds.includes(userId)) {
          e.reservedUserIds.push(userId);
          NotificationService.add({
             title: "Nova Reserva",
             message: `${userName} reservou lugar para ${e.title}.`,
             type: 'info'
          });
        }
      }
      return e;
    });
    localStorage.setItem(EventService.STORAGE_KEY, JSON.stringify(updatedEvents));
    return updatedEvents;
  }
};

const UserService = {
  STORAGE_KEY: 'elojw_users',
  init: () => {
    if (!localStorage.getItem(UserService.STORAGE_KEY)) {
      const initialUsers: UserModel[] = [
        { uid: 'admin1', name: 'Ancião Coordenador', email: 'admin@jw.org', phone: '(11) 99999-9999', role: 'elder', extraPrivileges: [], status: 'approved' },
        { uid: 'pub1', name: 'Irmã Maria', accessCode: '123456', phone: '(11) 98888-8888', role: 'publisher', extraPrivileges: [], status: 'approved' }
      ];
      localStorage.setItem(UserService.STORAGE_KEY, JSON.stringify(initialUsers));
    }
  },
  getAll: (): UserModel[] => {
    try {
      return JSON.parse(localStorage.getItem(UserService.STORAGE_KEY) || "[]");
    } catch { return []; }
  },
  add: (user: UserModel) => {
    const users = UserService.getAll();
    users.push(user);
    localStorage.setItem(UserService.STORAGE_KEY, JSON.stringify(users));
  },
  deleteAccount: (uid: string) => {
    const users = UserService.getAll().filter(u => u.uid !== uid);
    localStorage.setItem(UserService.STORAGE_KEY, JSON.stringify(users));
  },
  loginByCode: (code: string): UserModel | null => {
    return UserService.getAll().find(u => u.accessCode === code) || null;
  },
  loginByEmail: (email: string): UserModel | null => {
    return UserService.getAll().find(u => u.email === email) || null;
  }
};

const NotificationService = {
  STORAGE_KEY: 'elojw_notifications',
  getAll: (): NotificationModel[] => {
    try {
      return JSON.parse(localStorage.getItem(NotificationService.STORAGE_KEY) || "[]");
    } catch { return []; }
  },
  add: (notification: Omit<NotificationModel, 'id' | 'read' | 'date'>) => {
    const current = NotificationService.getAll();
    const newNotif: NotificationModel = {
      ...notification,
      id: Date.now().toString() + Math.random().toString().slice(2, 5),
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify([newNotif, ...current]));
    window.dispatchEvent(new Event('elojw_update_notifications'));
  },
  broadcast: (title: string, message: string) => {
    NotificationService.add({ title, message, type: 'info' });
  },
  markAsRead: (id: string) => {
    const current = NotificationService.getAll();
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(NotificationService.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('elojw_update_notifications'));
  },
  clearAll: () => {
    localStorage.removeItem(NotificationService.STORAGE_KEY);
    window.dispatchEvent(new Event('elojw_update_notifications'));
  },
  getUnreadCount: (): number => {
    return NotificationService.getAll().filter(n => !n.read).length;
  }
};

UserService.init();

// --- COMPONENTS ---

const ToastContainer = () => {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info', id: number } | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast({ message: e.detail.message, type: e.detail.type, id: Date.now() });
      setTimeout(() => setToast(null), 3500);
    };
    ToastEvent.addEventListener('toast', handleToast);
    return () => ToastEvent.removeEventListener('toast', handleToast);
  }, []);

  if (!toast) return null;

  return (
    <div className="animate-toast" style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      backgroundColor: toast.type === 'error' ? COLORS.danger : toast.type === 'success' ? COLORS.success : COLORS.text,
      color: 'white',
      padding: '12px 24px',
      borderRadius: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontWeight: '600',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '300px',
      justifyContent: 'center',
      maxWidth: '90%'
    }}>
      {toast.type === 'success' && <CheckCircle size={18} />}
      {toast.type === 'error' && <AlertCircle size={18} />}
      {toast.type === 'info' && <Bell size={18} />}
      {toast.message}
    </div>
  );
};

const AppLogo = ({ size = "medium", color = "white" }: { size?: "small" | "medium" | "large", color?: string }) => {
  const dim = size === "small" ? 24 : size === "medium" ? 48 : 64;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
       <div style={{ 
         width: dim, 
         height: dim, 
         backgroundColor: color === "white" ? "rgba(255,255,255,0.2)" : COLORS.primaryLight, 
         borderRadius: "12px", 
         display: "flex", 
         alignItems: "center", 
         justifyContent: "center",
       }}>
         <Link2 size={dim * 0.6} color={color === "white" ? "white" : COLORS.primary} strokeWidth={2.5} style={{ transform: "rotate(-45deg)" }} />
       </div>
       {size !== "small" && (
         <span style={{ 
           marginTop: "8px", 
           color: color, 
           fontWeight: "800", 
           fontSize: size === "large" ? "24px" : "18px",
           letterSpacing: "-0.5px"
         }}>
           Elo JW
         </span>
       )}
    </div>
  );
};

// Bottom Sheet / Modal Wrapper
// Fix: Make children optional to resolve TS errors
const BottomSheet = ({ title, children, onClose }: { title: string, children?: React.ReactNode, onClose: () => void }) => {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()} 
        className="animate-slide-up"
        style={{ 
          backgroundColor: "white", 
          width: "100%", 
          maxWidth: "500px", 
          borderTopLeftRadius: "24px", 
          borderTopRightRadius: "24px", 
          padding: "24px", 
          maxHeight: "85vh", 
          overflowY: "auto",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ width: "40px", height: "4px", backgroundColor: "#E5E7EB", borderRadius: "2px", margin: "0 auto 20px auto" }}></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: COLORS.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}><X size={24} color={COLORS.textLight} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const NotificationsSheet = ({ onClose }: { onClose: () => void }) => {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);

  useEffect(() => {
    setNotifications(NotificationService.getAll());
  }, []);

  const handleMarkRead = (id: string) => {
    NotificationService.markAsRead(id);
    setNotifications(NotificationService.getAll());
  };

  return (
    <BottomSheet title="Notificações" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: COLORS.textLight }}>
            <Bell size={48} style={{ opacity: 0.1, marginBottom: "16px", margin: "0 auto" }} />
            <p>Você não tem novas notificações.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              onClick={() => handleMarkRead(notif.id)}
              style={{ 
                backgroundColor: notif.read ? "#F9FAFB" : "#EFF6FF", 
                padding: "16px", 
                borderRadius: "16px", 
                cursor: "pointer",
                border: `1px solid ${notif.read ? "#E5E7EB" : "#BFDBFE"}`,
                position: "relative"
              }}
            >
              {!notif.read && <div style={{ position: "absolute", top: "16px", right: "16px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: COLORS.primary }}></div>}
              <div style={{ fontWeight: "bold", fontSize: "15px", color: COLORS.text, marginBottom: "4px" }}>{notif.title}</div>
              <p style={{ fontSize: "14px", color: COLORS.textLight, margin: "0 0 8px 0", lineHeight: "1.4" }}>{notif.message}</p>
              <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{notif.date}</span>
            </div>
          ))
        )}
      </div>
      {notifications.length > 0 && (
        <button 
          onClick={() => { NotificationService.clearAll(); setNotifications([]); }}
          style={{ ...BUTTON_STYLE, backgroundColor: "white", border: "1px solid #E5E7EB", color: COLORS.textLight, marginTop: "24px" }}
        >
          Limpar todas
        </button>
      )}
    </BottomSheet>
  );
};

const ProfileSheet = ({ user, onClose, onUpdateUser, onLogout }: { user: UserModel, onClose: () => void, onUpdateUser: (u: UserModel) => void, onLogout: () => void }) => {
  const togglePrivilege = (type: ExtraPrivilegeType) => {
    const exists = user.extraPrivileges.find(p => p.type === type);
    let newPrivileges = [...user.extraPrivileges];
    if (exists) {
      newPrivileges = newPrivileges.filter(p => p.type !== type);
    } else {
      newPrivileges.push({ type, status: 'pending' });
      showToast("Solicitação enviada ao corpo de anciãos", "success");
    }
    onUpdateUser({ ...user, extraPrivileges: newPrivileges });
  };

  const handleDeleteAccount = () => {
    if (confirm("ATENÇÃO: Tem certeza que deseja excluir sua conta permanentemente?")) {
       UserService.deleteAccount(user.uid);
       showToast("Conta excluída.", "info");
       onLogout();
    }
  };

  return (
    <BottomSheet title="Meu Perfil" onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "32px", padding: "16px", backgroundColor: "#F9FAFB", borderRadius: "16px" }}>
        <div style={{ width: "64px", height: "64px", backgroundColor: COLORS.primaryLight, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "16px", color: COLORS.primary }}>
          <User size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: COLORS.text }}>{user.name}</h3>
          <div style={{ fontSize: "14px", color: COLORS.textLight }}>{user.email || `Código: ${user.accessCode}`}</div>
          <div style={{ fontSize: "14px", color: COLORS.textLight }}>{user.phone}</div>
          <span style={{ fontSize: "12px", backgroundColor: COLORS.primary, color: "white", padding: "2px 8px", borderRadius: "12px", marginTop: "6px", display: "inline-block", fontWeight: "600" }}>
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </div>

      <h4 style={{ fontSize: "16px", fontWeight: "700", color: COLORS.text, marginBottom: "8px" }}>Privilégios Adicionais</h4>
      <p style={{ fontSize: "13px", color: COLORS.textLight, marginBottom: "16px" }}>Gerencie suas petições de serviço.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
        {Object.entries(EXTRA_PRIVILEGE_LABELS).map(([key, label]) => {
          const priv = user.extraPrivileges.find(p => p.type === key as ExtraPrivilegeType);
          const isPending = priv?.status === 'pending';
          
          return (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderRadius: "12px", border: `1px solid ${COLORS.inputBorder}`, backgroundColor: "white" }}>
              <span style={{ fontWeight: "500", color: COLORS.text }}>{label}</span>
              {priv ? (
                 <button onClick={() => togglePrivilege(key as ExtraPrivilegeType)} style={{ fontSize: "13px", fontWeight: "600", color: isPending ? COLORS.warning : COLORS.success, backgroundColor: isPending ? "#FEF3C7" : "#D1FAE5", padding: "6px 12px", borderRadius: "20px", border: "none", cursor: "pointer" }}>
                   {isPending ? "PENDENTE" : "ATIVO"} (X)
                 </button>
              ) : (
                <button onClick={() => togglePrivilege(key as ExtraPrivilegeType)} style={{ backgroundColor: "white", border: `1px solid ${COLORS.primary}`, color: COLORS.primary, padding: "6px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                  Solicitar
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={handleDeleteAccount} style={{ ...BUTTON_STYLE, backgroundColor: "white", border: `1px solid ${COLORS.danger}`, color: COLORS.danger }}>
         <Trash2 size={20} /> Excluir Minha Conta
      </button>
      <div style={{ height: "40px" }}></div>
    </BottomSheet>
  );
};

// 1. AUTH SCREEN
const AuthScreen = ({ onLogin }: { onLogin: (user: UserModel) => void }) => {
  const [authMode, setAuthMode] = useState<'email' | 'code' | 'register'>('email');
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>('publisher');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      let user: UserModel | null = null;
      if (authMode === 'code') {
        user = UserService.loginByCode(code);
        if (!user) showToast("Código inválido", "error");
      } else if (authMode === 'email') {
        user = UserService.loginByEmail(email);
        if (!user && email === 'admin@jw.org') user = { uid: 'admin', name: 'Admin Demo', email, phone:'(11) 99999-9999', role: 'elder', extraPrivileges: [], status: 'approved' };
        if (!user) user = { uid: "demo", name: "Usuário Demo", email, phone: '(00) 00000-0000', role: "publisher", extraPrivileges: [], status: 'approved' };
      } else {
        if(phone.length < 14) {
           showToast("Telefone inválido", "error");
           setLoading(false);
           return;
        }
        user = { uid: "user_" + Date.now(), name, email, phone, role, extraPrivileges: [], status: 'pending' };
        UserService.add(user);
        showToast("Cadastro realizado com sucesso!", "success");
      }

      setLoading(false);
      if (user) onLogin(user);
    }, 1000);
  };

  return (
    <div style={{ backgroundColor: COLORS.primary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="animate-slide-up" style={{ backgroundColor: COLORS.white, padding: "32px", borderRadius: "24px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ marginBottom: "32px" }}>
          <AppLogo size="large" color={COLORS.primary} />
        </div>
        <div style={{ display: "flex", marginBottom: "24px", backgroundColor: "#F3F4F6", padding: "4px", borderRadius: "12px" }}>
          {['email', 'code'].map((m) => (
            <button key={m} type="button" onClick={() => setAuthMode(m as any)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: authMode === m || (authMode === 'register' && m === 'email') ? "white" : "transparent", color: authMode === m || (authMode === 'register' && m === 'email') ? COLORS.primary : COLORS.textLight, fontWeight: "700", fontSize: "13px", boxShadow: authMode === m || (authMode === 'register' && m === 'email') ? "0 2px 5px rgba(0,0,0,0.05)" : "none", cursor: "pointer", transition: "all 0.2s" }}>
              {m === 'email' ? 'Email' : 'Código'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {authMode === 'code' ? (
            <div style={{ marginBottom: "24px", textAlign: "center" }}>
              <label style={{ display: "block", marginBottom: "12px", fontSize: "14px", fontWeight: "600", color: COLORS.text }}>Código de Acesso</label>
              <input required type="text" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" style={{ ...INPUT_STYLE, textAlign: "center", fontSize: "32px", letterSpacing: "8px", fontWeight: "800", color: COLORS.primary, borderColor: COLORS.primary }} />
            </div>
          ) : (
            <>
              {authMode === 'register' && (
                <>
                  <div style={{ marginBottom: "16px" }}><input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome Completo" style={INPUT_STYLE} /></div>
                  <div style={{ marginBottom: "16px" }}><input required type="text" value={phone} onChange={handlePhoneChange} placeholder="WhatsApp (11) 99999-9999" style={INPUT_STYLE} /></div>
                  <div style={{ marginBottom: "16px" }}>
                    <select value={role} onChange={e => setRole(e.target.value as UserRole)} style={INPUT_STYLE}>
                      {Object.entries(ROLE_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                  </div>
                </>
              )}
              <div style={{ marginBottom: "16px" }}><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" style={INPUT_STYLE} /></div>
              <div style={{ marginBottom: "24px" }}><input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" style={INPUT_STYLE} /></div>
            </>
          )}

          <button type="submit" disabled={loading} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white", boxShadow: "0 4px 10px rgba(26, 35, 126, 0.3)" }}>
            {loading ? <Loader2 className="animate-spin" /> : (authMode === 'code' ? "Entrar" : authMode === 'register' ? "Criar Conta" : "Entrar")}
          </button>
        </form>

        {authMode !== 'code' && (
          <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: COLORS.textLight }}>
            {authMode === 'email' ? "Não tem conta? " : "Já tem conta? "}
            <span onClick={() => setAuthMode(authMode === 'email' ? 'register' : 'email')} style={{ color: COLORS.primary, fontWeight: "bold", cursor: "pointer" }}>{authMode === 'email' ? "Cadastre-se" : "Login"}</span>
          </p>
        )}
      </div>
    </div>
  );
};

// 2. REPORT MODULE
const ReportModule = () => {
  const [report, setReport] = useState<ReportModel>({ month: new Date().toISOString().slice(0, 7), hours: 0, bibleStudies: 0, remarks: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("Relatório enviado com sucesso!", "success");
      setReport({ ...report, hours: 0, bibleStudies: 0, remarks: "" });
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text, marginBottom: "20px" }}>Relatório de Campo</h2>
      <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: COLORS.cardShadow }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: COLORS.text, fontSize: "14px" }}>Mês de Referência</label>
            <input type="month" value={report.month} onChange={e => setReport({...report, month: e.target.value})} style={INPUT_STYLE} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: COLORS.text, fontSize: "14px" }}>Horas</label>
              <input type="number" min="0" value={report.hours} onChange={e => setReport({...report, hours: parseInt(e.target.value) || 0})} style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: COLORS.text, fontSize: "14px" }}>Estudos</label>
              <input type="number" min="0" value={report.bibleStudies} onChange={e => setReport({...report, bibleStudies: parseInt(e.target.value) || 0})} style={INPUT_STYLE} />
            </div>
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: COLORS.text, fontSize: "14px" }}>Observações</label>
            <textarea value={report.remarks} onChange={e => setReport({...report, remarks: e.target.value})} rows={3} style={INPUT_STYLE} placeholder="Alguma observação importante?" />
          </div>
          <button type="submit" disabled={loading} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.success, color: "white" }}>
            {loading ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Enviar Relatório</>}
          </button>
        </form>
      </div>
    </div>
  );
};

// 3. AGENDA MODULE
const AgendaModule = ({ items, onAdd, onDelete }: { items: AgendaItem[], onAdd: (item: AgendaItem) => void, onDelete: (id: string) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<AgendaItem>>({ type: 'study' });

  const handleAdd = () => {
    if (newItem.title && newItem.date && newItem.time) {
      onAdd({ ...newItem, id: Date.now().toString() } as AgendaItem);
      setIsAdding(false);
      setNewItem({ type: 'study', title: '', date: '', time: '' });
      showToast("Compromisso agendado", "success");
    } else {
      showToast("Preencha todos os campos", "error");
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text }}>Agenda Teocrática</h2>
        <button onClick={() => setIsAdding(!isAdding)} style={{ backgroundColor: COLORS.primary, color: "white", border: "none", borderRadius: "12px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", cursor: "pointer" }}>
          {isAdding ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      {isAdding && (
        <div className="animate-slide-up" style={{ backgroundColor: "white", padding: "20px", borderRadius: "16px", marginBottom: "20px", boxShadow: COLORS.cardShadow }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: COLORS.text }}>Novo Compromisso</h3>
          <input type="text" placeholder="Título (ex: Estudo com João)" value={newItem.title || ''} onChange={e => setNewItem({...newItem, title: e.target.value})} style={{ ...INPUT_STYLE, marginBottom: "12px" }} />
          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <input type="date" value={newItem.date || ''} onChange={e => setNewItem({...newItem, date: e.target.value})} style={INPUT_STYLE} />
            <input type="time" value={newItem.time || ''} onChange={e => setNewItem({...newItem, time: e.target.value})} style={INPUT_STYLE} />
          </div>
          <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})} style={{ ...INPUT_STYLE, marginBottom: "20px" }}>
            {Object.entries(ACTIVITY_TYPES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
          </select>
          <button onClick={handleAdd} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Adicionar</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: COLORS.textLight }}>
            <Calendar size={48} style={{ opacity: 0.1, marginBottom: "16px", margin: "0 auto" }} />
            <p>Sua agenda está vazia.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="animate-fade-in" style={{ backgroundColor: "white", padding: "16px", borderRadius: "16px", boxShadow: COLORS.cardShadow, display: "flex", alignItems: "center", borderLeft: `6px solid ${item.type === 'study' ? COLORS.primary : item.type === 'cart' ? COLORS.accent : COLORS.warning}` }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: "bold", color: COLORS.text, marginBottom: "6px", fontSize: "16px" }}>{item.title}</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: COLORS.textLight }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {item.date}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {item.time}</span>
                </div>
              </div>
              <button onClick={() => onDelete(item.id)} style={{ padding: "10px", color: COLORS.danger, background: "rgba(220, 38, 38, 0.1)", borderRadius: "10px", border: "none", cursor: "pointer" }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 4. ASSIGNMENTS MODULE
const AssignmentsModule = ({ user }: { user: UserModel }) => {
  const [assignments, setAssignments] = useState<AssignmentModel[]>([
    { id: '1', date: '2023-10-15', partName: 'Leitura da Bíblia', assignee: user.uid, status: 'accepted' },
    { id: '2', date: '2023-10-22', partName: 'Indicador', assignee: user.uid, status: 'pending' },
    { id: '3', date: '2023-11-05', partName: 'Microfone Volante', assignee: user.uid, status: 'pending' },
  ]);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const openDeclineModal = (id: string) => {
    setSelectedAssignmentId(id);
    setDeclineModalOpen(true);
    setDeclineReason("");
  };

  const confirmDecline = () => {
    if (!selectedAssignmentId) return;
    setAssignments(prev => prev.map(a => a.id === selectedAssignmentId ? { ...a, status: 'declined', declineReason } : a));
    setDeclineModalOpen(false);
    showToast("Designação recusada.", "info");
  };

  const sendDeclineWhatsapp = () => {
    const text = `Gostaria de informar que não poderei cuidar da minha designação. Motivo: ${declineReason}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    confirmDecline();
  };

  const handleStatus = (id: string, newStatus: 'accepted') => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    showToast("Designação confirmada", "success");
  };

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text, marginBottom: "20px" }}>Designações</h2>
      
      {declineModalOpen && (
        <BottomSheet title="Justificar Recusa" onClose={() => setDeclineModalOpen(false)}>
          <p style={{ marginBottom: "16px", color: COLORS.textLight, fontSize: "14px" }}>Por favor, informe o motivo para ajudar os irmãos na substituição.</p>
          <textarea 
            value={declineReason} 
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Digite o motivo..." 
            rows={4} 
            style={{ ...INPUT_STYLE, marginBottom: "24px" }} 
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
             <button onClick={sendDeclineWhatsapp} style={{ ...BUTTON_STYLE, backgroundColor: "#25D366", color: "white" }}>
               <MessageCircle size={20} /> Justificar via WhatsApp
             </button>
             <button onClick={confirmDecline} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.secondary, color: COLORS.text }}>
               Apenas Recusar
             </button>
          </div>
        </BottomSheet>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {assignments.map(assign => (
          <div key={assign.id} style={{ backgroundColor: "white", padding: "20px", borderRadius: "16px", boxShadow: COLORS.cardShadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary, fontSize: "12px", padding: "6px 12px", borderRadius: "20px", fontWeight: "700" }}>
                {new Date(assign.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
              </span>
              <span style={{ 
                color: assign.status === 'pending' ? COLORS.warning : assign.status === 'accepted' ? COLORS.success : COLORS.danger, 
                backgroundColor: assign.status === 'pending' ? "#FEF3C7" : assign.status === 'accepted' ? "#D1FAE5" : "#FEE2E2",
                fontSize: "12px", fontWeight: "700", padding: "6px 12px", borderRadius: "20px"
              }}>
                {assign.status === 'pending' ? "PENDENTE" : assign.status === 'accepted' ? "CONFIRMADO" : "RECUSADO"}
              </span>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: COLORS.text, marginBottom: "6px" }}>{assign.partName}</h3>
            <p style={{ fontSize: "14px", color: COLORS.textLight, marginBottom: "20px" }}>Salão do Reino</p>
            
            {assign.status === 'pending' ? (
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => openDeclineModal(assign.id)} style={{ ...BUTTON_STYLE, backgroundColor: "white", border: `2px solid ${COLORS.danger}`, color: COLORS.danger }}>Recusar</button>
                <button onClick={() => handleStatus(assign.id, 'accepted')} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.success, color: "white" }}>Aceitar</button>
              </div>
            ) : (
               <div style={{ fontSize: "13px", color: COLORS.textLight, textAlign: "center", borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>Status atualizado.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. TERRITORIES / PREGAÇÃO (UPDATED)
const TerritoriesModule = () => {
  const [meetings, setMeetings] = useState<FieldServiceMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<FieldServiceMeeting | null>(null);

  useEffect(() => {
    setMeetings(TerritoryService.getAll());
  }, []);

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text, marginBottom: "20px" }}>Pregação</h2>
      
      {selectedMeeting && (
        <BottomSheet title="Detalhes do Território" onClose={() => setSelectedMeeting(null)}>
          <div style={{ padding: "0 8px 16px 8px" }}>
            <div style={{ marginBottom: "16px" }}>
               <h4 style={{ fontSize: "14px", color: COLORS.textLight, fontWeight: "600" }}>Data / Dia</h4>
               <p style={{ fontSize: "18px", color: COLORS.text, fontWeight: "700" }}>{selectedMeeting.dayDescription}</p>
            </div>
            <div style={{ marginBottom: "16px" }}>
               <h4 style={{ fontSize: "14px", color: COLORS.textLight, fontWeight: "600" }}>Horário e Local</h4>
               <p style={{ fontSize: "16px", color: COLORS.text, fontWeight: "500" }}>{selectedMeeting.time} - {selectedMeeting.location}</p>
            </div>
            <div style={{ marginBottom: "24px", backgroundColor: "#F3F4F6", padding: "16px", borderRadius: "12px" }}>
               <h4 style={{ fontSize: "14px", color: COLORS.textLight, fontWeight: "600", marginBottom: "8px" }}>Territórios Designados</h4>
               <p style={{ fontSize: "16px", color: COLORS.primary, fontWeight: "500", lineHeight: "1.5" }}>{selectedMeeting.territories}</p>
            </div>
            <button onClick={() => setSelectedMeeting(null)} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>
              Fechar
            </button>
          </div>
        </BottomSheet>
      )}

      <div style={{ display: "grid", gap: "16px" }}>
        {meetings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: COLORS.textLight }}>
             <Map size={48} style={{ opacity: 0.1, marginBottom: "16px", margin: "0 auto" }} />
             <p>Nenhuma saída de campo programada.</p>
          </div>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} style={{ backgroundColor: "white", borderRadius: "16px", overflow: "hidden", boxShadow: COLORS.cardShadow }}>
              <div style={{ height: "100px", backgroundColor: "#CFD8DC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={40} color="white" />
              </div>
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ fontWeight: "800", fontSize: "18px", color: COLORS.text }}>{meeting.dayDescription}</h3>
                  <span style={{ fontSize: "12px", backgroundColor: "#D1FAE5", color: COLORS.success, padding: "4px 8px", borderRadius: "4px", fontWeight: "700" }}>{meeting.time}</span>
                </div>
                <p style={{ fontSize: "14px", color: COLORS.textLight, marginBottom: "20px" }}>{meeting.location}</p>
                <button onClick={() => setSelectedMeeting(meeting)} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Visualizar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 6. EVENTS / EXCURSIONS MODULE
const EventsModule = ({ user }: { user: UserModel }) => {
  const [events, setEvents] = useState<EventModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEvents(EventService.getAll());
  }, []);

  const handleReserve = (event: EventModel) => {
    setLoading(true);
    setTimeout(() => {
      const updatedList = EventService.reserve(event.id, user.uid, user.name);
      setEvents(updatedList);
      showToast("Lugar reservado com sucesso!", "success");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text, marginBottom: "20px" }}>Eventos & Viagens</h2>
      
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: COLORS.textLight }}>
          <Calendar size={48} style={{ opacity: 0.1, marginBottom: "16px", margin: "0 auto" }} />
          <p>Nenhum evento agendado.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {events.map(event => {
            const isReserved = event.reservedUserIds.includes(user.uid);
            return (
              <div key={event.id} style={{ backgroundColor: "white", padding: "0", borderRadius: "16px", boxShadow: COLORS.cardShadow, overflow: "hidden" }}>
                <div style={{ height: "120px", backgroundColor: "#90CAF9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bus size={50} color="white" />
                </div>
                <div style={{ padding: "20px" }}>
                  <h3 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px", color: COLORS.text }}>{event.title}</h3>
                  <div style={{ fontSize: "15px", color: COLORS.textLight, marginBottom: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                     <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={14} /> {new Date(event.date).toLocaleDateString()}</div>
                     <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><Clock size={14} /> Saída: {event.departureTime}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", backgroundColor: "#F3F4F6", padding: "12px", borderRadius: "12px" }}>
                    <span style={{ fontSize: "18px", fontWeight: "800", color: COLORS.success }}>R$ {event.price.toFixed(2)}</span>
                    <span style={{ fontSize: "12px", color: COLORS.textLight, fontWeight: "600" }}>{event.reservedUserIds.length} Reservas</span>
                  </div>
                  <button 
                      onClick={() => handleReserve(event)}
                      disabled={isReserved || loading}
                      style={{ ...BUTTON_STYLE, backgroundColor: isReserved ? COLORS.success : COLORS.primary, color: "white", opacity: isReserved ? 0.9 : 1 }}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : isReserved ? "Reserva Confirmada" : "Reservar Lugar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 7. LITERATURE
const LiteratureModule = () => {
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderText, setOrderText] = useState("");

  const sendOrderWhatsapp = () => {
    if (!orderText.trim()) return showToast("Digite o pedido.", "error");
    const text = `Olá, gostaria de fazer um pedido de publicações:\n\n${orderText}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setOrderModalOpen(false);
    setOrderText("");
  };

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text, marginBottom: "20px" }}>Publicações</h2>
      
      {orderModalOpen && (
        <BottomSheet title="Novo Pedido" onClose={() => setOrderModalOpen(false)}>
           <p style={{ marginBottom: "16px", color: COLORS.textLight, fontSize: "14px" }}>Descreva as publicações que você precisa.</p>
           <textarea 
            value={orderText} 
            onChange={(e) => setOrderText(e.target.value)}
            placeholder="Ex: 1 Bíblia, 2 Livros 'Seja Feliz'..." 
            rows={5} 
            style={{ ...INPUT_STYLE, marginBottom: "24px" }} 
          />
          <button onClick={sendOrderWhatsapp} style={{ ...BUTTON_STYLE, backgroundColor: "#25D366", color: "white" }}>
             <MessageCircle size={20} /> Enviar Pedido (WhatsApp)
          </button>
        </BottomSheet>
      )}

      <div style={{ backgroundColor: "white", padding: "32px 24px", borderRadius: "16px", boxShadow: COLORS.cardShadow, textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", backgroundColor: "#FFF7ED", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto" }}>
          <BookOpen size={40} color={COLORS.warning} />
        </div>
        <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", color: COLORS.text }}>Balcão Virtual</h3>
        <p style={{ color: COLORS.textLight, marginBottom: "24px", fontSize: "15px", lineHeight: "1.5" }}>Solicite Bíblias, livros e folhetos para o ministério ou uso pessoal.</p>
        <button onClick={() => setOrderModalOpen(true)} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Fazer Pedido</button>
      </div>
    </div>
  );
};

// 8. EMERGENCY
const EmergencyScreen = ({ user, defaultHelpPhone, onUpdateStatus }: { user: UserModel, defaultHelpPhone?: string, onUpdateStatus: (s: 1|2|3) => void }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [helpMsg, setHelpMsg] = useState("");
  const [helpPhone, setHelpPhone] = useState(ConfigService.getHelpPhone() || defaultHelpPhone || user?.phone || "");
  const [showConfirm, setShowConfirm] = useState(false);

  const doSendHelpWhatsapp = () => {
    const phoneDigits = (helpPhone || "").replace(/\D/g, "");
    if (!phoneDigits) return showToast("Digite o telefone do contato (ex: 5511999999999)", "error");
    const text = helpMsg.trim() || "Preciso de ajuda. Favor contatar-me o mais breve possível.";
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    ConfigService.setHelpPhone(phoneDigits);
    showToast("Mensagem enviada via WhatsApp", "success");
    onUpdateStatus(2);
    setShowHelp(false);
    setShowConfirm(false);
  };

  return (
    <div className="animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.danger, zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", color: "white" }}>
      <div style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "20px", borderRadius: "50%", marginBottom: "32px" }}>
        <AlertTriangle size={64} color="white" />
      </div>
      <h1 style={{ fontSize: "32px", fontWeight: "900", textAlign: "center", marginBottom: "16px" }}>EMERGÊNCIA</h1>
      <p style={{ textAlign: "center", marginBottom: "24px", fontSize: "18px", opacity: 0.95, lineHeight: "1.5" }}>
        Protocolo de segurança ativado.<br/>Por favor, informe sua situação.
      </p>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
        <button onClick={() => onUpdateStatus(1)} style={{ ...BUTTON_STYLE, backgroundColor: "white", color: COLORS.success, height: "64px", fontSize: "18px" }}>
          <CheckCircle size={28} /> ESTOU SEGURO
        </button>
        <button onClick={() => setShowHelp(true)} style={{ ...BUTTON_STYLE, backgroundColor: "rgba(0,0,0,0.3)", color: "white", border: "2px solid white", height: "64px", fontSize: "18px" }}>
          <AlertCircle size={28} /> PRECISO DE AJUDA
        </button>
      </div>

      {showHelp && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10000 }} onClick={() => setShowHelp(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "white", color: "#111827", borderRadius: 12, padding: 20 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Descreva o que você precisa</h3>
            <textarea value={helpMsg} onChange={(e) => setHelpMsg(e.target.value)} placeholder="Descreva sua situação, local, estado..." rows={5} style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #E5E7EB", marginBottom: 12 }} />
            <input value={helpPhone} onChange={(e) => setHelpPhone(e.target.value)} placeholder="Telefone do contato (ex: 5511999999999)" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #E5E7EB", marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowHelp(false)} style={{ ...BUTTON_STYLE, backgroundColor: "#F3F4F6", color: COLORS.text }}>Cancelar</button>
              <button onClick={() => setShowConfirm(true)} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Enviar via WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 11000 }} onClick={() => setShowConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "white", color: "#111827", borderRadius: 12, padding: 18 }}>
            <h4 style={{ marginTop: 0 }}>Confirmar envio</h4>
            <p style={{ marginBottom: 12 }}>Enviar a seguinte mensagem para <strong>{helpPhone}</strong>?</p>
            <div style={{ background: "#F9FAFB", padding: 12, borderRadius: 8, marginBottom: 12, whiteSpace: "pre-wrap" }}>{helpMsg.trim() || "Preciso de ajuda. Favor contatar-me o mais breve possível."}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowConfirm(false)} style={{ ...BUTTON_STYLE, backgroundColor: "#F3F4F6", color: COLORS.text }}>Cancelar</button>
              <button onClick={doSendHelpWhatsapp} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Confirmar e abrir WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 9. ADMIN
const AdminModule = ({ toggleEmergency, isEmergencyActive }: { toggleEmergency: () => void, isEmergencyActive: boolean }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'territories' | 'config' | 'emergency'>('users');
  const [users, setUsers] = useState<UserModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>('publisher');
  
  // Event Creation State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventPrice, setNewEventPrice] = useState("");

  // Territory Creation State
  const [newTerritoryDay, setNewTerritoryDay] = useState("");
  const [newTerritoryTime, setNewTerritoryTime] = useState("");
  const [newTerritoryLocation, setNewTerritoryLocation] = useState("");
  const [newTerritoryList, setNewTerritoryList] = useState("");
  const [territoryMeetings, setTerritoryMeetings] = useState<FieldServiceMeeting[]>([]);

  // Config State
  const [zoomLink, setZoomLink] = useState(ConfigService.getZoomLink());

  const loadUsers = () => setUsers(UserService.getAll());
  const loadTerritories = () => setTerritoryMeetings(TerritoryService.getAll());

  useEffect(() => { loadUsers(); loadTerritories(); }, []);

  const generateCodeUser = () => {
    if (!newUserName) return showToast("Nome é obrigatório", "error");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    UserService.add({ uid: "u_" + Date.now(), name: newUserName, role: newUserRole, status: 'approved', extraPrivileges: [], accessCode: code, phone: "" });
    loadUsers();
    setNewUserOpen(false);
    setNewUserName("");
    showToast(`Usuário criado! Código: ${code}`, "success");
  };

  const createEvent = () => {
    if (!newEventTitle || !newEventDate || !newEventTime) return showToast("Preencha todos os campos", "error");
    const event: EventModel = {
      id: "evt_" + Date.now(),
      title: newEventTitle,
      date: newEventDate,
      departureTime: newEventTime,
      price: parseFloat(newEventPrice) || 0,
      seats: 50,
      reservedUserIds: []
    };
    EventService.add(event);
    showToast("Evento criado com sucesso!", "success");
    setNewEventTitle(""); setNewEventDate(""); setNewEventTime(""); setNewEventPrice("");
  };

  const createTerritoryMeeting = () => {
    if (!newTerritoryDay || !newTerritoryTime || !newTerritoryLocation || !newTerritoryList) return showToast("Preencha todos os campos", "error");
    TerritoryService.add({
      id: "tm_" + Date.now(),
      dayDescription: newTerritoryDay,
      time: newTerritoryTime,
      location: newTerritoryLocation,
      territories: newTerritoryList
    });
    showToast("Saída de campo criada!", "success");
    setNewTerritoryDay(""); setNewTerritoryTime(""); setNewTerritoryLocation(""); setNewTerritoryList("");
    loadTerritories();
  };

  const deleteTerritoryMeeting = (id: string) => {
    TerritoryService.delete(id);
    loadTerritories();
  };

  const saveZoom = () => {
    ConfigService.setZoomLink(zoomLink);
  };

  const contactUserWhatsapp = (phone: string) => {
     if(!phone) return showToast("Usuário sem telefone cadastrado", "error");
     const cleanPhone = phone.replace(/\D/g, "");
     window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-fade-in" style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "800", color: COLORS.text, marginBottom: "20px" }}>Administração</h2>
      
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", padding: "4px", backgroundColor: "#E5E7EB", borderRadius: "12px", overflowX: "auto" }} className="scroll-content">
        {['users', 'territories', 'events', 'config', 'emergency'].map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} style={{ flex: "0 0 auto", minWidth: "90px", padding: "10px", borderRadius: "10px", border: "none", backgroundColor: activeTab === t ? "white" : "transparent", color: activeTab === t ? COLORS.text : COLORS.textLight, fontWeight: "700", cursor: "pointer", transition: "all 0.2s", boxShadow: activeTab === t ? "0 2px 4px rgba(0,0,0,0.1)" : "none" }}>
            {t === 'users' ? "Usuários" : t === 'territories' ? "Territórios" : t === 'events' ? "Eventos" : t === 'config' ? "Config" : "Segurança"}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="animate-slide-up" style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: COLORS.cardShadow }}>
           <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: COLORS.text }}>Configuração de Reunião</h3>
           <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: COLORS.text }}>Link do Zoom</label>
           <input type="text" value={zoomLink} onChange={(e) => setZoomLink(e.target.value)} placeholder="https://zoom.us/..." style={{ ...INPUT_STYLE, marginBottom: "16px" }} />
           <button onClick={saveZoom} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Salvar Link</button>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="animate-slide-up" style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: COLORS.cardShadow }}>
           <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: COLORS.text }}>Novo Evento / Excursão</h3>
           <input type="text" placeholder="Nome do Evento (ex: Assembleia)" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: "12px" }} />
           <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} style={INPUT_STYLE} />
              <input type="time" placeholder="Saída" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} style={INPUT_STYLE} />
           </div>
           <input type="number" placeholder="Valor (R$)" value={newEventPrice} onChange={(e) => setNewEventPrice(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: "20px" }} />
           <button onClick={createEvent} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.success, color: "white" }}>Criar Evento</button>
        </div>
      )}

      {activeTab === 'territories' && (
         <div className="animate-slide-up">
            <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", boxShadow: COLORS.cardShadow, marginBottom: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: COLORS.text }}>Nova Saída de Campo</h3>
              <input type="text" placeholder="Dia/Data (Ex: Sábado 25/10)" value={newTerritoryDay} onChange={(e) => setNewTerritoryDay(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: "12px" }} />
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                 <input type="text" placeholder="Horário" value={newTerritoryTime} onChange={(e) => setNewTerritoryTime(e.target.value)} style={INPUT_STYLE} />
                 <input type="text" placeholder="Local" value={newTerritoryLocation} onChange={(e) => setNewTerritoryLocation(e.target.value)} style={INPUT_STYLE} />
              </div>
              <textarea placeholder="Territórios (Ex: Mapa 1, Mapa 5, Comercio Centro...)" value={newTerritoryList} onChange={(e) => setNewTerritoryList(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: "16px" }} rows={3} />
              <button onClick={createTerritoryMeeting} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.primary, color: "white" }}>Criar Saída</button>
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: COLORS.text }}>Saídas Programadas</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              {territoryMeetings.map(m => (
                 <div key={m.id} style={{ backgroundColor: "white", padding: "16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${COLORS.accent}` }}>
                    <div>
                       <div style={{ fontWeight: "bold", color: COLORS.text }}>{m.dayDescription} - {m.time}</div>
                       <div style={{ fontSize: "13px", color: COLORS.textLight }}>{m.location}</div>
                    </div>
                    <button onClick={() => deleteTerritoryMeeting(m.id)} style={{ color: COLORS.danger, background: "none", border: "none", cursor: "pointer" }}><Trash2 size={18} /></button>
                 </div>
              ))}
            </div>
         </div>
      )}

      {activeTab === 'emergency' && (
        <div className="animate-slide-up" style={{ backgroundColor: isEmergencyActive ? "#FEF2F2" : "white", padding: "24px", borderRadius: "16px", boxShadow: COLORS.cardShadow, border: isEmergencyActive ? `2px solid ${COLORS.danger}` : "none" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px", color: COLORS.danger }}>
            <AlertTriangle size={28} style={{ marginRight: "12px" }} />
            <h3 style={{ fontSize: "20px", fontWeight: "800" }}>Zona de Perigo</h3>
          </div>
          <p style={{ fontSize: "15px", color: COLORS.text, marginBottom: "24px", lineHeight: "1.5" }}>
            Ativar o modo de emergência bloqueará a tela de todos os usuários e solicitará confirmação de segurança.
          </p>
          <button onClick={toggleEmergency} style={{ ...BUTTON_STYLE, backgroundColor: isEmergencyActive ? COLORS.text : COLORS.danger, color: "white" }}>
            {isEmergencyActive ? "DESATIVAR EMERGÊNCIA" : "ATIVAR PROTOCOLO"}
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-slide-up">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
             <button onClick={() => setNewUserOpen(true)} style={{ padding: "20px", backgroundColor: "white", color: COLORS.accent, border: "1px solid #E5E7EB", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer", boxShadow: COLORS.cardShadow }}>
               <KeyRound size={28} />
               <span style={{ fontSize: "14px", fontWeight: "700" }}>Gerar Acesso</span>
             </button>
             <button onClick={() => { NotificationService.broadcast("Aviso", "Teste de notificação"); showToast("Enviado", "success"); }} style={{ padding: "20px", backgroundColor: "white", color: COLORS.primary, border: "1px solid #E5E7EB", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer", boxShadow: COLORS.cardShadow }}>
               <Megaphone size={28} />
               <span style={{ fontSize: "14px", fontWeight: "700" }}>Broadcast</span>
             </button>
          </div>

          {newUserOpen && (
            <div className="animate-fade-in" style={{ backgroundColor: "white", padding: "20px", borderRadius: "16px", marginBottom: "24px", boxShadow: COLORS.cardShadow }}>
              <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: COLORS.text }}>Novo Usuário</h3>
              <input type="text" placeholder="Nome do Usuário" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ ...INPUT_STYLE, marginBottom: "12px" }} />
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} style={{ ...INPUT_STYLE, marginBottom: "20px" }}>
                 {Object.entries(ROLE_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
              </select>
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setNewUserOpen(false)} style={{ ...BUTTON_STYLE, backgroundColor: "#F3F4F6", color: COLORS.text }}>Cancelar</button>
                <button onClick={generateCodeUser} style={{ ...BUTTON_STYLE, backgroundColor: COLORS.success, color: "white" }}>Criar</button>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: COLORS.cardShadow, overflow: "hidden" }}>
             <div style={{ padding: "16px", borderBottom: `1px solid #F3F4F6`, display: "flex", alignItems: "center" }}>
               <Search size={20} color={COLORS.textLight} style={{ marginRight: "12px" }} />
               <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ border: "none", outline: "none", width: "100%", fontSize: "16px", color: COLORS.text }} />
             </div>
             <div style={{ maxHeight: "400px", overflowY: "auto" }}>
               {filteredUsers.map(u => (
                 <div key={u.uid} style={{ padding: "16px", borderBottom: `1px solid #F3F4F6`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div>
                     <div style={{ fontWeight: "700", fontSize: "16px", color: COLORS.text }}>{u.name}</div>
                     <div style={{ fontSize: "13px", color: COLORS.textLight, marginTop: "4px" }}>
                       {ROLE_LABELS[u.role]} • {u.accessCode ? `Cód: ${u.accessCode}` : u.email}
                     </div>
                   </div>
                   <button onClick={() => contactUserWhatsapp(u.phone)} style={{ padding: "10px", borderRadius: "50%", backgroundColor: "#DCFCE7", border: "none", cursor: "pointer", color: "#166534" }}>
                     <MessageCircle size={18} />
                   </button>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
export function App() {
  const [user, setUser] = useState<UserModel | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [zoomLink, setZoomLink] = useState(ConfigService.getZoomLink());
  const [defaultHelpPhone, setDefaultHelpPhone] = useState('');

  useEffect(() => {
    const updateCount = () => setUnreadCount(NotificationService.getUnreadCount());
    updateCount();
    window.addEventListener('elojw_update_notifications', updateCount);
    // Poll for zoom link changes (simple implementation)
    const zoomInterval = setInterval(() => {
       const link = ConfigService.getZoomLink();
       if (link !== zoomLink) setZoomLink(link);
    }, 2000);
    // Load metadata.json to get default help phone (if provided)
    fetch('/metadata.json').then(r => r.ok ? r.json() : null).then(data => {
      if (data && (data.helpPhone || data.help_phone || data.emergencyPhone)) {
        setDefaultHelpPhone(data.helpPhone || data.help_phone || data.emergencyPhone);
      }
    }).catch(() => {});
    return () => {
       window.removeEventListener('elojw_update_notifications', updateCount);
       clearInterval(zoomInterval);
    }
  }, [zoomLink]);

  const handleLogout = () => {
     setUser(null);
     setShowProfile(false);
  };

  if (!user) return <><style>{GLOBAL_STYLES}</style><ToastContainer /><AuthScreen onLogin={setUser} /></>;
  if (isEmergencyActive) return <><style>{GLOBAL_STYLES}</style><EmergencyScreen user={user} defaultHelpPhone={defaultHelpPhone} onUpdateStatus={(s) => {
    setUser({...user, emergencyStatus: s});
    if (s === 1) {
      setIsEmergencyActive(false);
      setActiveTab('home');
    }
  }} /></>;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="animate-fade-in" style={{ padding: "16px" }}>
            <button 
              onClick={() => window.open(zoomLink, '_blank')}
              style={{ width: "100%", marginBottom: "24px", padding: "20px", borderRadius: "20px", background: `linear-gradient(135deg, #2D8CFF 0%, ${COLORS.primary} 100%)`, color: "white", border: "none", boxShadow: `0 10px 25px -5px rgba(26, 35, 126, 0.4)`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", position: "relative", overflow: "hidden" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "50%", marginRight: "16px" }}>
                  <Video size={28} color="white" fill="white" />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "18px", fontWeight: "800" }}>Entrar na Reunião</div>
                  <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px" }}>Toque para abrir o Zoom</div>
                </div>
              </div>
              <ChevronRight size={24} style={{ opacity: 0.6 }} />
            </button>

            <div style={{ background: "white", padding: "24px", borderRadius: "24px", marginBottom: "32px", boxShadow: COLORS.cardShadow, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "6px", background: `linear-gradient(90deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)` }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: COLORS.text }}>Olá, {user.name.split(' ')[0]}</h1>
                  <span style={{ fontSize: "13px", color: COLORS.textLight }}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <div onClick={() => setShowProfile(true)} style={{ width: "48px", height: "48px", backgroundColor: "#F3F4F6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.primary }}>
                  <User size={24} />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1, backgroundColor: "#F9FAFB", padding: "16px", borderRadius: "16px", textAlign: "center" }}>
                   <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.primary }}>12</div>
                   <div style={{ fontSize: "12px", fontWeight: "600", color: COLORS.textLight, marginTop: "4px" }}>HORAS</div>
                </div>
                <div style={{ flex: 1, backgroundColor: "#F9FAFB", padding: "16px", borderRadius: "16px", textAlign: "center" }}>
                   <div style={{ fontSize: "24px", fontWeight: "800", color: COLORS.accent }}>2</div>
                   <div style={{ fontSize: "12px", fontWeight: "600", color: COLORS.textLight, marginTop: "4px" }}>ESTUDOS</div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: "800", color: COLORS.text, marginBottom: "16px" }}>Acesso Rápido</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { id: 'agenda', icon: CalendarCheck, color: COLORS.primary, label: 'Agenda', bg: "#E0E7FF" },
                { id: 'territories', icon: Map, color: "#7C3AED", label: 'Pregação', bg: "#F3E8FF" },
                { id: 'events', icon: Bus, color: "#0284C7", label: 'Eventos', bg: "#E0F2FE" },
                { id: 'literature', icon: BookOpen, color: "#EA580C", label: 'Publicações', bg: "#FFEDD5" },
                { id: 'reports', icon: Clock, color: COLORS.success, label: 'Relatório', bg: "#D1FAE5" },
                { id: 'assignments', icon: Briefcase, color: COLORS.accent, label: 'Designações', bg: "#CCFBF1" },
              ].map(item => (
                <div key={item.id} onClick={() => setActiveTab(item.id)} style={{ backgroundColor: "white", padding: "20px", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", boxShadow: COLORS.cardShadow, transition: "transform 0.1s" }}>
                  <div style={{ backgroundColor: item.bg, padding: "14px", borderRadius: "50%", color: item.color }}>
                    <item.icon size={28} />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: COLORS.text }}>{item.label}</span>
                </div>
              ))}
              {(user.role === 'elder' || user.role === 'ministerialServant') && (
                 <div onClick={() => setActiveTab('admin')} style={{ backgroundColor: "white", padding: "20px", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", cursor: "pointer", boxShadow: COLORS.cardShadow }}>
                 <div style={{ backgroundColor: "#FEE2E2", padding: "14px", borderRadius: "50%", color: COLORS.danger }}>
                   <Shield size={28} />
                 </div>
                 <span style={{ fontSize: "14px", fontWeight: "700", color: COLORS.text }}>Admin</span>
               </div>
              )}
            </div>
          </div>
        );
      case 'reports': return <ReportModule />;
      case 'agenda': return <AgendaModule items={agendaItems} onAdd={i => setAgendaItems([...agendaItems, i])} onDelete={id => setAgendaItems(agendaItems.filter(i => i.id !== id))} />;
      case 'assignments': return <AssignmentsModule user={user} />;
      case 'territories': return <TerritoriesModule />;
      case 'events': return <EventsModule user={user} />;
      case 'literature': return <LiteratureModule />;
      case 'admin': return <AdminModule isEmergencyActive={isEmergencyActive} toggleEmergency={() => setIsEmergencyActive(!isEmergencyActive)} />;
      default: return <div>Em construção</div>;
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={CONTAINER_STYLE}>
        <ToastContainer />
        {showNotifications && <NotificationsSheet onClose={() => setShowNotifications(false)} />}
        {showProfile && <ProfileSheet user={user} onClose={() => setShowProfile(false)} onUpdateUser={setUser} onLogout={handleLogout} />}

        <div style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: COLORS.primary, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {activeTab !== 'home' ? (
                <button onClick={() => setActiveTab('home')} style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 10, color: 'white', cursor: 'pointer' }} aria-label="Voltar para o início">
                  <ChevronLeft size={22} color="white" />
                  <span style={{ fontSize: "16px", fontWeight: 700 }}>Voltar</span>
                </button>
              ) : (
                <>
                  <div style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Link2 size={20} color="white" style={{ transform: "rotate(-45deg)" }} />
                  </div>
                  <h1 style={{ fontSize: "22px", fontWeight: "800", color: "white", letterSpacing: "-0.5px" }}>Elo JW</h1>
                </>
              )}
            </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowNotifications(true)}>
              <Bell size={26} color="white" />
              {unreadCount > 0 && (
                <div style={{ position: "absolute", top: -2, right: -2, backgroundColor: COLORS.danger, color: "white", borderRadius: "50%", width: "10px", height: "10px", border: "2px solid #1A237E" }}></div>
              )}
            </div>
            <LogOut size={24} color="white" onClick={handleLogout} style={{ cursor: "pointer", opacity: 0.8 }} />
          </div>
        </div>

        <div className="scroll-content" style={{ flex: 1, overflowY: "auto", paddingBottom: "16px" }}>{renderContent()}</div>

        <div style={{ backgroundColor: "white", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-around", padding: "12px 0", paddingBottom: "24px", boxShadow: "0 -4px 20px rgba(0,0,0,0.03)" }}>
          {[
            { id: 'home', icon: Home, label: 'Início' },
            { id: 'agenda', icon: CalendarCheck, label: 'Agenda' },
            { id: 'territories', icon: Map, label: 'Pregação' },
            { id: 'reports', icon: Clock, label: 'Relat.' },
            { id: 'assignments', icon: Briefcase, label: 'Desig.' },
          ].map(tab => (
            <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", color: activeTab === tab.id ? COLORS.primary : "#9CA3AF", transition: "all 0.2s" }}>
              <tab.icon size={26} strokeWidth={activeTab === tab.id ? 2.5 : 2} style={{ marginBottom: "4px" }} />
              <span style={{ fontSize: "11px", fontWeight: activeTab === tab.id ? "700" : "500" }}>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);