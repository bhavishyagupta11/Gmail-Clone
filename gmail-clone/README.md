# Gmail Clone - MERN Stack

A fully functional Gmail clone built with the MERN stack (MongoDB, Express.js, React, Node.js), featuring user authentication, email CRUD operations, Redux state management, and a responsive Gmail-like UI.

---

## Features

- User Registration & Login with JWT authentication
- Send, view, and delete emails
- Redux Toolkit for state management with redux-persist (sessions persist on refresh)
- Search/filter emails in real time
- Protected routes (unauthenticated users are redirected to login)
- Responsive Gmail-inspired UI with Tailwind CSS
- Collapsible sidebar with compose button
- Toast notifications for user feedback

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Redux Toolkit, React Router v6 |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB Atlas (via Mongoose)        |
| Auth      | JWT + HTTP-only cookies             |
| State     | Redux Toolkit + redux-persist       |

---

## Project Structure

```
gmail-clone/
├── backend/
│   ├── controllers/
│   │   ├── user.controller.js
│   │   └── email.controller.js
│   ├── db/
│   │   └── connectDB.js
│   ├── middleware/
│   │   └── isAuthenticated.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── email.model.js
│   ├── routes/
│   │   ├── user.route.js
│   │   └── email.route.js
│   ├── .env.example
│   ├── index.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Body.jsx
    │   │   ├── Inbox.jsx
    │   │   ├── Login.jsx
    │   │   ├── Mail.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── SendEmail.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Signup.jsx
    │   ├── redux/
    │   │   ├── appSlice.js
    │   │   └── store.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/gmail-clone.git
cd gmail-clone
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/gmail-clone
SECRET_KEY=your_super_secret_jwt_key
PORT=8080
```

Start the backend server:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:8080`.

---

## API Endpoints

### User Routes (`/api/v1/user`)

| Method | Endpoint    | Description         |
|--------|-------------|---------------------|
| POST   | `/register` | Register a new user |
| POST   | `/login`    | Login user          |
| GET    | `/logout`   | Logout user         |

### Email Routes (`/api/v1/email`) — All protected

| Method | Endpoint          | Description          |
|--------|-------------------|----------------------|
| POST   | `/create`         | Send a new email     |
| GET    | `/getallemails`   | Fetch all user emails|
| DELETE | `/:id`            | Delete an email      |

---

## Environment Variables

| Variable    | Description                     |
|-------------|---------------------------------|
| `MONGO_URI` | MongoDB connection string        |
| `SECRET_KEY`| JWT secret key                  |
| `PORT`      | Backend server port (default 8080) |

---

## Screenshots

> Login → Inbox → Compose → View Email flow

---

## License

MIT
