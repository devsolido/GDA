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

- ✅ Sanitização XSS
- ✅ Rate limiting (50 req/min)
- ✅ Validação de inputs
- ✅ Detecção de DevTools

---

## 📄 Licença

MIT © 2026 GDA Team

---

## 👩‍💻 Desenvolvido por

**Andressa Silva Xavier**

[![LinkedIn](https://img.shields.io/badge/-LinkedIn-0077B5?style=flat&logo=linkedin)](https://www.linkedin.com/in/andressa-xavier-2b393a271/)
[![GitHub](https://img.shields.io/badge/-GitHub-100000?style=flat&logo=github)](https://github.com/andressaxavier)

---

## 🙏 Agradecimentos

- Font Awesome · Google Fonts · Backendless

---

**Feito com ❤️ e café ☕**

[⬆ Voltar ao topo](#-gda---gestão-digital-agregada)
```
