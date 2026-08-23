import { turmas, checklistItems } from './data.js';
import { loadData, saveData, syncAllData } from './storage.js';

// Usuário fixo (depois pode vir do login)
const USUARIO = 'igor_veras';

// Dados globais
let atividades = [];
let notas = {};
let relatorios = [];
let checklistState = {};

// Inicialização assíncrona
async function initApp() {
    console.log('🚀 Carregando dados...');
    
    // Carregar dados
    atividades = await loadData('gda_atividades', []);
    notas = await loadData('gda_notas', {});
    relatorios = await loadData('gda_relatorios', []);
    checklistState = await loadData('gda_checklist', {});
    
    // Inicializar checklist
    initChecklist();
    
    // Inicializar atividades padrão
    initAtividades();
    
    // Expor no window
    window.atividades = atividades;
    window.notas = notas;
    window.relatorios = relatorios;
    window.checklistState = checklistState;
    window.turmas = turmas;
    window.checklistItems = checklistItems;
    window.loadData = loadData;
    window.saveData = saveData;
    window.syncAllData = syncAllData;
    
    console.log('🚀 GDA Acadêmico v3.0 carregado!');
    console.log('📋 Usuário:', USUARIO);
    console.log('📊 Dados carregados com sucesso!');
}

function initChecklist() {
    checklistItems.forEach(item => {
        if (checklistState[item.id] === undefined) {
            checklistState[item.id] = false;
        }
    });
    saveData('gda_checklist', checklistState);
}

function initAtividades() {
    if (atividades.length === 0) {
        atividades = [{
            id: Date.now() + 1,
            titulo: 'Seminário sobre Saneamento',
            tipo: 'grupo',
            prioridade: 'alta',
            disciplina: 'FUNDAMENTOS DE SANEAMENTO E SAÚDE PÚBLICA',
            inicio: '2026-08-01',
            prazo: '2026-08-10',
            entregaDocente: '2026-08-12',
            subtarefas: [
                { descricao: 'Pesquisa bibliográfica', concluido: true },
                { descricao: 'Elaboração dos slides', concluido: true },
                { descricao: 'Ensaio da apresentação', concluido: false }
            ],
            observacoes: 'Apresentação de 20 min sobre saneamento básico',
            progresso: 67
        }];
        saveData('gda_atividades', atividades);
    }
}

// Iniciar
initApp();

// Função auxiliar para mostrar mensagens (mantida)
function mostrarMensagemSegura(mensagem, tipo = 'info') {
    const mensagemSegura = sanitizeHTML ? sanitizeHTML(String(mensagem)) : String(mensagem);
    if (typeof alert !== 'undefined') {
        console.log(`[${tipo}] ${mensagemSegura}`);
        return;
    }
    const div = document.createElement('div');
    div.textContent = mensagemSegura;
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${tipo === 'erro' ? '#dc3545' : tipo === 'sucesso' ? '#28a745' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 9999;
        max-width: 400px;
        font-family: system-ui, sans-serif;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}
