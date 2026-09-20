const { getSectionValue, setSectionValue } = require('../src/services/turso');

const assuntos = {};

function adicionar(disciplina, data, titulo, descricao = titulo) {
  if (!assuntos[disciplina]) assuntos[disciplina] = [];
  const id = `sigaa-2026-${disciplina.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${assuntos[disciplina].length + 1}`;
  assuntos[disciplina].push({
    id,
    titulo,
    descricao,
    data,
    timestamp: new Date(`${data}T12:00:00-03:00`).getTime()
  });
}

function adicionarSemanas(disciplina, dataInicial, quantidade, titulo) {
  const inicio = new Date(`${dataInicial}T12:00:00-03:00`);
  for (let indice = 0; indice < quantidade; indice += 1) {
    const data = new Date(inicio);
    data.setDate(data.getDate() + indice * 7);
    adicionar(disciplina, data.toISOString().slice(0, 10), titulo);
  }
}

const filosofia = 'FILOSOFIA';
adicionar(filosofia, '2026-01-21', 'Não Haverá Aula');
adicionar(filosofia, '2026-01-28', 'Linha do Tempo da Filosofia — Pré-socráticos, Sócrates');
adicionar(filosofia, '2026-02-04', 'Linha do Tempo da Filosofia (cont.) — Clássica, Medieval, Moderna, Contemporânea');
adicionar(filosofia, '2026-02-11', 'Epiteto — O Bem Viver');
adicionar(filosofia, '2026-02-11', 'Mito da Caverna (Platão) — Aula Extra');
adicionar(filosofia, '2026-02-18', 'Não Haverá Aula (Quarta-feira de Cinzas)');
adicionar(filosofia, '2026-02-25', 'Aristóteles: Conhecimento, Ciência e Arte');
adicionar(filosofia, '2026-02-25', 'Carta à Meneceu (Epicuro) — Aula Extra');
adicionar(filosofia, '2026-03-04', 'Carta a Meneceu');
adicionar(filosofia, '2026-03-11', 'Epicteto — O Bem Viver');
adicionar(filosofia, '2026-03-18', 'Avaliação — 1º Bimestre');
adicionar(filosofia, '2026-03-25', 'Entrega das Avaliações, Correção e Revisão');
adicionar(filosofia, '2026-04-01', 'Aula final de bimestre (revisão geral)');
adicionar(filosofia, '2026-04-08', 'Questões iniciais e contemporâneas da Filosofia');
adicionar(filosofia, '2026-04-15', 'A busca pelo conhecimento e a Revolução Científica');
adicionar(filosofia, '2026-04-22', 'Autoridade e Poder em Maquiavel, Foucault e Hannah Arendt');
adicionar(filosofia, '2026-04-29', 'Empirismo x Racionalismo');
adicionar(filosofia, '2026-05-06', 'Freud e as 3 feridas narcísicas');
adicionar(filosofia, '2026-05-06', 'Visita técnica — Vale (Dia da Água) — Aula Extra');
adicionar(filosofia, '2026-05-13', 'Os 3 Poderes de Montesquieu');
adicionar(filosofia, '2026-05-20', 'Karl Marx — Mais Valia');
adicionar(filosofia, '2026-05-22', 'Atividade: Resolução de Problema (Roda de conversa) — Aula Extra');
adicionar(filosofia, '2026-06-03', 'Avaliação 2');
adicionar(filosofia, '2026-06-03', 'Não Haverá Aula (férias)');
adicionar(filosofia, '2026-06-10', 'Entrega, Correção e Revisão da Avaliação 2');
adicionar(filosofia, '2026-06-17', 'Aula Final de Semestre — Revisão Geral');
adicionar(filosofia, '2026-06-24', 'Não Haverá Aula (Conselho de Classe)');
adicionar(filosofia, '2026-07-29', 'Não Haverá Aula');
adicionar(filosofia, '2026-08-05', 'Aula de Revisão do conteúdo do 1º semestre');
adicionar(filosofia, '2026-08-12', 'Filosofia Contemporânea — Existencialismo');
adicionar(filosofia, '2026-08-26', 'Jogos Servidores — Aula Extra');
adicionar(filosofia, '2026-09-12', 'As abordagens éticas — Aula Extra');
adicionar(filosofia, '2026-09-19', 'Dia do Folclore — Aula Extra');
adicionarSemanas(filosofia, '2026-10-07', 10, 'Não Haverá Aula');

