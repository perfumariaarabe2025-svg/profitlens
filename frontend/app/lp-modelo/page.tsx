"use client";

import React, { useState } from 'react';
import { 
  Phone, MapPin, Star, ShieldCheck, Award, CheckCircle, ArrowRight, Smile, Activity, Sparkles, X
} from 'lucide-react';

// --- CONFIGURAÇÃO ---
const API_URL = "https://profitlens-api.onrender.com/track";
const CLINICA_ID = "clinica_odonto_01";
const WHATSAPP_NUMBER = "5511999999999"; 

export default function DentalLuxuryPage() {
  const [formData, setFormData] = useState({ nome: '', telefone: '', interesse: '' });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Estado para o Popup

  // --- LÓGICA DE RASTREIO (UTMs) ---
  const getUTMs = () => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || 'direto',
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
    };
  };

  const generateFingerprint = () => {
    return 'lead_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  };

  // --- ENVIO DO FORMULÁRIO ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id_unico: generateFingerprint(),
      user_id: CLINICA_ID,
      timestamp: new Date().toISOString(),
      status: 'Novo',
      nome: formData.nome, 
      telefone_lead: formData.telefone,
      tipo_tratamento: formData.interesse,
      ...getUTMs()
    };

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // SUCESSO: Limpa o form e mostra o Popup bonito
      setFormData({ nome: '', telefone: '', interesse: '' });
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro de conexão. Tente pelo botão do WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const payload = {
      id_unico: generateFingerprint(),
      user_id: CLINICA_ID,
      timestamp: new Date().toISOString(),
      status: 'Novo',
      nome: "Visitante pelo WhatsApp",
      ...getUTMs()
    };
    
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) navigator.sendBeacon(API_URL, blob);
    else fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Olá, gostaria de avaliar meu sorriso.`, '_blank');
  };

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-sky-100 selection:text-sky-900">
      
      {/* 1. CABEÇALHO (NAVBAR) */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sky-700">
            <Smile size={32} strokeWidth={2.5} />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold tracking-tight text-slate-900">ODONTO</span>
              <span className="text-xs font-semibold tracking-[0.2em] text-sky-600">PREMIER</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppClick}
            className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-all shadow-lg shadow-sky-200"
          >
            <Phone size={16} /> Agendar Avaliação
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION (ODONTO) */}
      <section className="pt-36 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-sky-50/50 rounded-bl-[100px] -z-10"></div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          
          {/* Copywriting */}
          <div className="space-y-6 animate-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-sky-100 text-sky-700 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles size={14} /> Sorrisos de Alto Padrão
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1]">
              O sorriso que você <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-500">sempre sonhou</span> está aqui.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
              Especialistas em Implantes e Lentes de Contato Dental. 
              Tecnologia digital sem dor, previsibilidade e resultados naturais.
            </p>
            
            {/* PROVA SOCIAL COM IMAGENS REAIS */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-4">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Paciente" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Paciente" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Paciente" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                    +2k
                </div>
              </div>
              <div className="text-sm">
                <div className="flex text-amber-400 mb-0.5"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <p className="text-slate-500 font-medium">Pacientes satisfeitos</p>
              </div>
            </div>
          </div>

          {/* Formulário Odonto */}
          <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 relative animate-in slide-in-from-right duration-700 delay-100">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100 rounded-bl-full -z-0 opacity-50"></div>
            
            <h3 className="text-xl font-bold mb-2 text-slate-800">Agende seu Check-up Digital</h3>
            <p className="text-sm text-slate-500 mb-6">Condições especiais para Implantes e Invisalign.</p>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Nome do Paciente</label>
                <input 
                  required type="text" placeholder="Nome completo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                  value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Celular / WhatsApp</label>
                <input 
                  required type="tel" placeholder="(11) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                  value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">Tratamento de Interesse</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                  value={formData.interesse} onChange={e => setFormData({...formData, interesse: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  <option value="Implantes">Implantes Dentários (Carga Imediata)</option>
                  <option value="Lentes">Lentes de Contato / Facetas</option>
                  <option value="Invisalign">Invisalign (Aparelho Invisível)</option>
                  <option value="Clareamento">Clareamento / Limpeza</option>
                  <option value="Dor">Emergência / Dor de Dente</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 flex justify-center items-center gap-2"
              >
                {loading ? "Processando..." : <>Quero Agendar Agora <ArrowRight size={18} /></>}
              </button>
            </form>
            <p className="text-center text-[10px] text-slate-400 mt-4 flex justify-center items-center gap-1 uppercase tracking-wider">
              <ShieldCheck size={12} /> Seus dados médicos estão protegidos
            </p>
          </div>
        </div>
      </section>

      {/* 3. DIFERENCIAIS CLÍNICOS */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Por que a Odonto Premier?</h2>
            <div className="w-16 h-1.5 bg-sky-500 mx-auto rounded-full"></div>
            <p className="mt-4 text-slate-500">Unimos ciência, arte e tecnologia para o seu sorriso.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="text-sky-600" size={32} />}
              title="Scanner Intraoral 3D"
              text="Diga adeus às massinhas. Moldagem digital precisa e confortável em segundos."
            />
            <FeatureCard 
              icon={<Award className="text-sky-600" size={32} />}
              title="Implantes Suíços"
              text="Trabalhamos com Straumann, a melhor marca de implantes do mundo. Cicatrização rápida."
            />
            <FeatureCard 
              icon={<Star className="text-sky-600" size={32} />}
              title="Lentes em Porcelana"
              text="Design do sorriso feito em computador para um resultado natural e harmônico."
            />
          </div>
        </div>
      </section>

      {/* 4. RODAPÉ */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-2 text-white mb-4">
              <Smile size={24} />
              <span className="text-lg font-bold">ODONTO PREMIER</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Resp. Técnico: Dr. Estranho CRO/SP 12345. <br/>
              Especialistas em devolver a função mastigatória e a estética do seu sorriso.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={16} className="text-sky-500" /> Av. Faria Lima, 2000 - São Paulo, SP
            </div>
          </div>
          <div className="text-right">
            <button 
              onClick={handleWhatsAppClick}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-900/30"
            >
              <Phone size={20} /> Agendar via WhatsApp
            </button>
            <p className="mt-4 text-xs text-slate-600">Atendimento: Seg a Sex das 08h às 19h.</p>
          </div>
        </div>
      </footer>

      {/* BOTÃO FLUTUANTE */}
      <button 
        onClick={handleWhatsAppClick}
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:shadow-green-500/50 transition-all z-40 animate-bounce"
        title="Falar no WhatsApp"
      >
        <Phone size={28} fill="currentColor" />
      </button>

      {/* --- POPUP DE SUCESSO (MODAL) --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm text-center relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <CheckCircle size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">Sucesso!</h3>
            <p className="text-slate-600 mb-6">
              Pré-agendamento recebido! Nossa recepção vai te chamar no WhatsApp em instantes.
            </p>
            
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

// Componente Card
function FeatureCard({ icon, title, text }: any) {
  return (
    <div className="p-8 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-sky-100 transition-all duration-300 group border border-slate-100">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-sky-50 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-sky-700 transition-colors">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
    </div>
  );
}