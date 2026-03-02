# Gmail Clone - MERN + SMTP

A production-style Gmail clone built with MERN stack and JWT auth, featuring:
- app-to-app inbox delivery (registered users)
- optional real SMTP delivery to external email IDs
- MongoDB Atlas persistence

## Features
- Signup/Login/Logout with HTTP-only cookie JWT auth
- Session restore (`/user/me`) and expired-token handling
- Compose email with `Primary` / `Updates` category
- Folder views: Inbox, Updates, Starred, Sent, Spam
- Star/Spam toggle actions
- Email detail view with direct route support
- Profile menu + Settings page

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Redux Toolkit, React Router
- Backend: Node.js, Express, Mongoose
- DB: MongoDB Atlas
- Optional outbound email: Nodemailer (SMTP)

## Project Structure
```text
gmail-clone/
├── backend/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── .env.example
│   └── index.js
└── frontend/
    ├── src/
    ├── .env.example
    └── package.json
```

## Setup
### 1. Backend
```bash
cd backend
npm install
```

Create `backend/.env` from `backend/.env.example`:
```env
MONGO_URI=your_mongo_uri
SECRET_KEY=your_jwt_secret
PORT=8080
CLIENT_URL=http://localhost:5173

# Optional SMTP for real external email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_sender@gmail.com
SMTP_PASS=your_16_char_app_password
SMTP_FROM=your_sender@gmail.com
```

Start backend:
```bash
npm start
```

### 2. Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8080`

## Delivery Behavior
- If recipient email belongs to a registered app user: recipient gets an inbox copy.
- Sender always gets a sent copy.
- If SMTP is configured: real external email is also sent.
- If SMTP is not configured: only in-app delivery occurs.

## API Endpoints
### User (`/api/v1/user`)
- `POST /register`
- `POST /login`
- `GET /me`
- `GET /logout`

### Email (`/api/v1/email`) (auth required)
- `POST /create`
- `GET /getallemails`
- `GET /:id`
- `PATCH /:id`
- `DELETE /:id`

## Security Notes
- Never commit `.env` files.
- Rotate SMTP app passwords if exposed.
- Use strong `SECRET_KEY` in production.

## License
MIT