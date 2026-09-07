# GDA · Gestão Digital Agregada

> Um painel acadêmico simples para acompanhar estudos, presença, notas e tarefas em um só lugar.

![Node.js](https://img.shields.io/badge/Node.js-16%2B-3c873a?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-111827?logo=express&logoColor=white)
![Turso](https://img.shields.io/badge/Database-Turso%2FLibSQL-ffb300)
![Tests](https://img.shields.io/badge/tests-7%20passing-4caf50)

## Visão geral

O GDA centraliza a rotina acadêmica em uma interface web responsiva, com dados sincronizados na nuvem e suporte local para momentos sem conexão.

<div align="center">

| Acompanhe | Organize | Proteja |
|:---:|:---:|:---:|
| Presença, notas e progresso | Atividades, estudos e checklist | Sessão segura e dados sincronizados |

</div>

## Módulos

- Dashboard inicial e indicadores do semestre
- Turmas e disciplinas
- Atividades com prazos, participantes e subtarefas
- Notas por bimestre e média automática
- Registro de presença e frequência
- Relatórios de estudo
- Atendimentos, assuntos e ocorrências
- Checklist diário
- Modo Pânico com recursos de apoio

## Stack

| Camada | Tecnologia |
|---|---|
| Interface | HTML, CSS e JavaScript |
| API | Node.js e Express 5 |
| Dados | Turso/LibSQL |
| Sessão | JWT em cookie `HttpOnly` |
| Testes | Jest |

## Comece rápido

### Pré-requisitos

- Node.js 16 ou superior
- Uma instância Turso ou banco LibSQL compatível

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o ambiente

Crie um arquivo `.env` local com valores próprios. Nunca publique esse arquivo:

```env
NODE_ENV=production
PORT=3000
TURSO_URL=libsql://seu-banco.turso.io
TURSO_TOKEN=seu-token
JWT_SECRET=uma-chave-longa-e-aleatoria
GDA_AUTH_USERNAME=seu-usuario
GDA_AUTH_PASSWORD=sua-senha
CORS_ALLOWED_ORIGINS=https://seu-dominio.example
```

Use valores diferentes para desenvolvimento e produção. O segredo JWT, a senha da aplicação e o token do banco devem ser rotacionados imediatamente se forem expostos.

### 3. Inicie a aplicação

Servidor local:

```bash
npm start
```

Desenvolvimento com reinício automático:

```bash
npm run dev
```

Depois, acesse `http://localhost:3000`.

## Dados e segurança

Os dados são sincronizados com o Turso após a autenticação. Quando a nuvem está indisponível, o aplicativo mantém uma cópia local e informa que a sincronização não foi concluída.

As rotas de dados exigem autenticação. A sessão usa cookie `HttpOnly`, `Secure` em produção e `SameSite=Strict`. O servidor também aplica limite de requisições, limite de payload, validação de dados e políticas de segurança HTTP.

Não coloque tokens, senhas, cookies, dados acadêmicos ou arquivos `.env` em commits, issues, logs ou capturas de tela.

## Comandos úteis

| Comando | Uso |
|---|---|
| `npm start` | Inicia o servidor |
| `npm run dev` | Inicia com reinício automático |
| `npm test -- --runInBand` | Executa os testes |
| `npm run build` | Verifica a sintaxe do backend |
| `npm audit --omit=dev` | Audita dependências de produção |

## Estrutura

```text
index.html           Interface principal
api/index.js         Entrada para deploy serverless
src/index.js         Servidor local
src/config/          Configuração por ambiente
src/controllers/     Regras das rotas
src/middleware/      Autenticação e segurança
src/routes/          Rotas da API
src/services/        Integração com Turso
src/security.test.js  Testes de autenticação e validação
```

## Validação

```bash
npm test -- --runInBand
npm run build
npm audit --omit=dev
```

## Licença

MIT © 2026 GDA Team