const artes = 'ARTES';
adicionar(artes, '2026-01-23', 'Apresentação da disciplina e PPC. Arte Rupestre. Mapa mental');
adicionar(artes, '2026-01-30', 'Egito Antigo e as Artes. Questionário discursivo');
adicionar(artes, '2026-02-06', 'Arte Grega: linguagens e técnicas. Questionário discursivo');
adicionar(artes, '2026-02-13', 'Arte Romana: contexto histórico. Questionário discursivo');
adicionar(artes, '2026-02-20', 'Produção de HQ — Dia Internacional da Mulher');
adicionar(artes, '2026-02-27', 'Estudo de questões femininas no filme da Barbie');
adicionar(artes, '2026-03-06', 'Avaliação — Arte na Pré-História e Antiguidade');
adicionar(artes, '2026-03-13', 'Programação do Dia Internacional da Mulher');
adicionar(artes, '2026-03-20', 'Estudo de questões femininas no filme da Barbie');
adicionar(artes, '2026-03-27', 'Atividade avaliativa extra (valor 1) — Mapa mental');
adicionar(artes, '2026-04-03', 'Feriado');
adicionar(artes, '2026-04-10', 'Arte Romana — Mapa mental: Arte Paleocristã');
adicionar(artes, '2026-04-17', 'Arte Paleocristã. Arte Românica e Gótica');
adicionar(artes, '2026-04-22', 'Visita técnica à Estação Rodoviária da Vale — Aula Extra');
adicionar(artes, '2026-04-24', 'Arte Românica e Gótica. Criação de cidade medieval');
adicionar(artes, '2026-05-01', 'Feriado');
adicionar(artes, '2026-05-08', 'Atividade avaliativa coletiva — Idade Média e Moderna');
adicionar(artes, '2026-05-15', 'Programação da Semana da Saúde');
adicionar(artes, '2026-05-22', 'Seminários coletivos — Arte no Século XVIII e XIX');
adicionar(artes, '2026-05-29', 'Seminários coletivos — Arte no Século XVIII e XIX');
adicionar(artes, '2026-06-05', 'Ponto facultativo');
adicionar(artes, '2026-06-12', 'Seminários + Prática de colagem (Dia dos Namorados)');
adicionar(artes, '2026-06-19', 'Prática de colagem + Entrega das atividades diárias');
adicionar(artes, '2026-06-26', 'Conselho de classe');
adicionarSemanas(artes, '2026-07-03', 5, 'Férias');
adicionar(artes, '2026-08-07', 'Arte e Meio Ambiente — Design para vaso de planta');
adicionar(artes, '2026-08-14', 'Projeto Cineclube — Expressionismo alemão e Tim Burton');

