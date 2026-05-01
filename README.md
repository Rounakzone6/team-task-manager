# ⚡ TaskFlow — Team Task Manager

> A full-stack web application for team collaboration with role-based access control, task tracking, and a live Kanban board.

[![Live Demo](https://img.shields.io/badge/Live-Demo-6366f1?style=for-the-badge)](https://your-app.railway.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repo-gray?style=for-the-badge&logo=github)](https://github.com/your-username/taskflow)

---

## 📸 Screenshots

> _(Add screenshots of Dashboard, Projects, and Kanban board here)_

---

## 🚀 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS        |
| State      | TanStack React Query v5             |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose ODM              |
| Auth       | JWT (JSON Web Tokens) + bcryptjs    |
| Deployment | Railway (backend + frontend)        |

---

## ✨ Features

### Authentication
- Signup / Login with secure JWT tokens
- Auto-generated avatar via UI Avatars API
- Persistent sessions with localStorage
- Auto-logout on expired/invalid token

### Project Management
- Create, view, update, and delete projects
- Visual progress bar per project (completed/total tasks)
- Project status: `active`, `completed`, `archived`

### Team Management (Role-Based Access Control)
| Action                          | Admin | Member |
|---------------------------------|-------|--------|
| Create / delete tasks           | ✅    | ❌     |
| Update any task                 | ✅    | ❌     |
| Update status of assigned tasks | ✅    | ✅     |
| Add / remove members            | ✅    | ❌     |
| Delete project                  | ✅    | ❌     |

### Task Management
- Create tasks with title, description, priority, due date, assignee
- Kanban board: **To Do → In Progress → Completed**
- Overdue task detection and visual highlighting
- Filter tasks by status and priority

### Dashboard
- Greeting with time of day
- Stats: Total projects, In Progress, Completed, Overdue
- Recent projects panel
- My assigned tasks panel

---

## 🏗 Project Structure

```
taskflow/
├── backend/
│   ├── server.js               # Entry point
│   └── src/
│       ├── app.js              # Express app, middleware, routes
│       ├── config/db.js        # MongoDB connection
│       ├── models/
│       │   ├── User.js         # Schema + password hashing hook
│       │   ├── Project.js      # Schema + member embedding
│       │   └── Task.js         # Schema + overdue virtual + completedAt hook
│       ├── middleware/
│       │   ├── auth.js         # JWT protect + projectAdmin + projectMember
│       │   └── errorHandler.js # Global error normaliser
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── projectController.js
│       │   ├── taskController.js
│       │   └── userController.js
│       └── routes/
│           ├── auth.js
│           ├── projects.js
│           ├── tasks.js
│           └── users.js
│
└── frontend/
    └── src/
        ├── main.jsx            # Entry + providers
        ├── App.jsx             # Routing + protected routes
        ├── api/
        │   ├── axios.js        # Axios instance + JWT interceptor + 401 redirect
        │   └── index.js        # All API service functions
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── common/UI.jsx   # Modal, Badge, Spinner, EmptyState, ConfirmDialog
        │   └── layout/         # Layout, Sidebar, Topbar
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Projects.jsx
            ├── ProjectDetail.jsx  # Kanban board + member management
            └── MyTasks.jsx
```

---

## 🛠 Local Development Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/taskflow.git
cd taskflow
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET in .env
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
# For local dev, VITE_API_URL can stay empty (Vite proxy handles it)
npm run dev
```

### 4. Open in browser
```
http://localhost:5173
```

---

## 🌍 Deployment on Railway

### Backend
1. Create a new Railway project → **New Service → GitHub Repo → select `backend/`**
2. Add environment variables:
   ```
   MONGO_URI=<your MongoDB Atlas URI>
   JWT_SECRET=<random 64-char string>
   NODE_ENV=production
   CLIENT_URL=<your frontend Railway URL>
   ```
3. Railway auto-detects Node.js and runs `npm start`

### Frontend
1. Add another service → select `frontend/`
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set env variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```

---

## 🔌 API Reference

### Auth
| Method | Endpoint         | Description        | Auth |
|--------|------------------|--------------------|------|
| POST   | /api/auth/register | Register new user | No   |
| POST   | /api/auth/login    | Login             | No   |
| GET    | /api/auth/me       | Get current user  | Yes  |

### Projects
| Method | Endpoint                          | Description              | Role   |
|--------|-----------------------------------|--------------------------|--------|
| GET    | /api/projects                     | List user's projects     | Any    |
| POST   | /api/projects                     | Create project           | Any    |
| GET    | /api/projects/:id                 | Get project detail       | Member |
| PUT    | /api/projects/:id                 | Update project           | Admin  |
| DELETE | /api/projects/:id                 | Delete project + tasks   | Admin  |
| POST   | /api/projects/:id/members         | Add member               | Admin  |
| DELETE | /api/projects/:id/members/:userId | Remove member            | Admin  |

### Tasks
| Method | Endpoint              | Description           | Role            |
|--------|-----------------------|-----------------------|-----------------|
| GET    | /api/tasks            | Get tasks (filtered)  | Member          |
| POST   | /api/tasks            | Create task           | Admin           |
| GET    | /api/tasks/:id        | Get task detail       | Member          |
| PUT    | /api/tasks/:id        | Full update           | Admin/Assignee  |
| DELETE | /api/tasks/:id        | Delete task           | Admin           |
| PATCH  | /api/tasks/:id/status | Update status only    | Admin/Assignee  |

### Users
| Method | Endpoint           | Description         | Auth |
|--------|--------------------|---------------------|------|
| GET    | /api/users/search  | Search by name/email| Yes  |
| PUT    | /api/users/profile | Update own profile  | Yes  |

---

## 🔒 Security Design

- Passwords hashed with **bcryptjs** (salt rounds: 12)
- JWT signed with `HS256`, expires in 7 days
- `password` field has `select: false` — never returned in queries
- CORS restricted to `CLIENT_URL` in production
- All write operations validate membership + role before execution
- Express-validator used on all auth routes

---

## 📋 Design Decisions

**Why MongoDB?** Tasks and projects have a natural document structure. Embedding members inside projects avoids expensive joins for the most common query pattern.

**Why TanStack Query?** Eliminates boilerplate for loading/error states, provides automatic cache invalidation — crucial for real-time-feeling UX after mutations.

**Why Vite proxy in dev?** Avoids CORS issues locally without changing code. In production, `VITE_API_URL` is set to the Railway backend URL.

---

## 👤 Author

**Your Name**
- GitHub: [@your-username](https://github.com/your-username)
- Email: your@email.com
