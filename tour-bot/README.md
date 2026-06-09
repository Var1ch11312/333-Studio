# Telegram-бот для продажи экскурсий (n8n Cloud + OpenAI + Google Sheets)

Внутренний бот для менеджера: находит экскурсии и остановки по отелям в Google Sheets,
помогает оформить продажу, выдаёт готовое сообщение клиенту и чек для учёта.

Полная логика и архитектура — в [`PLAN.md`](./PLAN.md).

## Файлы

| Файл | Что это |
|---|---|
| `n8n-workflow.json` | Готовый workflow для импорта в n8n Cloud |
| `prompts/agent-system-prompt.md` | Системный промпт агента (бизнес-логика) |
| `sheets/Hotels.csv` | Шаблон вкладки «Отели» |
| `sheets/Orders.csv` | Шаблон вкладки «Заказы» (лог продаж) |
| `sheets/Excursions-columns.md` | Ожидаемые колонки вкладки «Экскурсии» |

## Настройка (по шагам)

### 1. Google Sheets
В вашем документе (`1s3UBKo6...`) создайте две новые вкладки:
- **Отели** — скопируйте заголовки из `sheets/Hotels.csv` (можно импортировать CSV: Файл → Импорт → Вставить как новые листы).
- **Заказы** — заголовки из `sheets/Orders.csv`.

Вкладка **Экскурсии** уже есть — ничего менять не нужно.

### 2. Credentials в n8n Cloud
n8n → **Credentials → New** создайте три штуки:
1. **Telegram API** — вставьте токен бота от BotFather. Назовите «Telegram - Tour bot».
2. **OpenAI API** — вставьте ваш OpenAI ключ. Назовите «OpenAI - Tour bot».
3. **Google Sheets OAuth2 API** — войдите Google-аккаунтом, где лежит таблица. Назовите «Google Sheets - Tour bot».

> 🔒 Секреты вводятся ТОЛЬКО здесь. В репозитории их нет.

### 3. Импорт workflow
n8n → **Workflows → Import from File** → выберите `n8n-workflow.json`.

### 4. Привязка credentials
Откройте ноды и в поле Credential выберите созданные:
- **Telegram Trigger** и **Send Reply** и **Deny** → Telegram - Tour bot
- **OpenAI Model** → OpenAI - Tour bot
- **Excursions / Hotels / Add_Hotel / Log_Order** → Google Sheets - Tour bot

### 5. Выбор документа и вкладок
В каждой Google-ноде (Excursions, Hotels, Add_Hotel, Log_Order):
- **Document** — выберите вашу таблицу из списка (или вставьте ID `1s3UBKo6xThoq2_bXhU6LCMeNWUM8dJgkrrBgJU17chA`).
- **Sheet** — выберите правильную вкладку из выпадающего списка
  (Excursions → ваша вкладка экскурсий; Hotels/Add_Hotel → «Отели»; Log_Order → «Заказы»).

### 6. Сверка колонок
Откройте ноду **Excursions** — n8n подтянет реальные названия колонок.
Если они отличаются от описанных в `sheets/Excursions-columns.md`, поправьте формулировки
в системном промпте ноды **AI Agent** (поле System Message), чтобы агент знал, где цена/дни/описание.

В нодах **Add_Hotel** и **Log_Order** проверьте, что названия колонок слева
совпадают с заголовками ваших вкладок «Отели» и «Заказы» (иначе записи уедут не в те колонки).

### 7. Активация
Включите тумблер **Active** вверху справа. n8n зарегистрирует webhook в Telegram автоматически.

### 8. Доступ
В ноде **Prepare** в массивах `ADMINS` и `MANAGERS` укажите Telegram ID сотрудников.
Сейчас админ — `488686339` (вы). Узнать чей-то ID: переслать его сообщение боту [@userinfobot](https://t.me/userinfobot).

## Как пользоваться

```
Вы:  джип сафари
Бот: 🏷 Джип Сафари · 💶 Взрослый 60 / Детский 30 · 📅 Вт,Чт,Сб · 🕐 08:00 · 🏢 XYZ Tours
     Поездка в горы с купанием...

Вы:  Grand Hotel Pomorie
Бот: 🚏 Остановка №1 (главный вход) · 🕐 08:30
     📍 https://maps.google.com/?q=...

Вы:  продай
Бот: Заполни данные клиента: 1. Имя 2. Телефон ...

Вы:  Иван, +359..., Grand Hotel Pomorie, 2 взр, 1 дет, 12.06, нал
Бот: 📩 СООБЩЕНИЕ КЛИЕНТУ (копировать) ... 🧾 ЧЕК / УЧЁТ ...
     (заказ записан во вкладку «Заказы»)
```

Админ дополнительно может: `добавь отель Hotel X остановка Y ссылка https://...`

## Тест без активации
Откройте workflow → **Test workflow** → напишите боту → смотрите выполнение по нодам.

## Возможные правки
- **Модель**: в ноде OpenAI Model можно сменить `gpt-4o-mini` на `gpt-4o` (точнее, дороже).
- **Память**: `contextWindowLength` в ноде Memory — сколько сообщений помнит бот.
- **Логика**: меняется в System Message ноды AI Agent (синхронно с `prompts/agent-system-prompt.md`).
