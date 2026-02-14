"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Navegação
import { signOut, onAuthStateChanged } from "firebase/auth"; // Auth do Firebase
import { auth } from '@/lib/firebase'; // Garanta que está assim
import { 
  Users, DollarSign, TrendingUp, Calendar, CheckCircle, XCircle, Clock, BarChart3, 
  CalendarDays, Loader2, Eye, Copy, Check, ExternalLink, Hash, Stethoscope, Phone,
  PieChart as PieIcon, BarChart as BarIcon, Search, Filter, Moon, Sun, LogOut, Video
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

// SEU LINK DO RENDER (Produção)
const API_URL = "https://profitlens-api.onrender.com/leads"; 

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

type Lead = {
  id_unico: string;
  nome?: string;
  telefone_lead: string;
  tipo_tratamento?: string;
  utm_source: string;
  utm_campaign: string;
  utm_content: string; // Adicionado para rastreio de criativo
  status: string;
  data_legivel: string;
  timestamp: string;
  valor_venda: number;
  data_agendamento?: string;
};

export default function ProfitLensDashboard() {
  const router = useRouter();
  
  // Estados de Autenticação e Dados
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterSource, setFilterSource] = useState('Todos');
  
  // Gráfico
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Modais
  const [modalVendaOpen, setModalVendaOpen] = useState(false);
  const [modalAgendaOpen, setModalAgendaOpen] = useState(false);
  const [modalDetailsOpen, setModalDetailsOpen] = useState(false);
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Inputs dos Modais
  const [valorVenda, setValorVenda] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  // --- 1. GUARDIÃO DE SEGURANÇA (FIREBASE) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || "");
        fetchLeads(); // Só busca dados se estiver logado
      } else {
        router.push("/login"); // Chuta pro login se não tiver usuário
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- 2. FUNÇÃO DE LOGOUT ---
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // --- 3. BUSCA DADOS ---
  const fetchLeads = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setLeads(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) {
        const interval = setInterval(fetchLeads, 10000); // Atualiza a cada 10s
        return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // --- 4. LÓGICA DE FILTROS ---
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (lead.telefone_lead || '').includes(searchTerm);
      const matchesStatus = filterStatus === 'Todos' || lead.status === filterStatus;
      const source = (lead.utm_source || 'Direto').toLowerCase();
      const matchesSource = filterSource === 'Todos' || source.includes(filterSource.toLowerCase());
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leads, searchTerm, filterStatus, filterSource]);

  // --- 5. DADOS GRÁFICO ---
  const chartData = useMemo(() => {
    const agrupado: Record<string, number> = {};
    filteredLeads.forEach(l => {
      if (l.status === 'Vendido') {
        const src = (l.utm_source || 'Direto').charAt(0).toUpperCase() + (l.utm_source || 'Direto').slice(1);
        agrupado[src] = (agrupado[src] || 0) + (l.valor_venda || 0);
      }
    });
    return Object.keys(agrupado)
      .map(k => ({ name: k, value: agrupado[k] }))
      .sort((a,b) => b.value - a.value);
  }, [filteredLeads]);

  // --- AÇÕES ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openAction = (lead: Lead, type: 'venda' | 'agenda' | 'detalhes') => {
    setSelectedLead(lead);
    if (type === 'venda') { setValorVenda(''); setModalVendaOpen(true); }
    if (type === 'agenda') { setDateInput(''); setTimeInput(''); setModalAgendaOpen(true); }
    if (type === 'detalhes') { setModalDetailsOpen(true); }
  };

  const handleSaveAgenda = () => {
    if (!dateInput || !timeInput) return;
    updateLeadStatus('Agendado', { data_agendamento: `${dateInput}T${timeInput}:00` });
  };

  const markAsLost = async (lead: Lead) => {
    if (!confirm("Tem certeza que deseja marcar este lead como PERDIDO?")) return;
    try {
        await fetch(`${API_URL}/${lead.id_unico}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Perdido', valor_venda: 0 }),
        });
        setLeads(prev => prev.map(l => l.id_unico === lead.id_unico ? { ...l, status: 'Perdido' } : l));
    } catch (error) { alert("Erro ao atualizar."); }
  };

  const updateLeadStatus = async (status: string, extraData: any = {}) => {
    if (!selectedLead) return;
    try {
        await fetch(`${API_URL}/${selectedLead.id_unico}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, ...extraData }),
        });
        fetchLeads();
        setModalVendaOpen(false);
        setModalAgendaOpen(false);
    } catch (error) { alert("Erro ao atualizar."); }
  };

  // --- TELA DE CARREGAMENTO (Enquanto verifica login) ---
  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );
  }

  // --- TEMAS ---
  const bg = darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const bgCard = darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textTitle = darkMode ? 'text-slate-100' : 'text-slate-900';
  const textSub = darkMode ? 'text-slate-400' : 'text-slate-500';
  const inputClass = darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400';

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bg}`}>
      
      {/* HEADER */}
      <header className={`${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-b px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm transition-colors duration-300`}>
        <div className="flex flex-col items-start">
            <img 
                src={darkMode ? "/logo-white.png" : "/logo.png"} 
                alt="ProfitLens" 
                className="h-[64px] w-auto object-contain transition-opacity duration-300"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
            />
            <div className="hidden flex items-center gap-2 text-indigo-600 mb-1">
                <TrendingUp size={32} />
                <span className={`font-bold text-2xl ${darkMode ? 'text-white' : 'text-slate-900'}`}>ProfitLens</span>
            </div>
        </div>

        <div className="flex items-center gap-4">
            
            {/* Botão Dark Mode */}
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title="Trocar Tema"
            >
                {darkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            {/* Botão Logout */}
            <button 
                onClick={handleLogout}
                className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-red-400 hover:bg-slate-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                title="Sair do Sistema"
            >
                <LogOut size={22} />
            </button>

            {/* Botão Atualizar */}
            <button onClick={fetchLeads} className={`text-base font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
                {loading && <Loader2 className="animate-spin" size={18} />}
                {loading ? "Sinc..." : "Atualizar"}
            </button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">
        
        {/* FILTROS MAIORES */}
        <div className={`p-6 rounded-3xl border flex flex-col md:flex-row gap-6 items-center justify-between shadow-sm transition-colors duration-300 ${bgCard}`}>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <Filter size={24} className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} />
                <span className={`font-bold text-base uppercase tracking-wide ${textSub}`}>Filtros Avançados</span>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar paciente..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`pl-12 pr-6 py-3 rounded-2xl border text-base w-full md:w-72 outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${inputClass}`}
                    />
                </div>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`px-6 py-3 rounded-2xl border text-base outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${inputClass}`}>
                    <option value="Todos">Status: Todos</option>
                    <option value="Novo">Novo</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Vendido">Vendido</option>
                    <option value="Perdido">Perdido</option>
                </select>

                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={`px-6 py-3 rounded-2xl border text-base outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${inputClass}`}>
                    <option value="Todos">Origem: Todas</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Google">Google</option>
                    <option value="Direto">Direto</option>
                </select>
            </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <KpiCard darkMode={darkMode} icon={<Users size={28}/>} title="Leads Filtrados" value={filteredLeads.length.toString()} color="blue" />
          <KpiCard darkMode={darkMode} icon={<CalendarClock size={28}/>} title="Agendados" value={filteredLeads.filter(l => l.status === 'Agendado').length.toString()} color="purple" />
          <KpiCard darkMode={darkMode} icon={<DollarSign size={28}/>} title="Faturamento" value={`R$ ${filteredLeads.reduce((acc, curr) => acc + (curr.valor_venda || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} color="green" />
          <KpiCard darkMode={darkMode} icon={<BarChart3 size={28}/>} title="Conversão" value={filteredLeads.length > 0 ? `${((filteredLeads.filter(l => l.status === 'Vendido').length / filteredLeads.length) * 100).toFixed(0)}%` : "0%"} color="orange" />
        </div>

        {/* GRÁFICOS E AGENDA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* GRÁFICO */}
            <div className={`lg:col-span-2 p-8 rounded-3xl border shadow-sm h-[450px] flex flex-col ${bgCard}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold flex items-center gap-3 ${textTitle}`}>
                        <span className="w-1.5 h-8 bg-indigo-500 rounded-full"></span> Origem das Vendas
                    </h3>
                    <div className={`flex p-1.5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                        <button onClick={() => setChartType('bar')} className={`p-2.5 rounded-lg transition-all ${chartType === 'bar' ? (darkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-indigo-600 shadow') : 'text-slate-400 hover:text-slate-500'}`}><BarIcon size={20} /></button>
                        <button onClick={() => setChartType('pie')} className={`p-2.5 rounded-lg transition-all ${chartType === 'pie' ? (darkMode ? 'bg-slate-700 text-white shadow' : 'bg-white text-indigo-600 shadow') : 'text-slate-400 hover:text-slate-500'}`}><PieIcon size={20} /></button>
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#f1f5f9'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 14}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 14}} tickFormatter={(v) => `R$${v/1000}k`} />
                                <Tooltip cursor={{fill: darkMode ? '#1e293b' : '#f8fafc'}} contentStyle={{backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#fff' : '#000', borderRadius: '12px'}} formatter={(val: any) => `R$ ${val.toLocaleString('pt-BR')}`} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50}>
                                    {chartData.map((e, i) => <Cell key={i} fill={i===0 ? '#4f46e5' : (darkMode ? '#64748b' : '#94a3b8')} />)}
                                </Bar>
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={5} dataKey="value">
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(val: any) => `R$ ${val.toLocaleString('pt-BR')}`} contentStyle={{backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px'}} />
                                <Legend wrapperStyle={{fontSize: '14px'}} />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AGENDA */}
            <div className={`p-8 rounded-3xl border shadow-sm flex flex-col h-[450px] ${bgCard}`}>
                <h3 className="text-xl font-bold mb-6 text-purple-600">Agenda Próxima</h3>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {filteredLeads.filter(l => l.status === 'Agendado').length === 0 && (
                        <div className={`flex flex-col items-center justify-center h-full ${textSub}`}>
                            <Calendar size={40} className="mb-3 opacity-20" />
                            <p className="text-base font-medium">Nenhum agendamento.</p>
                        </div>
                    )}
                    {filteredLeads.filter(l => l.status === 'Agendado')
                        .sort((a,b) => (a.data_agendamento || '').localeCompare(b.data_agendamento || ''))
                        .map(lead => (
                        <div key={lead.id_unico} className={`p-4 rounded-xl border transition-transform hover:scale-[1.02] ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-purple-50 border-purple-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`font-bold text-lg ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{lead.nome || "Paciente"}</span>
                                <span className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${darkMode ? 'bg-slate-900 text-purple-400 border-slate-700' : 'bg-white text-purple-600 border-purple-200'}`}>
                                    {lead.data_agendamento ? new Date(lead.data_agendamento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : '--/--'}
                                </span>
                            </div>
                            <div className={`flex items-center gap-2 text-sm ${textSub}`}>
                                <Clock size={16} />
                                {lead.data_agendamento ? new Date(lead.data_agendamento).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* GERADOR DE LINKS UTM (ADICIONADO) */}
        <div className={`p-8 rounded-3xl border shadow-sm ${bgCard} mb-8`}>
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textTitle}`}>
                <Hash className="text-indigo-500" /> Gerador de Links de Anúncio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                    type="text" 
                    placeholder="URL da sua Landing Page (ex: https://site.com/agendamento)" 
                    id="urlInput"
                    className={`md:col-span-2 p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                />
                <select id="sourceInput" className={`p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}>
                    <option value="instagram">Instagram Ads</option>
                    <option value="facebook">Facebook Ads</option>
                    <option value="google">Google Ads</option>
                    <option value="tiktok">TikTok Ads</option>
                </select>
                <input 
                    type="text" 
                    placeholder="Nome da Campanha (ex: botox_fevereiro)" 
                    id="campaignInput"
                    className={`p-4 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                />
                <button 
                    onClick={() => {
                        const url = (document.getElementById('urlInput') as HTMLInputElement).value;
                        const source = (document.getElementById('sourceInput') as HTMLSelectElement).value;
                        const campaign = (document.getElementById('campaignInput') as HTMLInputElement).value;
                        if(!url) return alert("Digite a URL da página!");
                        const finalLink = `${url}?utm_source=${source}&utm_campaign=${campaign || 'campanha_sem_nome'}&utm_content={{ad.name}}`;
                        navigator.clipboard.writeText(finalLink);
                        alert("Link gerado e copiado! Use o campo 'Parâmetros de URL' no Facebook.");
                    }}
                    className="md:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200"
                >
                    Gerar e Copiar Link para o Anúncio
                </button>
            </div>
        </div>

        {/* TABELA DE LEADS */}
        <div className={`rounded-3xl shadow-sm border overflow-hidden ${bgCard}`}>
            <div className={`px-8 py-6 border-b ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50/50'}`}>
                <h2 className={`font-bold uppercase text-sm tracking-widest ${textSub}`}>Fluxo de Pacientes</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead className={`${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'} uppercase tracking-wider text-xs font-bold`}>
                    <tr>
                        <th className="px-8 py-5">Entrada</th>
                        <th className="px-8 py-5">Paciente</th>
                        <th className="px-8 py-5">Origem / Anúncio</th> {/* COLUNA ATUALIZADA */}
                        <th className="px-8 py-5">Status / Agenda</th>
                        <th className="px-8 py-5 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {filteredLeads.map((lead) => (
                    <tr key={lead.id_unico} className={`transition-colors group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                        <td className={`px-8 py-6 ${textSub}`}>
                            <span className="text-base font-medium">{lead.data_legivel}</span>
                            <div className="text-xs opacity-50 font-mono mt-1">{lead.id_unico.slice(-6)}</div>
                        </td>
                        <td className="px-8 py-6">
                            <div className={`font-bold text-lg mb-1 ${textTitle}`}>{lead.nome || 'S/ Nome'}</div>
                            <div className="text-xs text-slate-400">{lead.telefone_lead}</div>
                        </td>
                        <td className="px-8 py-6">
                            <div className={`text-sm font-bold flex items-center gap-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                <ExternalLink size={14} /> {lead.utm_source || 'Direto'}
                            </div>
                            {/* EXIBIÇÃO DO CRIATIVO NA TABELA */}
                            <div className={`text-[11px] font-medium uppercase mt-1 flex items-center gap-1 ${textSub}`}>
                                <Video size={12} /> {lead.utm_content || 'Criativo não identificado'}
                            </div>
                        </td>
                        <td className="px-8 py-6">
                            <StatusBadge status={lead.status} darkMode={darkMode} />
                            {lead.status === 'Agendado' && lead.data_agendamento && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-500 font-bold">
                                    <Clock size={14} />
                                    {new Date(lead.data_agendamento).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                        </td>
                        <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openAction(lead, 'detalhes')} className={`p-3 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                    <Eye size={20} />
                                </button>
                                {lead.status !== 'Vendido' && lead.status !== 'Perdido' ? (
                                    <>
                                        <button onClick={() => openAction(lead, 'agenda')} className={`p-3 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:text-purple-400 hover:bg-slate-700' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}><CalendarDays size={20} /></button>
                                        <button onClick={() => openAction(lead, 'venda')} className={`p-3 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:text-green-400 hover:bg-slate-700' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'}`}><CheckCircle size={20} /></button>
                                        <button onClick={() => markAsLost(lead)} className={`p-3 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}><XCircle size={20} /></button>
                                    </>
                                ) : lead.status === 'Vendido' ? (
                                    <span className={`font-bold px-4 py-2 rounded-full border text-xs ${darkMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                        R$ {lead.valor_venda?.toLocaleString('pt-BR')}
                                    </span>
                                ) : (
                                    <span className="text-red-400 font-bold text-xs pr-2">PERDIDO</span>
                                )}
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      </main>

      {/* --- MODAIS (DETALHES) --- */}
      {modalDetailsOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
            <div className={`rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                <div className="bg-indigo-600 p-8 text-white relative">
                    <button onClick={() => setModalDetailsOpen(false)} className="absolute top-6 right-6 text-indigo-200 hover:text-white"><XCircle size={24} /></button>
                    <h3 className="text-2xl font-bold leading-tight">{selectedLead.nome || "Lead Detalhado"}</h3>
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-2">ID: {selectedLead.id_unico.slice(-8)}</p>
                </div>
                <div className="p-8 space-y-6">
                    <div className={`flex items-center justify-between p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">WhatsApp</p>
                            <p className={`text-xl font-bold ${textTitle}`}>{selectedLead.telefone_lead}</p>
                        </div>
                        <button onClick={() => copyToClipboard(selectedLead.telefone_lead)} className={`p-4 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : (darkMode ? 'bg-slate-700 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm border')}`}>
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <DetailCard darkMode={darkMode} icon={<Video size={18}/>} label="Criativo" value={selectedLead.utm_content || "Direto"} />
                        <DetailCard darkMode={darkMode} icon={<ExternalLink size={18}/>} label="Origem" value={selectedLead.utm_source || "Direto"} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <DetailCard darkMode={darkMode} icon={<Stethoscope size={18}/>} label="Tratamento" value={selectedLead.tipo_tratamento || "Consulta"} />
                        <DetailCard darkMode={darkMode} icon={<Hash size={18}/>} label="Campanha" value={selectedLead.utm_campaign || "N/A"} />
                    </div>
                    <button onClick={() => window.open(`https://wa.me/${selectedLead.telefone_lead.replace(/\D/g,'')}`, '_blank')} className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 text-lg">
                        <Phone size={24} /> Chamar no WhatsApp
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal Agenda */}
      {modalAgendaOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className={`rounded-3xl shadow-2xl p-8 w-full max-w-sm ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-6 ${textTitle}`}>📅 Agendar</h3>
            <div className="space-y-4 mb-8">
                <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className={`w-full rounded-2xl p-4 outline-none focus:ring-2 focus:ring-purple-500 text-lg border ${inputClass}`} />
                <input type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} className={`w-full rounded-2xl p-4 outline-none focus:ring-2 focus:ring-purple-500 text-lg border ${inputClass}`} />
            </div>
            <div className="flex flex-col gap-3">
                <button onClick={handleSaveAgenda} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg">Confirmar</button>
                <button onClick={() => setModalAgendaOpen(false)} className="w-full py-3 text-slate-400 font-medium hover:text-slate-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Venda */}
      {modalVendaOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className={`rounded-3xl shadow-2xl p-8 w-full max-w-sm ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-6 ${textTitle}`}>💰 Confirmar Venda</h3>
            <input type="number" value={valorVenda} onChange={(e) => setValorVenda(e.target.value)} className={`w-full rounded-2xl p-4 text-3xl font-bold outline-none focus:ring-2 focus:ring-green-500 mb-8 text-center border ${inputClass}`} placeholder="0.00" />
            <div className="flex flex-col gap-3">
                <button onClick={() => updateLeadStatus('Vendido', { valor_venda: parseFloat(valorVenda) })} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg">Confirmar</button>
                <button onClick={() => setModalVendaOpen(false)} className="w-full py-3 text-slate-400 font-medium hover:text-slate-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: ${darkMode ? '#475569' : '#cbd5e1'}; border-radius: 20px; }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENTES ADAPTADOS ---
function DetailCard({ icon, label, value, darkMode }: any) {
    return (
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-2 mb-2 text-slate-400">
                {icon} <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{value}</p>
        </div>
    );
}

function KpiCard({ icon, title, value, color, darkMode }: any) {
    const styles: any = { 
        blue: darkMode ? "text-blue-400 bg-blue-900/30" : "text-blue-600 bg-blue-50", 
        green: darkMode ? "text-green-400 bg-green-900/30" : "text-green-600 bg-blue-50", 
        purple: darkMode ? "text-purple-400 bg-purple-900/30" : "text-purple-600 bg-purple-50", 
        orange: darkMode ? "text-orange-400 bg-orange-900/30" : "text-orange-600 bg-orange-50" 
    };
    return (
        <div className={`p-8 rounded-2xl border shadow-sm flex items-center gap-6 hover:shadow-md transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`p-5 rounded-xl ${styles[color]}`}>{icon}</div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mb-1">{title}</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>{value}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status, darkMode }: { status: string, darkMode: boolean }) {
    const styles: any = { 
        'Novo': darkMode ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200', 
        'Agendado': darkMode ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-200', 
        'Vendido': darkMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-600 border-green-200', 
        'Perdido': darkMode ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200' 
    };
    return <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status]}`}>{status}</span>;
}

function CalendarClock(props: any) { return <div className="relative"><Calendar {...props} /><Clock size={12} className="absolute -bottom-1 -right-1 rounded-full text-current bg-transparent" /></div> }