const saneamento = 'FUNDAMENTOS DE SANEAMENTO E SAÚDE PÚBLICA';
[
  ['2026-01-27', 'Introdução aos termos técnicos de Saneamento Básico e Ambiental'],
  ['2026-01-27', 'Conceitos básicos de saneamento e saúde pública'],
  ['2026-02-03', 'Conceitos básicos de saneamento e saúde pública'],
  ['2026-02-10', 'Não Haverá Aula'],
  ['2026-02-10', 'Os 4 componentes do Saneamento Básico no Brasil'],
  ['2026-02-24', 'Não Haverá Aula'],
  ['2026-02-24', 'Os 4 componentes do Saneamento Básico no Brasil'],
  ['2026-03-03', 'Diferença entre Saneamento Básico e Ambiental'],
  ['2026-03-10', 'Diferença entre Saneamento Básico e Ambiental'],
  ['2026-03-17', 'História do saneamento básico e ambiental no Brasil'],
  ['2026-03-24', 'História do saneamento básico e ambiental no Brasil'],
  ['2026-03-31', 'Revisão do 1º Bimestre'],
  ['2026-04-07', 'Avaliação do 1º Bimestre'],
  ['2026-04-14', 'Não Haverá Aula'],
  ['2026-04-14', 'Motivos da insuficiência do saneamento no Brasil'],
  ['2026-04-28', 'Motivos da insuficiência do saneamento no Brasil'],
  ['2026-05-05', 'Principais determinantes sociais de saúde (DSS) no Brasil'],
  ['2026-05-12', 'Saúde pública no Brasil: Determinantes Sociais e Ambientais'],
  ['2026-05-12', 'Principais determinantes sociais de saúde (DSS)'],
  ['2026-05-19', 'Principais determinantes sociais de saúde (DSS)'],
  ['2026-05-26', 'Principais determinantes sociais de saúde (DSS)'],
  ['2026-06-02', 'Saneamento Básico — Um futuro mais saudável'],
  ['2026-06-02', 'Principais determinantes sociais de saúde (DSS)'],
  ['2026-06-08', 'Avaliação do 2º Bimestre — Aula Extra de Reposição'],
  ['2026-06-09', 'Análise dos índices de saneamento da região Norte'],
  ['2026-06-16', 'Análise dos índices de saneamento da região Norte'],
  ['2026-06-23', 'Revisão do 2º Bimestre'],
  ['2026-07-28', 'Não Haverá Aula'],
  ['2026-07-28', 'Avaliação do 2º Bimestre'],
  ['2026-08-04', 'Um futuro mais saudável'],
  ['2026-08-11', 'Saneamento básico: abastecimento de água'],
  ['2026-08-18', 'Saneamento básico: gerenciamento de resíduos sólidos'],
  ['2026-08-25', 'Saneamento básico: gerenciamento de resíduos sólidos'],
  ['2026-09-01', 'Saneamento básico: esgotamento sanitário'],
  ['2026-09-08', 'Saneamento básico: esgotamento sanitário'],
  ['2026-09-15', 'Saneamento básico: drenagem urbana'],
  ['2026-09-22', 'Saneamento básico: drenagem urbana'],
  ['2026-09-29', 'Revisão do 3º Bimestre'],
  ['2026-10-06', 'Avaliação do 3º Bimestre'],
  ['2026-10-13', 'Doenças infectoparasitárias, cadeia epidemiológica, vetores'],
  ['2026-10-20', 'Conceitos x condições ambientais (água, solo, resíduos)'],
  ['2026-10-27', 'Arboviroses (dengue, zika, chikungunya) e parasitoses — Marabá'],
  ['2026-11-03', 'Métodos de prevenção: resíduos, criadouros, qualidade da água'],
  ['2026-11-10', 'Métodos de prevenção (continuação)'],
  ['2026-11-17', 'Saneamento básico, mudanças climáticas e saúde'],
  ['2026-11-24', 'Políticas de Saúde Ambiental no Brasil'],
  ['2026-12-01', 'O papel do técnico em controle ambiental'],
  ['2026-12-08', 'Revisão do 4º Bimestre'],
  ['2026-12-15', 'Avaliação do 4º Bimestre']
].forEach(([data, titulo]) => adicionar(saneamento, data, titulo));

const geografia = 'GEOGRAFIA';
[
  ['2026-01-22', 'Não Haverá Aula — Licença Capacitação'], ['2026-01-29', 'Não Haverá Aula — Licença Capacitação'],
  ['2026-02-05', 'Não Haverá Aula — Licença Capacitação'], ['2026-02-12', 'Apresentação da disciplina e atividade diagnóstica'],
  ['2026-02-19', 'Introdução à ciência geográfica'], ['2026-02-26', 'Introdução à ciência geográfica'],
  ['2026-03-05', 'Introdução aos estudos de geologia e relevo'], ['2026-03-12', 'Introdução aos estudos de geologia e relevo'],
  ['2026-03-19', 'Introdução aos estudos de geologia e relevo'], ['2026-03-26', 'I Avaliação'],
  ['2026-04-02', 'Introdução aos estudos de clima'], ['2026-04-09', 'Introdução aos estudos de clima'],
  ['2026-04-16', 'Introdução aos estudos de clima'], ['2026-04-23', 'Introdução aos estudos de clima'],
  ['2026-04-30', 'Introdução aos estudos de clima'], ['2026-05-07', 'Introdução aos estudos de hidrografia'],
  ['2026-05-14', 'Introdução aos estudos de hidrografia'], ['2026-05-19', 'Hidrografia e espaço geográfico — Aula Extra'],
  ['2026-05-21', 'Introdução aos estudos de hidrografia'], ['2026-05-28', 'Introdução aos estudos de solos e biomas'],
  ['2026-05-29', 'Biomas e organização do espaço — Aula Extra'], ['2026-06-04', 'Introdução aos estudos de solos e biomas'],
  ['2026-06-11', 'II Avaliação'], ['2026-06-12', 'Biomas e organização do espaço — SIMULADO (Aula Extra)'],
  ['2026-06-15', 'Espaço agrário mundial e brasileiro — Aula Extra'], ['2026-06-18', 'Semana do Meio Ambiente IFPA/CMI'],
  ['2026-06-25', 'Conselho de Classe'], ['2026-06-25', 'Não Haverá Aula — Conselho de Classe']
].forEach(([data, titulo]) => adicionar(geografia, data, titulo));
adicionarSemanas(geografia, '2026-07-02', 4, 'Férias escolares');
adicionar(geografia, '2026-07-30', 'Encontro Pedagógico');
adicionar(geografia, '2026-07-30', 'Não Haverá Aula — Férias no Calendário');
adicionarSemanas(geografia, '2026-08-06', 3, 'Férias docente (PLE) — 3 semanas');
[
  ['2026-08-27', 'Espaço agrário mundial e brasileiro'], ['2026-09-03', 'Espaço agrário mundial e brasileiro'],
  ['2026-09-10', 'Processo de urbanização mundial e espaço urbano brasileiro'], ['2026-09-17', 'Urbanização e Setor terciário no Brasil'],
  ['2026-09-19', 'Mostra de Folclore — "Entre o banhar e o tomar banho" (Aula Extra)'],
  ['2026-09-24', 'Urbanização e Setor terciário no Brasil'], ['2026-10-01', 'Urbanização e Setor terciário no Brasil']
].forEach(([data, titulo]) => adicionar(geografia, data, titulo));
['2026-08-06', '2026-08-13', '2026-08-20'].forEach((data) => adicionar(geografia, data, 'Férias docente (PLE) — 3 semanas'));

