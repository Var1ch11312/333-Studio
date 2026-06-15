# HW 6.2 — Jira Setup Guide: Kiss My Flowers

## Крок 1: Створити проект

1. jira.atlassian.com → **Create project**
2. Тип: **Scrum**
3. Назва: `Kiss My Flowers`
4. Project key: `KMF`
5. **Create**

---

## Крок 2: Налаштувати Versions (Releases)

Project Settings → Versions → Add version:

| Version | Description | Status |
|---------|-------------|--------|
| v1.0 MVP | Core platform: catalog, checkout, Stripe, WhatsApp dispatch | Released |
| v2.0 Growth | AI Finder, Hub dashboard, Admin CRUD, PWA, nameday reminders | Released |
| v3.0 Scale | E2E tests, AI agents knowledge base, production deploy | Unreleased |

---

## Крок 3: Імпортувати backlog з CSV

1. Project → **...** (три крапки) → **Import issues**
2. Вибрати: **CSV**
3. Upload: `hw62-jira-backlog.csv`
4. Маппінг полів:
   - `Issue Type` → Issue Type
   - `Summary` → Summary
   - `Description` → Description
   - `Priority` → Priority
   - `Epic Name` → Epic Name (Jira автоматично створить Epics)
   - `Story Points` → Story Points
   - `Sprint` → Sprint
   - `Status` → Status
   - `Fix Version` → Fix Version
5. **Import**

---

## Крок 4: Створити Scrum Board

1. Your projects → Kiss My Flowers → **Board**
2. Board Settings → **Columns**:

| Колонка | Статуси |
|---------|---------|
| TO DO | To Do, Backlog |
| IN PROGRESS | In Progress |
| IN REVIEW | In Review, Code Review |
| DONE | Done, Released |

3. Board Settings → **Swimlanes** → By Epic
4. Board Settings → **Card layout** → додати: Story Points, Priority

---

## Крок 5: Налаштувати Epics (якщо не імпортувались)

Backlog → **Create Epic** для кожного:

| Epic | Колір | Fix Version |
|------|-------|-------------|
| ВІДКРИТТЯ — Клієнт знаходить і обирає | Синій | v1.0 + v2.0 |
| ЗАМОВЛЕННЯ — Оформлення та оплата | Зелений | v1.0 |
| ВИКОНАННЯ — Флорист та кур'єр | Помаранчевий | v1.0 + v2.0 |
| УПРАВЛІННЯ — Адмін та AI | Фіолетовий | v2.0 + v3.0 |
| ІНФРАСТРУКТУРА — Технічна база | Сірий | всі версії |

---

## Крок 6: Створити Sprints та наповнити задачами

### Sprint 1 — MVP Core (2 тижні)
Goal: "Клієнт може знайти букет, оплатити і отримати WA-підтвердження"

Задачі (всього ~36 SP):
- US-01: Каталог (3 SP)
- US-03: Checkout (8 SP)
- US-04: Stripe оплата (5 SP)
- US-05: WA нотифікації (3 SP)
- US-06: Флорист WA accept/reject (5 SP)
- US-07: Кур'єр dispatch (8 SP)
- US-09: Admin дашборд (5 SP)
- Task: Supabase міграції (5 SP)
- Task: PIN аутентифікація (3 SP)
- Task: Middleware (2 SP)

### Sprint 2 — Growth Features (2 тижні)
Goal: "Повний цикл доставки з фото, Hub дашборд, Admin CRUD, AI-підбір"

Задачі (всього ~39 SP):
- US-02: AI Finder (5 SP)
- US-08: Фото підтвердження (5 SP)
- US-10: Admin CRUD каталогу (8 SP)
- US-11: Нагадування іменини (3 SP)
- US-12: Hub дашборд (5 SP)
- US-13: Ескалація (5 SP)
- US-15: PWA (3 SP)
- Task: GitHub Actions CI (3 SP)
- Task: Vitest × 16 (5 SP)
- Task: SEO + Legal pages (4 SP)

### Sprint 3 — Scale & Launch (2 тижні)
Goal: "Production deploy + E2E testing + AI agents знання"

