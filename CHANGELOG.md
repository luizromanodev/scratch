# 📋 FinFlow — Changelog

## v3.0.0 (2026-05-21)

### 🚀 Novos Recursos
- **Landing Page** — Página pública premium com hero, features, depoimentos e CTA
- **Supabase Backend** — Infraestrutura de banco de dados cloud com persistência híbrida (local + cloud)
- **Auth dual-mode** — Suporte a login local (simples) e Supabase (email+senha) no mesmo contexto

### 🔧 Melhorias
- **SEO completo** — Open Graph, Twitter Cards, canonical URL, keywords e robots
- **Onboarding user-scoped** — Cada novo usuário vê o tour; adicionado slide do FinBot IA
- **Versão dinâmica** — Footer sincroniza versão automaticamente via `package.json`
- **Cloud sync debounced** — Dados salvos localmente instantaneamente, sincronizados na cloud após 2s
- **Data normalization** — Proteção contra dados corrompidos com normalização automática

### 🏗️ Arquitetura
- `src/lib/supabase.js` — Client com fallback gracioso
- `src/lib/dataService.js` — Camada de abstração auth + data
- `supabase/migrations/` — Schema SQL com RLS e triggers
- `vite.config.js` — `__APP_VERSION__` global + resolve alias para tslib

---

## v2.1.0 (2026-05-18)

### 🔧 Melhorias
- Fix build — removido `tsc` do script de build
- Dados isolados por `userId` no localStorage
- Logout preserva dados do usuário
- API Key movida para configuração individual do usuário
- Validação robusta no Login (nome ≥ 2 chars, email regex)
- Code splitting via `React.lazy()` para 17 rotas

---

## v2.0.0 (2026-05-16)

### 🚀 Novos Recursos
- Error Boundary global
- Splash screen durante carregamento
- Página 404 customizada
- Indicador de offline
- Confirmação de logout
- SPA routing para hosting (vercel.json)
- PWA com ícones corrigidos

---

## v1.0.0 (2026-05-01)

### 🚀 Release Inicial
- Dashboard com saldo, gráficos e transações
- Gerenciamento de categorias, orçamentos, metas e cofres
- Cartões de crédito com faturas
- Contas bancárias
- Relatórios e resumo anual
- Transações recorrentes
- Conquistas e gamificação
- Notificações de orçamento
- FinBot IA (Gemini)
- Criptomoedas (cotações em tempo real)
- Tema claro/escuro + cores de acento
- PWA instalável