const informatica = 'INFORMÁTICA BÁSICA';
[
  ['2026-01-21', 'Aula 1: Apresentação da disciplina e configuração do ambiente'], ['2026-01-28', 'Aula 2: História da informática e evolução dos computadores'],
  ['2026-02-04', 'Aula 3: Conceitos básicos de hardware'], ['2026-02-11', 'Aula 4: Dispositivos de entrada/saída e acessibilidade'],
  ['2026-02-13', 'Sistemas operacionais e interface — Aula Extra'], ['2026-02-18', 'Aula 5: Sistemas operacionais e interface'],
  ['2026-02-25', 'Aula 6: Organização de arquivos e pastas'], ['2026-03-04', 'Aula 7: Backup e sincronização'],
  ['2026-03-11', '1ª Avaliação'], ['2026-03-18', 'Aula 8: Internet — conceitos e etiqueta digital'],
  ['2026-03-25', 'Aula 9: Segurança digital I — senhas, 2FA, privacidade'], ['2026-04-01', 'Aula 10: Segurança digital II — golpes, phishing, malware'],
  ['2026-04-08', 'Aula 11: Pesquisa na web e validação de fontes'], ['2026-04-15', 'Aula 12: Comunicação digital (e-mail, netiqueta, calendário)'],
  ['2026-04-22', 'Aula 13: Editor de texto — interface e criação'], ['2026-04-29', 'Aula 14: Formatação básica — fontes, parágrafos, listas'],
  ['2026-04-29', 'Reunião Vale e TCS — Estação Conhecimento'], ['2026-05-06', 'Aula 15: Estrutura de documento — títulos, sumário, quebras'],
  ['2026-05-13', 'Aula 16: Inserções — tabelas, imagens, formas'], ['2026-05-20', 'Aula 17: Cabeçalho/rodapé, numeração, capa e templates'],
  ['2026-05-27', '2ª Avaliação'], ['2026-06-03', 'Aula 18: Revisão — ortografia e controle de alterações'],
  ['2026-06-10', 'Aula 19: Referências — citações, notas, bibliografia'], ['2026-06-17', 'Aula 20: Produção orientada — relatório prático'],
  ['2026-06-24', 'Aula 21: Planilhas — interface e formatação'], ['2026-07-29', 'Encontro Pedagógico'],
  ['2026-08-05', 'Aula 22: Fórmulas e operadores'], ['2026-08-12', 'Aula 23: Funções básicas (SOMA, MÉDIA, MÁXIMO, MÍNIMO, CONT.SE)'],
  ['2026-08-19', 'Aula 24: Referências relativas/absolutas e replicação'], ['2026-08-26', 'Aula 25: Organização e limpeza de dados'],
  ['2026-09-02', 'Aula 26: Classificação, filtros e tabelas'], ['2026-09-09', 'Aula 27: Gráficos — tipos e leitura crítica'],
  ['2026-09-16', 'Aula 28: Projeto prático de planilha — orçamento'], ['2026-09-23', 'Aula 29: Apresentações — roteiro e estrutura'],
  ['2026-09-30', '3ª Avaliação'], ['2026-10-07', 'Aula 30: Design de slides'], ['2026-10-14', 'Aula 31: Inserção de elementos — imagens, tabelas, gráficos'],
  ['2026-10-21', 'Aula 32: Animações e transições'], ['2026-11-04', 'Aula 33: Apresentação oral'],
  ['2026-11-11', 'Aula 34: Exportação e compartilhamento'], ['2026-11-18', 'Aula 35: Projeto integrador — texto + planilha + slides'],
  ['2026-11-25', '4ª Avaliação'], ['2026-12-02', 'Recuperação'], ['2026-12-09', 'Revisão de todo o conteúdo'], ['2026-12-16', 'Prova Final']
].forEach(([data, titulo]) => adicionar(informatica, data, titulo));