Задачі (всього ~32 SP):
- US-14: AI бухгалтер/юрист/маркетолог (8 SP)
- Task: E2E Playwright тест (8 SP)
- Task: Embeddings backfill (2 SP)
- Task: Vercel production (5 SP)
- Task: Meta WhatsApp approval (3 SP)
- Task: Stripe live keys (2 SP)
- Task: Supabase production (3 SP)
- Task: Google Business Profile (1 SP)

---

## Крок 7: Velocity Chart та Roadmap

1. **Reports → Velocity Chart** → показує SP completed per sprint
2. **Roadmap** (якщо є Jira Software): вигляд Epics на часовій шкалі
   - ВІДКРИТТЯ: Sprint 1–2
   - ЗАМОВЛЕННЯ: Sprint 1
   - ВИКОНАННЯ: Sprint 1–2
   - УПРАВЛІННЯ: Sprint 2–3
   - ІНФРАСТРУКТУРА: Sprint 1–3

---

## WBS у вигляді дерева (для скріншоту)

```
Kiss My Flowers Platform (144 SP)
├── 1.1 Ініціалізація (14 SP) ✅
│   ├── 1.1.1 Технічний стек (2)
│   ├── 1.1.2 CI/CD GitHub Actions (3)
│   ├── 1.1.3 Схема БД 8 таблиць (5)
│   └── 1.1.4 Міграції 01-10 (4)
├── 1.2 Клієнтська частина (28 SP) ✅
│   ├── 1.2.1 Каталог EUR+BGN (3)
│   ├── 1.2.2 AI Finder 30 комбінацій (5)
│   ├── 1.2.3 Checkout 5 кроків (8)
│   ├── 1.2.4 Stripe Checkout (5)
│   ├── 1.2.5 Іменини нагадування (3)
│   └── 1.2.6 PWA offline (3)
├── 1.3 WhatsApp нотифікації клієнту (3 SP) ✅
├── 1.4 Флорист / Hub (13 SP) ✅
│   ├── 1.4.1 WA accept/reject + 5хв таймаут (5)
│   ├── 1.4.2 Hub дашборд Realtime (5)
│   └── 1.4.3 Haversine маршрутизація (3)
├── 1.5 Кур'єр (13 SP) ✅
│   ├── 1.5.1 Broadcast first-wins dispatch (8)
│   └── 1.5.2 Фото підтвердження (5)
├── 1.6 Адміністратор (18 SP) ✅
│   ├── 1.6.1 Admin дашборд Realtime (5)
│   ├── 1.6.2 CRUD каталогу + Storage (8)
│   └── 1.6.3 Ескалація cron 2хв (5)
├── 1.7 AI-агенти RAG (21 SP) ✅/⏳
│   ├── 1.7.1 Бухгалтер claude-opus-4-8 (8) ✅
│   ├── 1.7.2 Юрист (5) ✅
│   ├── 1.7.3 Маркетолог (5) ✅
│   └── 1.7.4 База знань pgvector (3) ⏳
├── 1.8 Безпека (8 SP) ✅
├── 1.9 Тестування QA (21 SP) ✅/⏳
│   ├── 1.9.1 Vitest × 16 unit (5) ✅
│   ├── 1.9.2 Integration тести (8) ✅
│   ├── 1.9.3 E2E Playwright (8) ⏳
│   └── 1.9.4 GitHub Actions CI (3) ✅
├── 1.10 SEO + Legal (5 SP) ✅
└── 1.11 Деплой та запуск (15 SP) ❌
    ├── 1.11.1 Vercel ENV + domain (2)
    ├── 1.11.2 kissmyflowers.bg DNS (2)
    ├── 1.11.3 Supabase production (3)
    ├── 1.11.4 WhatsApp Business Meta (3)
    ├── 1.11.5 Stripe live keys (2)
    ├── 1.11.6 Google Business Profile (1)
    └── 1.11.7 Go-live checklist (2)
```

Статус: 129/144 SP виконано (90%) — готово до production deploy
