// ===== CONFIGURAÇÃO PRINCIPAL =====
import { turmas, checklistItems } from './data.js';
import { loadData, saveData } from './storage.js';

const APP_ID = '1BF3914F-116E-4BD6-BA55-D9720E1219C7';
const API_KEY = 'C3CEF6C4-9697-49FC-BFF2-F99A95A9855A';
const USUARIO = 'igor_veras';

Backendless.initApp(APP_ID, API_KEY);

// ===== ESTADO GLOBAL =====
let atividades = loadData('gda_atividades', []);
let notas = loadData('gda_notas', {});
let relatorios = loadData('gda_relatorios', []);
let checklistState = loadData('gda_checklist', {});

// ===== FUNÇÕES DE INICIALIZAÇÃO =====
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

// ===== EXPORTA FUNÇÕES GLOBAIS =====
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
