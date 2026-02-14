/**
 * PROFITLENS TRACKER v2.0 (Persistente)
 * Funcionalidade: Salva UTMs ao carregar a página e recupera ao clicar.
 */

(function (window, document) {
    'use strict';

    // CONFIGURAÇÃO (Em produção, mude para a URL do seu Backend na Nuvem)
    const API_URL = "http://127.0.0.1:8000/track"; 
    const CLIENT_ID = "clinica_demo_01"; // ID do cliente (pode ser dinâmico)

    const Tracker = {
        // 1. Gera ou recupera o ID do visitante
        getFingerprint: function () {
            let fp = localStorage.getItem('pl_fingerprint');
            if (!fp) {
                fp = 'fp_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
                localStorage.setItem('pl_fingerprint', fp);
            }
            return fp;
        },

        // 2. Salva as UTMs assim que o site carrega (O SEGREDO DO ROI)
        saveUTMs: function () {
            const params = new URLSearchParams(window.location.search);
            // Só sobrescreve se tiver UTMs novas na URL
            if (params.has('utm_source')) {
                const utmData = {
                    utm_source: params.get('utm_source'),
                    utm_medium: params.get('utm_medium'),
                    utm_campaign: params.get('utm_campaign'),
                    utm_content: params.get('utm_content'),
                    utm_term: params.get('utm_term'),
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem('pl_utms', JSON.stringify(utmData));
                console.log("💾 ProfitLens: UTMs salvas no navegador", utmData);
            }
        },

        // 3. Recupera as UTMs salvas (ou usa 'direto' se não tiver nada)
        getStoredUTMs: function () {
            const stored = localStorage.getItem('pl_utms');
            if (stored) {
                return JSON.parse(stored);
            }
            return {
                utm_source: 'direto',
                utm_medium: null,
                utm_campaign: null
            };
        },

        // 4. Envia para o Backend
        sendEvent: function (eventName, additionalData = {}) {
            const utms = this.getStoredUTMs();
            
            const payload = {
                id_unico: this.getFingerprint(),
                user_id: CLIENT_ID,
                timestamp: new Date().toISOString(),
                status: 'Novo', // Status inicial padrão
                ...utms, // Espalha as UTMs recuperadas
                ...additionalData
            };

            console.log("📡 Enviando Lead:", payload);

            // Tenta usar sendBeacon (melhor performance), senão usa fetch
            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(API_URL, blob);
            } else {
                fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true // Importante para não cancelar se mudar de página
                }).catch(err => console.error("Erro Tracker:", err));
            }
        },

        // 5. Inicializa os ouvintes
        init: function () {
            this.saveUTMs(); // Passo 1: Salva quem acabou de chegar
            
            // Passo 2: Ouve cliques em links de WhatsApp
            document.addEventListener('click', (e) => {
                // Procura o elemento clicado ou o pai dele (caso clique no ícone dentro do botão)
                const target = e.target.closest('a, button');
                
                if (target) {
                    const href = (target.getAttribute('href') || '').toLowerCase();
                    const isWhatsApp = href.includes('wa.me') || href.includes('whatsapp.com') || href.includes('api.whatsapp');
                    
                    if (isWhatsApp) {
                        this.sendEvent('whatsapp_click', {
                            telefone_lead: 'click_wpp' // No futuro podemos tentar capturar do href
                        });
                    }
                }
            });
        }
    };

    // Inicia quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Tracker.init());
    } else {
        Tracker.init();
    }

})(window, document);