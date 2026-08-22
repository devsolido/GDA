
import { turmas, checklistItems } from './data.js';
import { loadData, saveData } from './storage.js';
const APP_ID = '1BF3914F-116E-4BD6-BA55-D9720E1219C7';
const API_KEY = 'C3CEF6C4-9697-49FC-BFF2-F99A95A9855A';
const USUARIO = 'igor_veras';
Backendless.initApp(APP_ID, API_KEY);
let atividades = loadData('gda_atividades', []);
let notas = loadData('gda_notas', {});
let relatorios = loadData('gda_relatorios', []);
let checklistState = loadData('gda_checklist', {});
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
window.atividades = atividades;
window.notas = notas;
window.relatorios = relatorios;
window.checklistState = checklistState;
window.turmas = turmas;
window.checklistItems = checklistItems;
window.loadData = loadData;
window.saveData = saveData;
console.log('🚀 GDA Acadêmico v3.0 carregado!');
console.log('📋 Usuário:', USUARIO);
console.log('📊 Dados carregados com sucesso!');
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
