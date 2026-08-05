const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// ============================================================
// CONFIGURAÇÃO
// ============================================================
const db = new Database('database/gda.db');

// ============================================================
// FUNÇÕES PARA LER DO localStorage (via arquivo JSON)
// ============================================================

// Função para ler dados do arquivo de exportação do localStorage
function lerDadosLocalStorage() {
    // Se você exportou os dados do localStorage para um arquivo JSON
    const arquivoExport = 'localstorage-export.json';
    
    if (fs.existsSync(arquivoExport)) {
        console.log('📂 Lendo arquivo de exportação...');
        return JSON.parse(fs.readFileSync(arquivoExport, 'utf8'));
    }
    
    // Caso contrário, dados padrão (vazio)
    console.log('⚠️ Arquivo localstorage-export.json não encontrado. Usando dados vazios.');
    return {};
}

// ============================================================
// MIGRAÇÃO
// ============================================================

function migrarDados() {
    console.log('🔄 Iniciando migração...\n');
    
    // Ler dados
    const dados = lerDadosLocalStorage();
    
    // ============================================================
    // 1. MIGRAR PRESENÇAS
    // ============================================================
    console.log('📋 Migrando presenças...');
    const presencas = dados.gda_presencas || [];
    const insertPresenca = db.prepare(`
        INSERT OR REPLACE INTO presencas 
        (id, data, hora, tipo, justificativa, nome, curso, atestado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyPresencas = db.transaction((items) => {
        for (const p of items) {
            insertPresenca.run(
                p.id || `local_${Date.now()}_${Math.random()}`,
                p.data || '',
                p.hora || '',
                p.tipo || 'presente',
                p.justificativa || '',
                p.nome || 'Igor Veras Morais',
                p.curso || 'Controle Ambiental - 2º Sem',
                p.atestado ? 1 : 0
            );
        }
    });
    
    if (presencas.length > 0) {
        insertManyPresencas(presencas);
        console.log(`✅ ${presencas.length} presenças migradas`);
    } else {
        console.log('ℹ️ Nenhuma presença para migrar');
    }
    
    // ============================================================
    // 2. MIGRAR PRESENÇAS ATRASADAS
    // ============================================================
    console.log('⏰ Migrando presenças atrasadas...');
    const presencasAtrasadas = dados.gda_presencas_atrasadas || [];
    const insertAtrasada = db.prepare(`
        INSERT OR REPLACE INTO presencas_atrasadas 
        (id, data, hora, tipo, justificativa, usuario, registrado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyAtrasadas = db.transaction((items) => {
        for (const p of items) {
            insertAtrasada.run(
                p.id || `local_${Date.now()}_${Math.random()}`,
                p.data || '',
                p.hora || '',
                p.tipo || 'presente',
                p.justificativa || '',
                p.usuario || 'Igor Veras Morais',
                p.registrado_em || new Date().toISOString().split('T')[0]
            );
        }
    });
    
    if (presencasAtrasadas.length > 0) {
        insertManyAtrasadas(presencasAtrasadas);
        console.log(`✅ ${presencasAtrasadas.length} presenças atrasadas migradas`);
    } else {
        console.log('ℹ️ Nenhuma presença atrasada para migrar');
    }
    
    // ============================================================
    // 3. MIGRAR OCORRÊNCIAS
    // ============================================================
    console.log('📝 Migrando ocorrências...');
    const ocorrencias = dados.gda_ocorrencias || [];
    const insertOcorrencia = db.prepare(`
        INSERT OR REPLACE INTO ocorrencias 
        (id, data, disciplina, tipo, descricao, para_coordenacao, usuario, registrado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyOcorrencias = db.transaction((items) => {
        for (const o of items) {
            insertOcorrencia.run(
                o.id || `local_${Date.now()}_${Math.random()}`,
                o.data || '',
                o.disciplina || '',
                o.tipo || 'outros',
                o.descricao || '',
                o.para_coordenacao ? 1 : 0,
                o.usuario || 'Igor Veras Morais',
                o.registrado_em || new Date().toISOString().split('T')[0]
            );
        }
    });
    
    if (ocorrencias.length > 0) {
        insertManyOcorrencias(ocorrencias);
        console.log(`✅ ${ocorrencias.length} ocorrências migradas`);
    } else {
        console.log('ℹ️ Nenhuma ocorrência para migrar');
    }
    
    // ============================================================
    // 4. MIGRAR ATIVIDADES
    // ============================================================
    console.log('📚 Migrando atividades...');
    const atividades = dados.gda_atividades || [];
    const insertAtividade = db.prepare(`
        INSERT OR REPLACE INTO atividades 
        (id, titulo, tipo, prioridade, disciplina, inicio, prazo, entregaDocente, 
         observacoes, participantes, subtarefas, progresso)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyAtividades = db.transaction((items) => {
        for (const a of items) {
            insertAtividade.run(
                a.id || `local_${Date.now()}_${Math.random()}`,
                a.titulo || 'Sem título',
                a.tipo || 'individual',
                a.prioridade || 'media',
                a.disciplina || '',
                a.inicio || '',
                a.prazo || '',
                a.entregaDocente || '',
                a.observacoes || '',
                JSON.stringify(a.participantes || []),
                JSON.stringify(a.subtarefas || []),
                a.progresso || 0
            );
        }
    });
    
    if (atividades.length > 0) {
        insertManyAtividades(atividades);
        console.log(`✅ ${atividades.length} atividades migradas`);
    } else {
        console.log('ℹ️ Nenhuma atividade para migrar');
    }
    
    // ============================================================
    // 5. MIGRAR NOTAS
    // ============================================================
    console.log('📊 Migrando notas...');
    const notas = dados.gda_notas || {};
    const insertNota = db.prepare(`
        INSERT OR REPLACE INTO notas 
        (disciplina_cod, disciplina_nome, b1, b2, b3, b4)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyNotas = db.transaction((items) => {
        for (const [cod, nota] of Object.entries(items)) {
            // Buscar nome da disciplina
            const turma = (dados.turmas_padrao || []).find(t => t.cod === cod);
            insertNota.run(
                cod,
                turma ? turma.nome : cod,
                parseFloat(nota.b1) || 0,
                parseFloat(nota.b2) || 0,
                parseFloat(nota.b3) || 0,
                parseFloat(nota.b4) || 0
            );
        }
    });
    
    if (Object.keys(notas).length > 0) {
        insertManyNotas(notas);
        console.log(`✅ ${Object.keys(notas).length} notas migradas`);
    } else {
        console.log('ℹ️ Nenhuma nota para migrar');
    }
    
    // ============================================================
    // 6. MIGRAR RELATÓRIOS
    // ============================================================
    console.log('📖 Migrando relatórios...');
    const relatorios = dados.gda_relatorios || [];
    const insertRelatorio = db.prepare(`
        INSERT OR REPLACE INTO relatorios 
        (id, data, disciplina, tempo, texto)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const insertManyRelatorios = db.transaction((items) => {
        for (const r of items) {
            insertRelatorio.run(
                r.id || `local_${Date.now()}_${Math.random()}`,
                r.data || '',
                r.disciplina || '',
                r.tempo || 0,
                r.texto || ''
            );
        }
    });
    
    if (relatorios.length > 0) {
        insertManyRelatorios(relatorios);
        console.log(`✅ ${relatorios.length} relatórios migrados`);
    } else {
        console.log('ℹ️ Nenhum relatório para migrar');
    }
    
    // ============================================================
    // 7. MIGRAR CHECKLIST
    // ============================================================
    console.log('✅ Migrando checklist...');
    const checklist = dados.gda_checklist || {};
    const insertChecklist = db.prepare(`
        INSERT OR REPLACE INTO checklist 
        (id, label, icon, concluido)
        VALUES (?, ?, ?, ?)
    `);
    
    const itemsChecklist = [
        { id: 'linkedin', label: 'Verificar LinkedIn', icon: 'fab fa-linkedin' },
        { id: 'gupy', label: 'Gupy - Vaga Aprendiz Home Office', icon: 'fas fa-briefcase' },
        { id: 'sigaa', label: 'Verificar SIGAA (notas/frequência)', icon: 'fas fa-university' },
        { id: 'calendario', label: 'Verificar calendário e compromissos', icon: 'fas fa-calendar-alt' },
        { id: 'intercambios', label: 'Intercâmbios - Oportunidades', icon: 'fas fa-globe-americas' },
        { id: 'ingles', label: 'Estudar Inglês (30 min)', icon: 'fas fa-language' }
    ];
    
    const insertManyChecklist = db.transaction((items) => {
        for (const item of items) {
            const concluido = checklist[item.id] === true ? 1 : 0;
            insertChecklist.run(item.id, item.label, item.icon, concluido);
        }
    });
    
    insertManyChecklist(itemsChecklist);
    console.log(`✅ ${itemsChecklist.length} itens do checklist migrados`);
    
    // ============================================================
    // 8. MIGRAR HISTÓRICO PÂNICO
    // ============================================================
    console.log('🚨 Migrando histórico pânico...');
    const historicoPanico = dados.gda_historico_panico || [];
    const insertPanico = db.prepare(`
        INSERT OR REPLACE INTO historico_panico 
        (id, data, hora, disciplina, motivo, resolvido)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyPanico = db.transaction((items) => {
        for (const h of items) {
            insertPanico.run(
                h.id || `local_${Date.now()}_${Math.random()}`,
                h.data || '',
                h.hora || '',
                h.disciplina || '',
                h.motivo || '',
                h.resolvido ? 1 : 0
            );
        }
    });
    
    if (historicoPanico.length > 0) {
        insertManyPanico(historicoPanico);
        console.log(`✅ ${historicoPanico.length} registros de pânico migrados`);
    } else {
        console.log('ℹ️ Nenhum registro de pânico para migrar');
    }
    
    // ============================================================
    // 9. MIGRAR ATENDIMENTOS
    // ============================================================
    console.log('🤝 Migrando atendimentos...');
    const atendimentos = dados.gda_atendimentos || [];
    const insertAtendimento = db.prepare(`
        INSERT OR REPLACE INTO atendimentos 
        (id, disciplina, data, hora, descricao, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyAtendimentos = db.transaction((items) => {
        for (const a of items) {
            insertAtendimento.run(
                a.id || `local_${Date.now()}_${Math.random()}`,
                a.disciplina || '',
                a.data || '',
                a.hora || '',
                a.descricao || '',
                a.timestamp || Date.now()
            );
        }
    });
    
    if (atendimentos.length > 0) {
        insertManyAtendimentos(atendimentos);
        console.log(`✅ ${atendimentos.length} atendimentos migrados`);
    } else {
        console.log('ℹ️ Nenhum atendimento para migrar');
    }
    
    // ============================================================
    // 10. MIGRAR ASSUNTOS
    // ============================================================
    console.log('📋 Migrando assuntos...');
    const assuntos = dados.gda_assuntos || {};
    const insertAssunto = db.prepare(`
        INSERT OR REPLACE INTO assuntos 
        (id, disciplina, titulo, descricao, data, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertManyAssuntos = db.transaction((items) => {
        for (const item of items) {
            insertAssunto.run(
                item.id || `local_${Date.now()}_${Math.random()}`,
                item.disciplina || '',
                item.titulo || '',
                item.descricao || '',
                item.data || '',
                item.timestamp || Date.now()
            );
        }
    });
    
    const todosAssuntos = [];
    for (const [disciplina, items] of Object.entries(assuntos)) {
        for (const item of items) {
            todosAssuntos.push({
                ...item,
                disciplina: disciplina
            });
        }
    }
    
    if (todosAssuntos.length > 0) {
        insertManyAssuntos(todosAssuntos);
        console.log(`✅ ${todosAssuntos.length} assuntos migrados`);
    } else {
        console.log('ℹ️ Nenhum assunto para migrar');
    }
    
    console.log('\n🎉 Migração concluída com sucesso!');
}

// ============================================================
// EXECUTAR MIGRAÇÃO
// ============================================================
try {
    migrarDados();
    console.log('\n📊 Verificando dados migrados...');
    
    // Mostrar resumo
    const tables = ['presencas', 'presencas_atrasadas', 'ocorrencias', 'atividades', 
                    'notas', 'relatorios', 'checklist', 'historico_panico', 
                    'atendimentos', 'assuntos', 'turmas'];
    
    console.log('\n📈 Resumo da migração:');
    for (const table of tables) {
        const count = db.prepare(`SELECT COUNT(*) as total FROM ${table}`).get();
        console.log(`  📊 ${table}: ${count.total} registros`);
    }
    
} catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    console.error(error.stack);
}