// ===== SISTEMA DE ROTAS =====
class GDAApp {
    constructor() {
        this.pages = {
            'dashboard': () => this.showPage('dashboard'),
            'checklist': () => this.showPage('checklist'),
            'turmas': () => this.showPage('turmas'),
            'atividades': () => this.showPage('atividades'),
            'notas': () => this.showPage('notas'),
            'relatorios': () => this.showPage('relatorios'),
        };
        this.init();
    }

    showPage(pageId) {
        // Esconde todas
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        
        // Mostra a página
        const target = document.getElementById(page-);
        if (target) target.classList.add('active');

        // Atualiza menu
        document.querySelectorAll('.navbar a[data-page]').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });

        // Atualiza URL
        window.history.pushState({ page: pageId }, '', #);
    }

    init() {
        // Evento de hashchange
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            const page = this.pages[hash] || this.pages['dashboard'];
            page();
        });

        // Clique nos links
        document.querySelectorAll('.navbar a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                window.location.hash = page;
            });
        });

        // Carrega página inicial
        const hash = window.location.hash.slice(1) || 'dashboard';
        const page = this.pages[hash] || this.pages['dashboard'];
        page();
    }
}

// Inicializa
document.addEventListener('DOMContentLoaded', () => {
    new GDAApp();
});
