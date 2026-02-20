# Техническое Задание: Splitopus Mini App (API & Frontend)

## 🎯 Цель
Создать веб-интерфейс (Telegram Mini App) для существующего бота Splitopus.
Приложение должно работать с **существующей базой данных SQLite** и позволять просматривать расходы и добавлять новые.

## 🏗 Архитектура
*   **Язык:** Python 3.9+
*   **Backend:** FastAPI (для создания API endpoints).
*   **Database:** SQLite (файл `data/splitopus.db`). **Использовать существующую схему!**
*   **Frontend:** HTML/JS (можно использовать CDN библиотеки: TailwindCSS, Vue.js или Vanilla JS).

## 🗄 База Данных (Существующая схема)
Файл БД находится по пути: `data/splitopus.db`.
Скрипт создания таблиц (`src/schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    active_trip_id TEXT,
    state TEXT DEFAULT 'IDLE',
    linked_to TEXT,
    menu_msg_id INTEGER,
    temp_data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    creator_id TEXT,
    name TEXT,
    rate REAL DEFAULT 0,
    currency TEXT DEFAULT 'THB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trip_members (
    trip_id TEXT,
    user_id TEXT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id TEXT,
    payer_id TEXT,
    amount REAL,
    description TEXT,
    category TEXT,
    created_at INTEGER,
    split_json TEXT
);
```

## 🔌 API Endpoints (Backend: `api.py`)

Необходимо реализовать сервер на FastAPI (`api.py`), который будет работать параллельно с ботом.

### 1. `GET /api/trips/{user_id}`
Возвращает список поездок, в которых состоит пользователь.
*   **SQL:** `SELECT t.* FROM trips t JOIN trip_members tm ON t.id = tm.trip_id WHERE tm.user_id = ?`

### 2. `GET /api/expenses/{trip_id}`
Возвращает список всех трат для поездки.
*   **SQL:** `SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at DESC`

### 3. `POST /api/expenses`
Добавление новой траты.
*   **Body:**
    ```json
    {
      "trip_id": "trip_...",
      "payer_id": "12345",
      "amount": 500,
      "description": "Обед",
      "category": "FOOD",
      "split": {"12345": 250, "67890": 250}
    }
    ```
*   **Logic:** Записать в таблицу `expenses`, где `split` сохранить как JSON-строку в поле `split_json`.

## 🎨 Frontend (Mini App)

### Страница "Дашборд"
1.  Отображает текущую активную поездку.
2.  Показывает список последних трат (Дата, Кто платил, Сумма, Описание).
3.  Кнопка "Добавить трату" (+).

### Страница "Добавить трату"
1.  Поле ввода суммы.
2.  Выбор категории (иконки: Еда, Такси, и т.д.).
3.  Чекбоксы участников (загрузить список участников поездки).
4.  Кнопка "Сохранить" -> отправляет POST запрос на `/api/expenses`.

## ⚠️ Важные ограничения
1.  **НЕ МЕНЯТЬ** структуру базы данных (она используется ботом).
2.  Использовать `sqlite3` или `SQLAlchemy` (с подключением к существующему файлу).
3.  Frontend должен быть адаптивным (мобильная верстка).
