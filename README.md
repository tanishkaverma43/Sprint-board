# Agile Sprint Board

A simplified, single-board Kanban application for managing tasks across **To Do**, **In Progress** and **Done** columns — built with **Angular** (frontend) and **Node.js + Express + PostgreSQL** (backend).

## Tech Stack

| Layer      | Technology                                                            |
| ---------- | ---------------------------------------------------------------------- |
| Frontend   | Angular 17 (standalone components), Angular CDK Drag & Drop, RxJS, Reactive Forms |
| Backend    | Node.js, Express                                                       |
| Database   | PostgreSQL (via the `pg` driver)                                        |

## Project Structure

```
bixco/
├── backend/                 Node.js + Express REST API
│   ├── migrations/          SQL schema & seed scripts
│   └── src/
│       ├── config/          Database connection pool
│       ├── controllers/     Request handlers / business logic
│       ├── middleware/      Validation & centralized error handling
│       ├── routes/          Express route definitions
│       └── utils/           Migration runner
└── frontend/                 Angular client
    └── src/app/
        ├── core/             Models, HTTP services, interceptors
        └── features/board/   Board, columns, task card & form modal
```

## Features

- **Board** — three workflow columns: To Do, In Progress, Done.
- **Drag & Drop** — move cards between columns with `@angular/cdk/drag-drop`; the new status/position is persisted via `PATCH /api/tasks/:id/status`.
- **Task creation & editing** — a modal built with Angular Reactive Forms (validated title, description, status, priority, assignee).
- **Search & filter** — client-side, live filtering by title/description text and priority.
- **"Me" / "All" toggle (bonus)** — filters the board to tasks assigned to a mocked current user (`me`) or everyone.
- **REST API** — CRUD endpoints with input validation and centralized error handling middleware.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+ running locally (or accessible via connection string)

## 1. Database Setup

Create the database:

```bash
createdb agile_sprint_board
# or, from the psql shell:
# CREATE DATABASE agile_sprint_board;
```

Copy the backend environment file and adjust credentials if needed:

```bash
cd backend
cp .env.example .env
```

Run the migrations (creates the `tasks` table, enums, indexes and a trigger to keep `updated_at` fresh, then seeds a handful of sample tasks):

```bash
npm install
npm run migrate
```

The raw SQL is also available directly in `backend/migrations/` if you'd rather run it by hand with `psql`:

```bash
psql -d agile_sprint_board -f migrations/001_create_tasks_table.sql
psql -d agile_sprint_board -f migrations/002_seed_tasks.sql
```

## 2. Run the Backend

```bash
cd backend
npm install   # if not already installed
npm run dev   # nodemon, auto-restarts on change
# or: npm start
```

The API starts on `http://localhost:4000` (configurable via `PORT` in `.env`). Health check: `GET /api/health`.

### API Reference

| Method | Endpoint                  | Description                                  |
| ------ | -------------------------- | --------------------------------------------- |
| GET    | `/api/tasks`               | List tasks (supports `?status=&priority=&assigneeId=&search=`) |
| GET    | `/api/tasks/:id`            | Get a single task                             |
| POST   | `/api/tasks`                | Create a task                                 |
| PUT    | `/api/tasks/:id`             | Update task details (title/description/priority/status/assignee) |
| PATCH  | `/api/tasks/:id/status`      | Update only status + position (used by drag & drop) |
| DELETE | `/api/tasks/:id`             | Delete a task                                 |

## 3. Run the Frontend

```bash
cd frontend
npm install
npm start
```

The app runs on `http://localhost:4200` and proxies `/api/*` requests to the backend on port 4000 (see `frontend/proxy.conf.json`), so no CORS configuration is needed in development.

## Environment Variables (backend/.env)

```
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:4200

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=agile_sprint_board
```

## Design Notes

- **State management**: `TaskService` holds the task list in a `BehaviorSubject` and exposes it as `tasks$`; the board combines it with the search/priority filters (Reactive Forms) and the assignee toggle (a signal) via RxJS `combineLatest`, converted to a signal with `toSignal` for the template.
- **Error handling**: the backend uses an `asyncHandler` wrapper + centralized Express error middleware; the frontend uses a functional `HttpInterceptorFn` to surface failures as toast notifications while still letting components react locally.
- **Validation**: request bodies are validated in dedicated middleware before reaching controllers; the Angular form uses Reactive Forms validators (required, max length).