const meioAmbiente = 'MEIO AMBIENTE E LEGISLAÇÃO AMBIENTAL';
[
  ['2026-01-23', 'Conceitos e definições sobre meio ambiente', 'Período: 23/01/2026 a 20/02/2026'], ['2026-01-29', 'Aula extra — Aula Extra Adicional'],
  ['2026-02-13', 'Não Haverá Aula'], ['2026-02-27', 'Princípios da base legal — Políticas e legislações ambientais', 'Período: 27/02/2026 a 13/03/2026'],
  ['2026-03-13', 'Atividade alusiva ao Dia Internacional da Mulher (NEGED)'], ['2026-03-18', 'Aula extra devido horário vago'],
  ['2026-03-20', 'Atividade avaliativa em sala (3 pontos)'], ['2026-03-27', 'Prova individual (5 pontos)'],
  ['2026-04-10', 'Principais conferências ambientais', 'Período: 10/04/2026 a 08/05/2026'], ['2026-05-15', 'IV Semana da Saúde do CMI — Palestra FACIMPA'],
  ['2026-05-15', 'Principais problemas ambientais do Brasil', 'Período: 15/05/2026 a 05/06/2026'], ['2026-06-12', 'Trabalho em Equipe (3 pontos)'],
  ['2026-06-19', 'Atividade individual (5 pontos)'], ['2026-07-31', 'Não Haverá Aula — Encontro Pedagógico'],
  ['2026-08-07', 'O sistema de saneamento ambiental — água e esgoto', 'Período: 07/08/2026 a 28/08/2026'], ['2026-09-04', 'Atividade avaliativa em sala (4 pontos)'],
  ['2026-09-11', 'Prova individual (5 pontos)'], ['2026-09-19', 'Mostra de Folclore (NAC) — Aula Extra'],
  ['2026-09-25', 'Saneamento ambiental — RSU e drenagem urbana', 'Período: 25/09/2026 a 02/10/2026'],
  ['2026-10-09', 'Atribuições do Técnico em Controle Ambiental', 'Período: 09/10/2026 a 16/10/2026'],
  ['2026-10-23', 'Trabalho em Equipe (5 pontos)', 'Período: 23/10/2026 a 30/10/2026'], ['2026-11-06', 'Atividade avaliativa em sala (4 pontos)'],
  ['2026-11-13', 'Recuperação Paralela'], ['2026-11-27', 'Prova Final'], ['2026-12-04', 'MAIPE'], ['2026-12-18', 'Jogos do CMI']
].forEach(([data, titulo, descricao]) => adicionar(meioAmbiente, data, titulo, descricao));

async function executar() {
  const atual = await getSectionValue('gda_assuntos');
  const resultado = atual && typeof atual === 'object' && !Array.isArray(atual) ? atual : {};
  delete resultado.key;
  delete resultado.value;
  let inseridos = 0;
  Object.entries(assuntos).forEach(([disciplina, itens]) => {
    const existentes = Array.isArray(resultado[disciplina]) ? resultado[disciplina] : [];
    const ids = new Set(existentes.map((item) => item.id));
    const novos = itens.filter((item) => !ids.has(item.id));
    resultado[disciplina] = [...existentes, ...novos];
    inseridos += novos.length;
  });
  await setSectionValue('gda_assuntos', resultado);
  const total = Object.values(resultado).reduce((soma, itens) => soma + (Array.isArray(itens) ? itens.length : 0), 0);
  console.log(JSON.stringify({ disciplinas: Object.keys(assuntos).length, assuntosImportados: inseridos, totalNoBanco: total }));
}

executar().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});