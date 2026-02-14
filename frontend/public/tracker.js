/**
 * PROFITLENS TRACKER v2.1 (Persistente + Rastreio de Criativo)
 * Funcionalidade: Captura UTMs, armazena no navegador e envia para o backend.
 */

(function (window, document) {
    'use strict';

    // CONFIGURAÇÃO (URL do seu Backend no Render)
    const API_URL = "https://profitlens-api.onrender.com/track"; 
    const CLIENT_ID = "clinica_demo_01"; 

    const Tracker = {
        // 1. Gera ou recupera o ID único do navegador (Fingerprint)
        getFingerprint: function () {
            let fp = localStorage.getItem('pl_fingerprint');
            if (!fp) {
                fp = 'fp_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
                localStorage.setItem('pl_fingerprint', fp);
            }
            return fp;
        },

        // 2. Salva as UTMs da URL no LocalStorage para não perder a origem
        saveUTMs: function () {
            const params = new URLSearchParams(window.location.search);
            
            // Só salva se houver pelo menos uma origem identificada
            if (params.has('utm_source')) {
                const utmData = {
                    utm_source: params.get('utm_source'),
                    utm_medium: params.get('utm_medium') || '',
                    utm_campaign: params.get('utm_campaign') || 'sem_nome',
                    utm_content: params.get('utm_content') || 'sem_criativo', // O NOME DO ANÚNCIO/CRIATIVO
                    utm_term: params.get('utm_term') || '',
                    timestamp: new Date().toISOString(),
                    referencia_url: window.location.href // Salva em qual LP ele estava
                };
                localStorage.setItem('pl_utms', JSON.stringify(utmData));
                console.log("💾 ProfitLens: Origem rastreada e salva!", utmData);
            }
        },

        // 3. Recupera os dados salvos ou define como "Direto"
        getStoredUTMs: function () {
            const stored = localStorage.getItem('pl_utms');
            if (stored) {
                return JSON.parse(stored);
            }
            return {
                utm_source: 'direto',
                utm_medium: 'organico',
                utm_campaign: 'acesso_direto',
                utm_content: 'nenhum' // Criativo vazio para acessos diretos
            };
        },

        // 4. Dispara os dados para o seu sistema
        sendEvent: function (eventName, additionalData = {}) {
            const utms = this.getStoredUTMs();
            
            const payload = {
                id_unico: this.getFingerprint(),
                user_id: CLIENT_ID,
                timestamp: new Date().toISOString(),
                status: 'Novo', 
                página_origem: window.location.pathname, // Ex: /agendamento
                ...utms, 
                ...additionalData
            };

            console.log("📡 ProfitLens: Enviando Lead para o Dashboard...", payload);

            // Tenta usar sendBeacon (mais rápido), senão usa fetch normal
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                navigator.sendBeacon(API_URL, blob);
            } else {
                fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).catch(err => console.error("❌ Erro ao enviar lead:", err));
            }
        },

        // 5. Liga os sensores do site
        init: function () {
            this.saveUTMs(); 
            
            // Monitora cliques em botões de WhatsApp
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button');
                
                if (target) {
                    const href = (target.getAttribute('href') || '').toLowerCase();
                    const isWhatsApp = href.includes('wa.me') || href.includes('whatsapp.com') || href.includes('api.whatsapp');
                    
                    if (isWhatsApp) {
                        // Captura o telefone se estiver no link, senão envia flag de clique
                        const telMatch = href.match(/phone=([0-9]+)/);
                        const telefoneDestino = telMatch ? telMatch[1] : 'click_wpp';

                        this.sendEvent('whatsapp_click', {
                            telefone_lead: telefoneDestino,
                            tipo_tratamento: document.title // Usa o título da página como tipo de tratamento
                        });
                    }
                }
            });
        }
    };

    // Inicialização segura
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Tracker.init());
    } else {
        Tracker.init();
    }

})(window, document);