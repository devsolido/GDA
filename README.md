# 📊 GDA - Gestão Digital Agregada

![Version](https://img.shields.io/badge/version-3.1.0-blue)
![PWA](https://img.shields.io/badge/PWA-ready-purple)
![A11y](https://img.shields.io/badge/WCAG_2.1_AA-brightgreen)

> Dashboard acadêmico para gestão de vida estudantil

---

## 📖 Sobre

O **GDA** é um dashboard interativo que centraliza o gerenciamento da rotina acadêmica, oferecendo indicadores visuais de desempenho, atividades, notas e bem-estar estudantil.

### 🎯 Objetivo

Transformar dados educacionais em informações práticas através de:

- Business Intelligence e Visualização de Dados
- Frontend (HTML5, CSS3, JavaScript)
- PWA e Acessibilidade (WCAG 2.1 AA)
- UX/UI Design e Performance Web

---

## 📊 Módulos

| Módulo | Funcionalidades |
|--------|-----------------|
| **🏠 Inicial** | Checklist, horas de estudo, progresso do semestre, frase do dia |
| **📊 Dashboard** | Estatísticas gerais (atividades, notas, checklist) |
| **🏫 Turmas** | 14 disciplinas com busca por código/professor |
| **📝 Atividades** | CRUD, participantes com prazos, subtarefas, progresso |
| **📊 Notas** | 4 bimestres, média automática, status (aprovado/reprovado/recuperação) |
| **📚 Relatórios** | Registro diário de estudo com tempo e descrição |
| **🚨 Pânico** | Respiração guiada, frases motivacionais, registro de relato |
| **🤝 Atendimentos** | Registro de participações intraescolares |

---

## 🛠️ Tecnologias

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | HTML5, CSS3, JavaScript ES2022 |
| **Ícones** | Font Awesome 6, Material Icons |
| **Tipografia** | Inter (Google Fonts) |
| **PWA** | Service Worker, Web App Manifest |
| **Armazenamento** | localStorage, Backendless (stub) |
| **Ferramentas** | Git, VS Code, Live Server |

---

## 📁 Estrutura

```
gda-project/
├── index.html          # Página principal
├── manifest.json       # PWA
├── sw.js              # Service Worker
├── styles/style.css   # Estilos
├── scripts/main.js    # Lógica principal
├── pages/             # Páginas HTML
└── assets/            # Ícones e imagens
```

---

## 🚀 Execução

```bash
# Clonar
git clone https://github.com/seu-usuario/gda-project.git
cd gda-project

# Servidor Python
python3 -m http.server 8000

# Acessar
http://localhost:8000
```

---

## 📱 PWA

- ✅ Instalável na tela inicial
- ✅ Funciona offline
- ✅ Splash screen personalizada
- ⏳ Push notifications (em desenvolvimento)

---

## ♿ Acessibilidade

- ✅ WCAG 2.1 AA
- ✅ Navegação por teclado
- ✅ ARIA landmarks e labels
- ✅ Contraste 17.8:1
- ✅ Reduced motion

---

## ⚡ Performance

| Métrica | Valor |
|---------|-------|
| Lighthouse | 94 |
| FCP | 1.2s |
| LCP | 2.1s |
| TTI | 2.8s |
| CLS | 0.02 |

---

## 🔒 Segurança

- ✅ JWT obrigatório em todos os endpoints `/api/*`, exceto `/api/auth/login`
- ✅ Sessões persistidas no Turso com hash SHA-256 do token e expiração
- ✅ Hash SHA-256 encadeado dos registros acadêmicos, com histórico append-only
- ✅ Certidão PDF estilo registro acadêmico para conferência independente dos hashes
- ✅ Rate limiting com `express-rate-limit` (300 requisições/15 min e 10 logins/15 min por IP)
- ✅ CORS restrito por `CORS_ALLOWED_ORIGINS`
- ✅ Headers Helmet com CSP, HSTS e proteção contra MIME sniffing
- ✅ Logs estruturados de login, autenticação, CORS e rate limiting

### Variáveis de ambiente da API

```env
TURSO_URL=seu-banco.turso.io
TURSO_TOKEN=seu-token-do-turso
JWT_SECRET=uma-chave-aleatoria-com-no-minimo-32-caracteres
GDA_AUTH_USERNAME=usuario-da-aplicacao
GDA_AUTH_PASSWORD=senha-da-aplicacao
CORS_ALLOWED_ORIGINS=https://seu-dominio.example,https://gda-kappa.vercel.app
```

Faça login com `POST /api/auth/login` enviando `{"username":"...","password":"..."}`. Envie o token retornado nas demais requisições como `Authorization: Bearer <token>`.

Após uma gravação, o campo `integrity` informa os hashes do registro. Consulte `GET /api/integridade/:tipo/:id` ou baixe `GET /api/integridade/:tipo/:id/pdf`. A certidão comprova a integridade e a origem registrada no GDA; para ter validade jurídica como assinatura digital, ela deve ser associada a um certificado digital reconhecido.

---

## 📄 Licença

MIT © 2026 GDA Team

---

## 👩‍💻 Desenvolvido por

**Igor Veras Morais**

[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/igorverasmorais-bbpso/)


---


---

**Feito com ❤️ e café ☕**

[⬆ Voltar ao topo](#-gda---gestão-digital-agregada)
```
