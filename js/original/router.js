
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
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`page-${pageId}`);
        if (target) target.classList.add('active');
        document.querySelectorAll('.navbar a[data-page]').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });
        window.history.pushState({ page: pageId }, '', '#${pageId}');
    }
    init() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'dashboard';
            const page = this.pages[hash] || this.pages['dashboard'];
            page();
        });
        document.querySelectorAll('.navbar a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                window.location.hash = page;
            });
        });
        const hash = window.location.hash.slice(1) || 'dashboard';
        const page = this.pages[hash] || this.pages['dashboard'];
        page();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new GDAApp();
});
